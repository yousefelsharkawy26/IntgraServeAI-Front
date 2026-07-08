// ============================================================
// Chat WebSocket Hook — Backend-Compatible Protocol
// ============================================================
// This hook is fully compatible with the IntegraServeAI-Backend
// WebSocket protocol (apis/v1/chat.py + ai_engine/agent_runner.py).
//
// Backend protocol (source of truth):
//   Client → Server: { session_id, customer_email, customer_name }
//   Server → Client: { type: "connected", conversation_id }
//
//   Client → Server: { type: "chat"|"generate", content }
//   Server → Client: { type: "token", content }
//   Server → Client: { type: "tool_start", name, args }
//   Server → Client: { type: "tool_end", name, result }
//   Server → Client: { type: "tool_error", name, error }
//   Server → Client: { type: "pause", action_name, params, tool_call_id }
//   Server → Client: { type: "done" }
//
//   Client → Server: { type: "confirm", approved }
//   Server → Client: { type: "show_ticket_dialogue", action_name, params }
//
//   Client → Server: { type: "stop" }
//   Server → Client: { type: "stopped" }
//
//   Client → Server: { type: "edit", message_id, content }
//   Server → Client: { type: "edit_successful" }
//
//   Client → Server: { type: "end" }
//   Server → Client: { type: "ended" }
//
// IMPORTANT: The backend does NOT handle "tool_result" messages.
// Ticket creation is handled entirely by the frontend via REST API
// after receiving "show_ticket_dialogue".
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'
import { WS_API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { ChatMessage, PendingAction, ToolCallInfo, ToolStatus } from '../types'
import type { ActiveTool, ToolResultStatus } from '../tools/types'
import { diagnostics } from '../tools/diagnostics'

export interface ChatWebSocketOptions {
  customerEmail: string
  customerName: string
}

export interface UseChatWebSocketReturn {
  messages: ChatMessage[]
  connectionStatus: 'disconnected' | 'connecting' | 'connected'
  isTyping: boolean
  pendingAction: PendingAction | null
  toolCalls: ToolCallInfo[]
  activeTool: ActiveTool | null
  conversationId: string | null
  connect: () => void
  disconnect: () => void
  sendMessage: (content: string) => void
  sendGenerate: (content: string) => void
  editMessage: (messageId: string, newContent: string) => void
  removeMessage: (messageId: string) => void
  confirmAction: (approved: boolean) => void
  /**
   * Complete a tool locally (close UI, update state).
   * Does NOT send anything to the backend — the backend does not
   * handle tool_result messages. The backend protocol for ticket
   * tools is: pause → confirm → show_ticket_dialogue → (frontend
   * handles via REST API) → done.
   */
  sendToolResult: (toolCallId: string, status: ToolResultStatus, payload?: unknown) => void
  clearMessages: () => void
  stopGeneration: () => void
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getOrCreateSessionId(): string {
  const key = 'integra-chat-session'
  const stored = localStorage.getItem(key)
  if (stored) return stored
  const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  localStorage.setItem(key, id)
  return id
}

// -------------------------------------------------------
// Hook
// -------------------------------------------------------

export function useChatWebSocket({ customerEmail, customerName }: ChatWebSocketOptions): UseChatWebSocketReturn {
  // ---- State ----
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [toolCalls, setToolCalls] = useState<ToolCallInfo[]>([])
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null)

  // ---- Refs ----
  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef(getOrCreateSessionId())
  const conversationIdRef = useRef<string | null>(null)
  const aiMsgIdRef = useRef<string | null>(null)
  const aiBufferRef = useRef('')
  const rafPendingRef = useRef(false)
  const pendingTokensRef = useRef<string>('')
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const currentToolCallRef = useRef<ToolCallInfo | null>(null)
  const confirmSentRef = useRef(false)
  // Tracks the tool_call_id from the 'pause' event (the only event that includes it).
  // Used by 'show_ticket_dialogue' and 'sendToolResult' to identify the active tool.
  const activeToolCallIdRef = useRef<string | null>(null)

  // -------------------------------------------------------
  // rAF-batched flush of streaming tokens
  // -------------------------------------------------------
  const flushStreamingTokens = useCallback(() => {
    rafPendingRef.current = false
    const chunk = pendingTokensRef.current
    pendingTokensRef.current = ''
    if (!chunk || !aiMsgIdRef.current) return

    aiBufferRef.current += chunk

    setMessages((prev) => {
      const next = prev.slice()
      const idx = next.findIndex((m) => m.id === aiMsgIdRef.current)
      if (idx === -1) return prev
      const cur = next[idx]
      next[idx] = { ...cur, content: aiBufferRef.current, isStreaming: true }
      return next
    })
  }, [])

  const scheduleFlush = useCallback(() => {
    if (rafPendingRef.current) return
    rafPendingRef.current = true
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(flushStreamingTokens)
    } else {
      setTimeout(flushStreamingTokens, 16)
    }
  }, [flushStreamingTokens])

  // -------------------------------------------------------
  // Internal: finalize running tools (safety net for 'done' event)
  // -------------------------------------------------------
  const finalizeRunningTools = useCallback(() => {
    const now = new Date().toISOString()
    setToolCalls((prev) => {
      const nonTerminal: ToolStatus[] = ['running', 'waiting_for_approval', 'waiting_for_user_input']
      if (!prev.some((t) => nonTerminal.includes(t.status))) return prev
      return prev.map((t) =>
        nonTerminal.includes(t.status)
          ? { ...t, status: 'completed' as const, output: 'Completed', endTime: now }
          : t
      )
    })
    setMessages((prev) =>
      prev.map((m) => {
        const tool = m.toolCalls?.[0]
        const nonTerminal: ToolStatus[] = ['running', 'waiting_for_approval', 'waiting_for_user_input']
        if (!tool || !nonTerminal.includes(tool.status)) return m
        return {
          ...m,
          content: `${tool.name} completed`,
          toolCalls: [{ ...tool, status: 'completed' as const, output: 'Completed', endTime: now }],
        }
      })
    )
    currentToolCallRef.current = null
    activeToolCallIdRef.current = null
  }, [])

  // -------------------------------------------------------
  // Internal: update a tool's status by local ID
  // -------------------------------------------------------
  const updateToolStatus = useCallback(
    (localId: string, status: ToolStatus, output?: string) => {
      const now = new Date().toISOString()
      setToolCalls((prev) => {
        const target = prev.find((t) => t.id === localId)
        if (!target) return prev
        const updated: ToolCallInfo = { ...target, status, output: output ?? target.output, endTime: now }
        return prev.map((t) => (t.id === localId ? updated : t))
      })
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== localId || !m.toolCalls?.length) return m
          const tool = m.toolCalls[0]
          const updated: ToolCallInfo = { ...tool, status, output: output ?? tool.output, endTime: now }
          return { ...m, content: `${tool.name} ${status}`, toolCalls: [updated] }
        })
      )
    },
    []
  )

  // ---- Connection ----

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

    setConnectionStatus('connecting')
    const wsUrl = `${WS_API_BASE_URL}${API_ENDPOINTS.chat.ws}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return }

      // Backend handshake: expects { session_id, customer_email, customer_name }
      // Extra fields are ignored by the backend (harmless).
      ws.send(JSON.stringify({
        session_id: sessionIdRef.current,
        customer_email: customerEmail,
        customer_name: customerName,
      }))

      diagnostics.info('transport', 'WebSocket connected, handshake sent')
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      const data = JSON.parse(event.data)

      switch (data.type) {
        // =====================================================
        // Backend: { type: "connected", conversation_id }
        // =====================================================
        case 'connected': {
          setConnectionStatus('connected')
          conversationIdRef.current = data.conversation_id
          diagnostics.info('transport', 'Conversation established', {
            conversationId: data.conversation_id,
          })
          break
        }

        // =====================================================
        // Backend: { type: "token", content }
        // =====================================================
        case 'token': {
          if (!aiMsgIdRef.current) {
            const id = `ai-${generateId()}`
            aiMsgIdRef.current = id
            aiBufferRef.current = ''
            pendingTokensRef.current = ''
            setMessages((prev) => [...prev, {
              id,
              content: '',
              sender: 'ai',
              timestamp: new Date().toISOString(),
              isStreaming: true,
            }])
          }
          pendingTokensRef.current += data.content
          scheduleFlush()
          break
        }

        // =====================================================
        // Backend: { type: "tool_start", name, args }
        // NOTE: Backend does NOT send tool_call_id here.
        // NOTE: Backend sends "args" not "input".
        // =====================================================
        case 'tool_start': {
          diagnostics.info('lifecycle', 'Tool started', {
            actionName: data.name,
            args: data.args,
          })

          const localId = `tool-${generateId()}`
          const toolCall: ToolCallInfo = {
            id: localId,
            name: data.name || 'Tool',
            status: 'running',
            input: data.args || {},
            startTime: new Date().toISOString(),
          }

          currentToolCallRef.current = toolCall
          setToolCalls((prev) => [...prev, toolCall])
          setMessages((prev) => [...prev, {
            id: toolCall.id,
            content: `Running ${toolCall.name}...`,
            sender: 'system',
            timestamp: new Date().toISOString(),
            toolCalls: [toolCall],
          }])
          break
        }

        // =====================================================
        // Backend: { type: "tool_end", name, result }
        // NOTE: Backend does NOT send tool_call_id here.
        // NOTE: Backend sends "result" not "output".
        // NOTE: Backend does NOT send "status" — always success.
        // =====================================================
        case 'tool_end': {
          diagnostics.info('lifecycle', 'Tool ended', {
            actionName: data.name,
            result: data.result,
          })

          // Backend doesn't send tool_call_id in tool_end.
          // Use currentToolCallRef (set by tool_start) to find the tool.
          const completedTool = currentToolCallRef.current
          if (completedTool) {
            const outputText = data.result || 'Completed'
            updateToolStatus(completedTool.id, 'completed', outputText)
            currentToolCallRef.current = null
          }
          break
        }

        // =====================================================
        // Backend: { type: "tool_error", name, error }
        // This is a SEPARATE event type from tool_end.
        // =====================================================
        case 'tool_error': {
          diagnostics.error('lifecycle', 'Tool error', {
            actionName: data.name,
            error: data.error,
          })

          const errorTool = currentToolCallRef.current
          if (errorTool) {
            updateToolStatus(errorTool.id, 'failed', data.error || 'Tool execution failed')
            currentToolCallRef.current = null
          }
          break
        }

        // =====================================================
        // Backend: { type: "pause", reason, action_name, params, tool_call_id }
        // This is the ONLY event that includes tool_call_id.
        // =====================================================
        case 'pause': {
          if (rafPendingRef.current) flushStreamingTokens()
          setIsTyping(false)
          if (aiMsgIdRef.current) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m
              )
            )
          }
          confirmSentRef.current = false

          // Store the tool_call_id from pause (the only event that has it)
          const pauseToolCallId: string | undefined = data.tool_call_id
          if (pauseToolCallId) activeToolCallIdRef.current = pauseToolCallId

          // Transition the current tool to waiting_for_approval
          if (currentToolCallRef.current) {
            updateToolStatus(currentToolCallRef.current.id, 'waiting_for_approval')
          }

          diagnostics.info('lifecycle', 'Approval required', {
            actionName: data.action_name,
            toolCallId: pauseToolCallId,
          })

          setPendingAction({
            toolCallId: data.tool_call_id || 'unknown',
            actionName: data.action_name || 'Action',
            params: data.params || {},
          })
          break
        }

        // =====================================================
        // Backend: { type: "done" }
        // =====================================================
        case 'done': {
          if (rafPendingRef.current) flushStreamingTokens()
          setIsTyping(false)
          if (aiMsgIdRef.current) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m
              )
            )
          }
          aiMsgIdRef.current = null
          aiBufferRef.current = ''

          // Safety net: finalize any tools still in non-terminal states.
          finalizeRunningTools()
          break
        }

        // =====================================================
        // Backend: { type: "error", message }
        // =====================================================
        case 'error': {
          if (rafPendingRef.current) flushStreamingTokens()
          setIsTyping(false)
          diagnostics.error('transport', 'Backend error', { message: data.message })
          setMessages((prev) => [...prev, {
            id: `err-${generateId()}`,
            content: data.message || 'An error occurred.',
            sender: 'system',
            timestamp: new Date().toISOString(),
            isError: true,
          } as ChatMessage])
          break
        }

        // =====================================================
        // Backend: { type: "ended" }
        // =====================================================
        case 'ended': {
          setConnectionStatus('disconnected')
          break
        }

        // =====================================================
        // Backend: { type: "edit_successful" }
        // =====================================================
        case 'edit_successful': {
          break
        }

        // =====================================================
        // Backend: { type: "stopped" }
        // =====================================================
        case 'stopped': {
          if (rafPendingRef.current) flushStreamingTokens()
          setIsTyping(false)
          if (aiMsgIdRef.current) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m
              )
            )
          }
          break
        }

        // =====================================================
        // Backend: { type: "show_ticket_dialogue", action_name, params }
        // NOTE: Backend does NOT send tool_call_id here.
        // This is sent after the user approves a ticket creation action.
        // The backend does NOT resume the AI stream after this — the
        // frontend handles ticket creation via REST API independently.
        // =====================================================
        case 'show_ticket_dialogue': {
          setIsTyping(false)

          diagnostics.info('lifecycle', 'Ticket dialogue requested', {
            actionName: data.action_name,
          })

          // Transition the current tool to waiting_for_user_input
          if (currentToolCallRef.current) {
            updateToolStatus(currentToolCallRef.current.id, 'waiting_for_user_input')
          }

          // Set the active tool — ToolRenderer will look up the component.
          // Use activeToolCallIdRef (set during 'pause') as the tool_call_id
          // since the backend doesn't send it in show_ticket_dialogue.
          setActiveTool({
            toolCallId: activeToolCallIdRef.current || 'unknown',
            actionName: data.action_name || 'unknown',
            params: data.params || {},
            startedAt: Date.now(),
          })
          break
        }
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      if (rafPendingRef.current) flushStreamingTokens()
      setConnectionStatus('disconnected')
      setIsTyping(false)
      aiMsgIdRef.current = null
      aiBufferRef.current = ''
      diagnostics.warn('transport', 'WebSocket disconnected, reconnecting in 3s')
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [customerEmail, customerName, scheduleFlush, flushStreamingTokens, finalizeRunningTools, updateToolStatus])

  // ---- Disconnect ----

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'end' }))
      }
      wsRef.current.close()
      wsRef.current = null
    }
    if (rafPendingRef.current) {
      rafPendingRef.current = false
    }
    pendingTokensRef.current = ''
    setConnectionStatus('disconnected')
    aiMsgIdRef.current = null
    aiBufferRef.current = ''
  }, [])

  // ---- Send Message ----
  // Backend expects: { type: "chat", content }

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const userMsg: ChatMessage = {
      id: `user-${generateId()}`,
      content: content.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)
    setPendingAction(null)
    confirmSentRef.current = false

    ws.send(JSON.stringify({ type: 'chat', content: content.trim() }))
  }, [])

  // ---- Send Generate ----
  // Backend expects: { type: "generate", content }

  const sendGenerate = useCallback((content: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    setIsTyping(true)
    setPendingAction(null)
    confirmSentRef.current = false
    ws.send(JSON.stringify({ type: 'generate', content: content.trim() }))
  }, [])

  // ---- Stop Generation ----
  // Backend expects: { type: "stop" }

  const stopGeneration = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'stop' }))
    if (rafPendingRef.current) flushStreamingTokens()
    setIsTyping(false)
  }, [flushStreamingTokens])

  // ---- Edit Message ----
  // Backend expects: { type: "edit", message_id, content }

  const editMessage = useCallback((messageId: string, newContent: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    setMessages((prev) => prev.map((m) =>
      m.id === messageId ? { ...m, content: newContent, is_edited: true } : m
    ))
    setIsTyping(true)
    setPendingAction(null)

    ws.send(JSON.stringify({
      type: 'edit',
      message_id: messageId,
      content: newContent,
    }))
  }, [])

  // ---- Remove Message ----

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  // ---- Confirm Action ----
  // Backend expects: { type: "confirm", approved: true|false }
  //
  // When approved:
  //   - For ticket tools: backend sends show_ticket_dialogue, does NOT resume AI
  //   - For other tools: backend executes the action and resumes AI stream
  //
  // When declined:
  //   - Backend appends "Action aborted by user" ToolMessage and resumes AI
  //   - Backend does NOT expect any additional message from frontend

  const confirmAction = useCallback((approved: boolean) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    if (confirmSentRef.current) return
    confirmSentRef.current = true

    // Send the confirm message — this is the ONLY message the backend expects
    ws.send(JSON.stringify({ type: 'confirm', approved }))
    setPendingAction(null)
    setIsTyping(true)

    if (approved) {
      // Transition the tool back to 'running' — the backend will execute it
      if (currentToolCallRef.current) {
        updateToolStatus(currentToolCallRef.current.id, 'running')
      }
    } else {
      // User declined — the backend will resume AI with "Action aborted" message.
      // Mark the tool as cancelled locally.
      if (currentToolCallRef.current) {
        updateToolStatus(currentToolCallRef.current.id, 'cancelled', 'Declined by user')
        currentToolCallRef.current = null
      }
      activeToolCallIdRef.current = null
    }
  }, [updateToolStatus])

  // ---- Send Tool Result (Local Only) ----
  // The backend does NOT handle "tool_result" messages.
  // This function only updates local state (closes tool UI, updates status).
  // The backend protocol for ticket tools is:
  //   pause → confirm(approved) → show_ticket_dialogue → (frontend REST API) → done
  // No WebSocket message is sent back to the backend.

  const sendToolResult = useCallback((_toolCallId: string, status: ToolResultStatus, _payload?: unknown) => {
    // Close the tool UI
    setActiveTool(null)

    // Map ToolResultStatus to ToolStatus
    const toolStatusMap: Record<ToolResultStatus, ToolStatus> = {
      success: 'completed',
      cancelled: 'cancelled',
      failed: 'failed',
    }
    const toolStatus = toolStatusMap[status] || 'completed'

    // Update the tool status locally
    if (currentToolCallRef.current) {
      updateToolStatus(currentToolCallRef.current.id, toolStatus, status === 'success' ? 'Completed' : status)
      if (toolStatus !== 'running') {
        currentToolCallRef.current = null
      }
    }

    activeToolCallIdRef.current = null

    diagnostics.info('lifecycle', 'Tool result (local only)', {
      toolCallId: _toolCallId,
      status,
    })
  }, [updateToolStatus])

  // ---- Clear Messages ----

  const clearMessages = useCallback(() => {
    setMessages([])
    setToolCalls([])
    setActiveTool(null)
    aiMsgIdRef.current = null
    aiBufferRef.current = ''
    pendingTokensRef.current = ''
    rafPendingRef.current = false
    confirmSentRef.current = false
    currentToolCallRef.current = null
    activeToolCallIdRef.current = null
  }, [])

  // ---- Lifecycle ----

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [disconnect])

  return {
    messages,
    connectionStatus,
    isTyping,
    pendingAction,
    toolCalls,
    activeTool,
    conversationId: conversationIdRef.current,
    connect,
    disconnect,
    sendMessage,
    sendGenerate,
    editMessage,
    removeMessage,
    confirmAction,
    sendToolResult,
    clearMessages,
    stopGeneration,
  }
}
