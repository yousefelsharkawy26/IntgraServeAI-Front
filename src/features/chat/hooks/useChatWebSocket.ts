// ============================================================
// Chat WebSocket Hook — Protocol-Driven Human Tool Runtime
// ============================================================
// This hook implements the generic Human Tool Runtime protocol.
// The backend is the single source of truth for tool lifecycle.
//
// Protocol (backend is source of truth):
//
//   Handshake:
//     Client → Server: { session_id, customer_email, customer_name }
//     Server → Client: { type: "connected", conversation_id }
//
//   Chat:
//     Client → Server: { type: "chat"|"generate", content }
//     Server → Client: { type: "token", content }
//     Server → Client: { type: "tool_start", name, args }
//     Server → Client: { type: "tool_end", name, result }
//     Server → Client: { type: "tool_error", name, error }
//     Server → Client: { type: "pause", action_name, params, tool_call_id }
//     Server → Client: { type: "done" }
//
//   Human Approval:
//     Client → Server: { type: "confirm", approved }
//     Server → Client: { type: "tool_input_required", action_name, tool_call_id, params }
//
//   Human Tool Result (GENERIC — replaces all tool-specific flows):
//     Client → Server: { type: "tool_result", tool_call_id, result }
//     (Backend resumes AI execution with the result as a ToolMessage)
//
//   Control:
//     Client → Server: { type: "stop" }
//     Server → Client: { type: "stopped" }
//     Client → Server: { type: "edit", message_id, content }
//     Server → Client: { type: "edit_successful" }
//     Client → Server: { type: "end" }
//     Server → Client: { type: "ended" }
//
// IMPORTANT: The frontend NEVER decides a tool is completed.
// Tool status only changes when the backend emits lifecycle events.
// The only local states are: editing, loading, validating.
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'
import { WS_API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { ChatMessage, PendingAction, ToolCallInfo, ToolStatus } from '../types'
import type { ActiveTool, ToolResultStatus } from '../tools/types'
import { diagnostics } from '../tools/diagnostics'

export interface ChatWebSocketOptions {
  customerEmail: string
  customerName: string
  token?: string | null
  sessionId?: string | null
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
  sendMessage: (content: string) => boolean
  sendGenerate: (content: string) => void
  editMessage: (messageId: string, newContent: string) => void
  removeMessage: (messageId: string) => void
  confirmAction: (approved: boolean) => void
  /**
   * Send a tool result to the backend.
   * This is the GENERIC way for tools to report their outcome.
   * The backend receives the result, creates a ToolMessage,
   * and resumes the AI execution. The backend will eventually
   * emit tool_end or tool_error.
   *
   * The frontend NEVER marks a tool as completed locally.
   * The backend is the single source of truth.
   */
  sendToolResult: (toolCallId: string, status: ToolResultStatus, payload?: unknown) => void
  hydrateMessages: (messages: ChatMessage[]) => void
  clearMessages: () => void
  resetChatState: () => void
  stopGeneration: () => void
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildWebSocketUrl(path: string, token?: string | null): string {
  const base = typeof window !== 'undefined' ? window.location.href : 'http://localhost'
  const url = new URL(path, base)

  if (url.protocol === 'https:') url.protocol = 'wss:'
  else if (url.protocol === 'http:') url.protocol = 'ws:'

  if (token) url.searchParams.set('token', token)
  return url.toString()
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

export function useChatWebSocket({ customerEmail, customerName, token, sessionId }: ChatWebSocketOptions): UseChatWebSocketReturn {
  // ---- State ----
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [toolCalls, setToolCalls] = useState<ToolCallInfo[]>([])
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // ---- Refs ----
  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef(sessionId || getOrCreateSessionId())
  const conversationIdRef = useRef<string | null>(null)
  const aiMsgIdRef = useRef<string | null>(null)
  const aiBufferRef = useRef('')
  const rafPendingRef = useRef(false)
  const pendingTokensRef = useRef<string>('')
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const currentToolCallRef = useRef<ToolCallInfo | null>(null)
  const confirmSentRef = useRef(false)
  // Tracks the tool_call_id from the 'pause' event.
  // Used by 'tool_input_required' and 'sendToolResult'.
  const activeToolCallIdRef = useRef<string | null>(null)
  // Tracks the intended terminal state when sendToolResult is called.
  // Used by finalizeRunningTools to preserve the correct status.
  const intendedTerminalStatesRef = useRef<Map<string, ToolStatus>>(new Map())
  // Prevents duplicate tool_result sends (similar to confirmSentRef)
  const resultSentRef = useRef(false)
  // Marks that we're stopping generation (prevents premature cleanup)
  const stoppingRef = useRef(false)

  useEffect(() => {
    if (sessionId) {
      sessionIdRef.current = sessionId
    }
  }, [sessionId])

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
  // Only used as a fallback when the backend doesn't send tool_end.
  // -------------------------------------------------------
  const finalizeRunningTools = useCallback(() => {
    const now = new Date().toISOString()
    const intendedStates = intendedTerminalStatesRef.current
    const nonTerminal: ToolStatus[] = ['running', 'waiting_for_approval', 'waiting_for_user_input', 'retrying']
    
    setToolCalls((prev) => {
      if (!prev.some((t) => nonTerminal.includes(t.status))) return prev
      
      return prev.map((t) => {
        if (!nonTerminal.includes(t.status)) return t
        
        // Use intended state if this is the tool we're tracking
        const intendedStatus = intendedStates.get(t.id)
        if (intendedStatus) {
          const outputText = intendedStatus === 'completed' ? 'Completed' :
                           intendedStatus === 'cancelled' ? 'Cancelled by user' :
                           intendedStatus === 'failed' ? 'Failed' : 'Completed'
          intendedStates.delete(t.id)
          return { ...t, status: intendedStatus, output: outputText, endTime: now }
        }
        
        // Default to completed for other tools
        return { ...t, status: 'completed' as const, output: 'Completed', endTime: now }
      })
    })
    
    setMessages((prev) =>
      prev.map((m) => {
        const tool = m.toolCalls?.[0]
        if (!tool || !nonTerminal.includes(tool.status)) return m
        
        // Use intended state if this is the tool we're tracking
        const intendedStatus = intendedStates.get(m.id)
        if (intendedStatus) {
          const outputText = intendedStatus === 'completed' ? 'Completed' :
                           intendedStatus === 'cancelled' ? 'Cancelled by user' :
                           intendedStatus === 'failed' ? 'Failed' : 'Completed'
          return {
            ...m,
            content: `${tool.name} ${intendedStatus}`,
            toolCalls: [{ ...tool, status: intendedStatus, output: outputText, endTime: now }],
          }
        }
        
        return {
          ...m,
          content: `${tool.name} completed`,
          toolCalls: [{ ...tool, status: 'completed' as const, output: 'Completed', endTime: now }],
        }
      })
    )
    
    // Clear the refs
    intendedStates.clear()
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

  const finalizeStreamingMessages = useCallback(() => {
    if (rafPendingRef.current) flushStreamingTokens()

    setMessages((prev) =>
      prev.map((message) =>
        message.sender === 'ai' && message.isStreaming
          ? { ...message, isStreaming: false }
          : message
      )
    )

    aiMsgIdRef.current = null
    aiBufferRef.current = ''
    pendingTokensRef.current = ''
    rafPendingRef.current = false
  }, [flushStreamingTokens])

  // ---- Connection ----

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

    setConnectionStatus('connecting')
    const wsUrl = buildWebSocketUrl(`${WS_API_BASE_URL}${API_ENDPOINTS.chat.ws}`, token)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return }

      // Backend handshake: { session_id, customer_email, customer_name }
      ws.send(JSON.stringify({
        session_id: sessionIdRef.current,
        customer_email: customerEmail,
        customer_name: customerName,
        ...(token ? { token } : {}),
      }))

      diagnostics.info('transport', 'WebSocket connected, handshake sent')
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      const data = JSON.parse(event.data)

      switch (data.type) {
        // =====================================================
        // { type: "connected", conversation_id }
        // =====================================================
        case 'connected': {
          setConnectionStatus('connected')
          conversationIdRef.current = data.conversation_id
          setConversationId(data.conversation_id)
          diagnostics.info('transport', 'Conversation established', {
            conversationId: data.conversation_id,
          })
          break
        }

        // =====================================================
        // { type: "token", content }
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
        // { type: "tool_start", name, args }
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
        // { type: "tool_end", name, result }
        // Backend is the source of truth — this is the ONLY way
        // a tool reaches a terminal state.
        // =====================================================
        case 'tool_end': {
          diagnostics.info('lifecycle', 'Tool ended (backend)', {
            actionName: data.name,
            result: data.result,
          })

          const completedTool = currentToolCallRef.current
          if (completedTool) {
            // Check if we have an intended status for this tool
            const intendedStatus = intendedTerminalStatesRef.current.get(completedTool.id)
            const outputText = data.result || 'Completed'
            
            if (intendedStatus) {
              // Use the intended status (e.g., cancelled, failed)
              const finalOutput = intendedStatus === 'completed' ? outputText : 
                                intendedStatus === 'cancelled' ? 'Cancelled by user' : 
                                intendedStatus === 'failed' ? 'Failed' : outputText
              updateToolStatus(completedTool.id, intendedStatus, finalOutput)
              intendedTerminalStatesRef.current.delete(completedTool.id)
            } else {
              // No intended status, use backend's completed status
              updateToolStatus(completedTool.id, 'completed', outputText)
            }
            
            currentToolCallRef.current = null
          }
          
          // If we were stopping, clear the flag
          if (stoppingRef.current) {
            stoppingRef.current = false
          }
          break
        }

        // =====================================================
        // { type: "tool_error", name, error }
        // =====================================================
        case 'tool_error': {
          diagnostics.error('lifecycle', 'Tool error (backend)', {
            actionName: data.name,
            error: data.error,
          })

          const errorTool = currentToolCallRef.current
          if (errorTool) {
            // Check if we have an intended status for this tool
            const intendedStatus = intendedTerminalStatesRef.current.get(errorTool.id)
            
            if (intendedStatus && intendedStatus !== 'failed') {
              // Use the intended status if it's not already failed
              const finalOutput = intendedStatus === 'cancelled' ? 'Cancelled by user' : data.error || 'Tool execution failed'
              updateToolStatus(errorTool.id, intendedStatus, finalOutput)
              intendedTerminalStatesRef.current.delete(errorTool.id)
            } else {
              // Use failed status from backend
              updateToolStatus(errorTool.id, 'failed', data.error || 'Tool execution failed')
            }
            
            currentToolCallRef.current = null
          }
          
          // If we were stopping, clear the flag
          if (stoppingRef.current) {
            stoppingRef.current = false
          }
          break
        }

        // =====================================================
        // { type: "pause", reason, action_name, params, tool_call_id }
        // Human approval required. The ONLY event with tool_call_id.
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

          const pauseToolCallId: string | undefined = data.tool_call_id
          if (pauseToolCallId) activeToolCallIdRef.current = pauseToolCallId

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
        // { type: "tool_input_required", action_name, tool_call_id, params }
        // GENERIC event: backend requests human input for ANY tool.
        // Replaces the old tool-specific "show_ticket_dialogue".
        // The frontend opens the tool UI, collects input, and sends
        // tool_result back to the backend.
        // =====================================================
        case 'tool_input_required':
        case 'show_ticket_dialogue': { // Backward compatibility alias
          setIsTyping(false)

          const inputToolCallId = data.tool_call_id || activeToolCallIdRef.current || 'unknown'

          diagnostics.info('lifecycle', 'Tool input required', {
            actionName: data.action_name,
            toolCallId: inputToolCallId,
          })

          // Guard: Don't open the modal if it's already open for this tool
          // This prevents duplicate modals if the event is received multiple times
          if (activeTool && activeTool.toolCallId === inputToolCallId) {
            diagnostics.warn('lifecycle', 'Tool input modal already open, ignoring duplicate event', {
              toolCallId: inputToolCallId,
            })
            break
          }

          // Reset the result sent guard for this new tool input request
          resultSentRef.current = false

          // Transition the tool to waiting_for_user_input
          if (currentToolCallRef.current) {
            updateToolStatus(currentToolCallRef.current.id, 'waiting_for_user_input')
          }

          // Set the active tool — ToolRenderer will look up the component
          setActiveTool({
            toolCallId: inputToolCallId,
            actionName: data.action_name || 'unknown',
            params: data.params || {},
            startedAt: Date.now(),
          })
          break
        }

        // =====================================================
        // { type: "done" }
        // =====================================================
        case 'done': {
          finalizeStreamingMessages()
          setIsTyping(false)

          // Safety net: finalize any tools still in non-terminal states.
          // This should rarely trigger — the backend should always send
          // tool_end before done.
          finalizeRunningTools()
          break
        }

        // =====================================================
        // { type: "error", message }
        // =====================================================
        case 'error': {
          finalizeStreamingMessages()
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

        case 'ended': {
          setConnectionStatus('disconnected')
          break
        }

        // =====================================================
        // { type: "restore_approval", action_name, tool_call_id, params }
        // Sent after reconnect if there's a pending approval.
        // Restores the approval card so the user can approve/decline.
        // =====================================================
        case 'restore_approval': {
          diagnostics.info('lifecycle', 'Restoring approval state after reconnect', {
            actionName: data.action_name,
            toolCallId: data.tool_call_id,
          })

          if (data.tool_call_id) activeToolCallIdRef.current = data.tool_call_id

          // Use a functional update to read current toolCalls state,
          // avoiding stale closure over the toolCalls variable.
          setToolCalls((currentToolCalls) => {
            const existingToolCall = currentToolCalls.find(t => t.serverToolCallId === data.tool_call_id)
            
            if (!existingToolCall) {
              const localId = `tool-${generateId()}`
              const toolCall: ToolCallInfo = {
                id: localId,
                serverToolCallId: data.tool_call_id,
                name: data.action_name || 'Tool',
                status: 'waiting_for_approval',
                input: data.params || {},
                startTime: new Date().toISOString(),
              }

              currentToolCallRef.current = toolCall

              setMessages((prev) => [...prev, {
                id: localId,
                content: `Waiting for approval: ${toolCall.name}`,
                sender: 'system',
                timestamp: new Date().toISOString(),
                toolCalls: [toolCall],
              }])

              return [...currentToolCalls, toolCall]
            } else {
              currentToolCallRef.current = existingToolCall
              return currentToolCalls
            }
          })

          setPendingAction({
            toolCallId: data.tool_call_id || 'unknown',
            actionName: data.action_name || 'Action',
            params: data.params || {},
          })
          setIsTyping(false)
          break
        }

        // =====================================================
        // { type: "restore_tool_input", action_name, tool_call_id, params }
        // Sent after reconnect if there's a pending tool_input_required.
        // Restores the tool UI so the user can complete the interaction.
        // =====================================================
        case 'restore_tool_input': {
          diagnostics.info('lifecycle', 'Restoring tool input state after reconnect', {
            actionName: data.action_name,
            toolCallId: data.tool_call_id,
          })

          const restoreToolCallId = data.tool_call_id || activeToolCallIdRef.current || 'unknown'
          if (data.tool_call_id) activeToolCallIdRef.current = data.tool_call_id

          // Use a functional update to read current toolCalls state,
          // avoiding stale closure over the toolCalls variable.
          setToolCalls((currentToolCalls) => {
            const existingToolCall = currentToolCalls.find(t => t.serverToolCallId === data.tool_call_id)
            
            if (!existingToolCall) {
              const localId = `tool-${generateId()}`
              const toolCall: ToolCallInfo = {
                id: localId,
                serverToolCallId: data.tool_call_id,
                name: data.action_name || 'Tool',
                status: 'waiting_for_user_input',
                input: data.params || {},
                startTime: new Date().toISOString(),
              }

              currentToolCallRef.current = toolCall

              setMessages((prev) => [...prev, {
                id: localId,
                content: `Waiting for user input: ${toolCall.name}`,
                sender: 'system',
                timestamp: new Date().toISOString(),
                toolCalls: [toolCall],
              }])

              return [...currentToolCalls, toolCall]
            } else {
              currentToolCallRef.current = existingToolCall
              return currentToolCalls
            }
          })

          setActiveTool({
            toolCallId: restoreToolCallId,
            actionName: data.action_name || 'unknown',
            params: data.params || {},
            startedAt: Date.now(),
          })
          setIsTyping(false)
          break
        }

        case 'edit_successful': {
          break
        }

        case 'stopped': {
          finalizeStreamingMessages()
          setIsTyping(false)
          break
        }
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      finalizeStreamingMessages()
      setConnectionStatus('disconnected')
      setIsTyping(false)
      diagnostics.warn('transport', 'WebSocket disconnected, reconnecting in 3s')
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [customerEmail, customerName, token, sessionId, scheduleFlush, flushStreamingTokens, finalizeStreamingMessages, finalizeRunningTools, updateToolStatus])

  // ---- Disconnect ----

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    finalizeStreamingMessages()
    setConnectionStatus('disconnected')
  }, [finalizeStreamingMessages])

  // ---- Send Message ----

  const sendMessage = useCallback((content: string): boolean => {
    if (!content.trim()) return false
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false

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
    return true
  }, [])

  // ---- Send Generate ----

  const sendGenerate = useCallback((content: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    setIsTyping(true)
    setPendingAction(null)
    confirmSentRef.current = false
    ws.send(JSON.stringify({ type: 'generate', content: content.trim() }))
  }, [])

  // ---- Stop Generation ----

  const stopGeneration = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    
    // Mark that we're stopping (prevents premature cleanup)
    stoppingRef.current = true
    
    ws.send(JSON.stringify({ type: 'stop' }))
    if (rafPendingRef.current) flushStreamingTokens()
    setIsTyping(false)
    
    // Don't immediately clear state - wait for backend terminal events
    // (tool_end, tool_error, or done will handle cleanup)
    // Only clear these immediately:
    setPendingAction(null)
    setActiveTool(null)
    resultSentRef.current = false
    confirmSentRef.current = false
    
    // Set a timeout to force cleanup if no terminal event arrives within 5 seconds
    setTimeout(() => {
      if (stoppingRef.current) {
        stoppingRef.current = false
        currentToolCallRef.current = null
        activeToolCallIdRef.current = null
      }
    }, 5000)
  }, [flushStreamingTokens])

  // ---- Edit Message ----

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
  // Sends { type: "confirm", approved } to the backend.
  //
  // When approved:
  //   - For interactive tools: backend sends tool_input_required
  //   - For non-interactive tools: backend executes and resumes AI
  //
  // When declined:
  //   - Backend appends "Action aborted" ToolMessage and resumes AI

  const confirmAction = useCallback((approved: boolean) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    if (confirmSentRef.current) return
    confirmSentRef.current = true

    ws.send(JSON.stringify({ type: 'confirm', approved }))
    setPendingAction(null)
    setIsTyping(true)

    if (approved) {
      // Don't transition to 'running' optimistically — let backend events drive the state.
      // Backend will send either:
      // 1. tool_end (non-interactive) → completed
      // 2. tool_input_required (interactive) → waiting_for_user_input
      // This avoids the brief flicker: waiting_for_approval → running → waiting_for_user_input
    } else {
      // User declined — backend resumes AI with "Action aborted".
      // Mark tool as cancelled locally (backend will confirm via tool_end or done).
      if (currentToolCallRef.current) {
        updateToolStatus(currentToolCallRef.current.id, 'cancelled', 'Declined by user')
        currentToolCallRef.current = null
      }
      activeToolCallIdRef.current = null
    }
  }, [updateToolStatus])

  // ---- Send Tool Result ----
  // GENERIC: sends { type: "tool_result", tool_call_id, result } to the backend.
  // The backend receives the result, creates a ToolMessage, and resumes AI.
  // The frontend does NOT mark the tool as completed — the backend will
  // emit tool_end when execution is truly done.
  //
  // This replaces ALL tool-specific flows (ticket creation, product selection,
  // calendar picking, etc.) with a single generic protocol.

  const sendToolResult = useCallback((toolCallId: string, status: ToolResultStatus, payload?: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      diagnostics.error('transport', 'Cannot send tool_result: WebSocket not open', {
        toolCallId,
        status,
      })
      return
    }

    // Prevent duplicate sends (similar to confirmSentRef)
    if (resultSentRef.current) {
      diagnostics.warn('transport', 'Duplicate tool_result prevented', { toolCallId })
      return
    }
    resultSentRef.current = true

    // Build the result payload based on status
    let resultPayload: unknown
    if (status === 'success') {
      resultPayload = payload ?? {}
    } else if (status === 'cancelled') {
      resultPayload = { cancelled: true, reason: 'User cancelled' }
    } else {
      resultPayload = { error: (payload as any)?.error || 'Tool failed' }
    }

    // Track the intended terminal state so finalizeRunningTools can preserve it
    if (currentToolCallRef.current) {
      const toolStatus: ToolStatus = status === 'success' ? 'completed' : 
                                     status === 'cancelled' ? 'cancelled' : 'failed'
      intendedTerminalStatesRef.current.set(currentToolCallRef.current.id, toolStatus)
    }

    // Send tool_result to the backend
    ws.send(JSON.stringify({
      type: 'tool_result',
      tool_call_id: toolCallId,
      result: resultPayload,
    }))

    diagnostics.info('transport', 'Tool result sent to backend', {
      toolCallId,
      status,
      payload: resultPayload,
    })

    // Close the tool UI immediately
    setActiveTool(null)

    // Transition tool to 'running' — the backend is now processing the result
    // and will emit tool_end when done. The frontend does NOT mark it completed.
    if (currentToolCallRef.current) {
      updateToolStatus(currentToolCallRef.current.id, 'running', 'Processing result...')
    }

    setIsTyping(true)
  }, [updateToolStatus])

  // ---- Clear Messages ----

  const clearMessages = useCallback(() => {
    setMessages([])
    setToolCalls([])
    setActiveTool(null)
    setPendingAction(null)
    setIsTyping(false)
    aiMsgIdRef.current = null
    aiBufferRef.current = ''
    pendingTokensRef.current = ''
    rafPendingRef.current = false
    confirmSentRef.current = false
    resultSentRef.current = false
    currentToolCallRef.current = null
    activeToolCallIdRef.current = null
    intendedTerminalStatesRef.current.clear()
  }, [])

  const hydrateMessages = useCallback((nextMessages: ChatMessage[]) => {
    clearMessages()
    setMessages(nextMessages)
  }, [clearMessages])

  const resetChatState = useCallback(() => {
    disconnect()
    clearMessages()
    setConversationId(null)
    conversationIdRef.current = null
    sessionIdRef.current = sessionId || getOrCreateSessionId()
  }, [clearMessages, disconnect, sessionId])

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
    conversationId,
    connect,
    disconnect,
    sendMessage,
    sendGenerate,
    editMessage,
    removeMessage,
    confirmAction,
    sendToolResult,
    hydrateMessages,
    clearMessages,
    resetChatState,
    stopGeneration,
  }
}
