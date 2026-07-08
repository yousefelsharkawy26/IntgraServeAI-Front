// ============================================================
// Chat WebSocket Hook — Generic Human Tool Runtime
// ============================================================
// This hook manages the WebSocket connection and all chat state.
// It is GENERIC — it knows nothing about specific tools.
//
// Tool lifecycle is owned by the backend:
//   tool_start → pause → confirm → show_tool_ui → tool_result → tool_end
//
// The frontend only:
//   1. Renders tool UIs from the registry
//   2. Sends tool_result back to the backend
//   3. Updates UI state based on backend events
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'
import { WS_API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { ChatMessage, PendingAction, ToolCallInfo, ToolStatus } from '../types'
import type { ActiveTool, ToolResultStatus } from '../tools/types'

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
  /** The currently active human-interactive tool (null when no tool UI is open) */
  activeTool: ActiveTool | null
  /** Current conversation ID */
  conversationId: string | null
  connect: () => void
  disconnect: () => void
  sendMessage: (content: string) => void
  sendGenerate: (content: string) => void
  editMessage: (messageId: string, newContent: string) => void
  removeMessage: (messageId: string) => void
  confirmAction: (approved: boolean) => void
  /**
   * Send a tool result back to the backend.
   * This is the ONLY way the frontend communicates tool outcomes.
   * The backend then resumes execution and eventually sends tool_end.
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
  const serverToolIdMapRef = useRef<Map<string, string>>(new Map())
  const confirmSentRef = useRef(false)
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
  // Internal: transition a tool to a terminal state.
  // Used only by the 'done' safety net. NOT exposed publicly.
  // The frontend never invents terminal states — only the backend does.
  // -------------------------------------------------------
  const finalizeRunningTools = useCallback(() => {
    const now = new Date().toISOString()
    setToolCalls((prev) => {
      if (!prev.some((t) => t.status === 'running' || t.status === 'waiting_for_approval' || t.status === 'waiting_for_user_input')) return prev
      return prev.map((t) =>
        t.status === 'running' || t.status === 'waiting_for_approval' || t.status === 'waiting_for_user_input'
          ? { ...t, status: 'completed' as const, output: 'Completed', endTime: now }
          : t
      )
    })
    setMessages((prev) =>
      prev.map((m) => {
        const tool = m.toolCalls?.[0]
        if (!tool || (tool.status !== 'running' && tool.status !== 'waiting_for_approval' && tool.status !== 'waiting_for_user_input')) return m
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

  // ---- Connection ----

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

    setConnectionStatus('connecting')
    const wsUrl = `${WS_API_BASE_URL}${API_ENDPOINTS.chat.ws}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return }
      ws.send(JSON.stringify({
        session_id: sessionIdRef.current,
        customer_email: customerEmail,
        customer_name: customerName,
      }))
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'connected': {
          setConnectionStatus('connected')
          conversationIdRef.current = data.conversation_id
          break
        }

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

        case 'tool_start': {
          const serverToolCallId: string | undefined = data.tool_call_id

          // Deduplication
          if (serverToolCallId && serverToolIdMapRef.current.has(serverToolCallId)) {
            const existingLocalId = serverToolIdMapRef.current.get(serverToolCallId)!
            setToolCalls((prev) => {
              const updated = prev.map((t) =>
                t.id === existingLocalId
                  ? { ...t, status: 'running' as const, name: data.name || t.name, input: data.input || t.input }
                  : t
              )
              const found = updated.find((t) => t.id === existingLocalId)
              if (found) currentToolCallRef.current = found
              return updated
            })
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== existingLocalId || !m.toolCalls?.length) return m
                return {
                  ...m,
                  content: `Running ${data.name || 'Tool'}...`,
                  toolCalls: [{ ...m.toolCalls[0], status: 'running' as const, name: data.name || m.toolCalls[0].name, input: data.input || m.toolCalls[0].input }],
                }
              })
            )
            break
          }

          const localId = `tool-${generateId()}`
          const toolCall: ToolCallInfo = {
            id: localId,
            serverToolCallId: serverToolCallId,
            name: data.name || 'Tool',
            status: 'running',
            input: data.input || {},
            startTime: new Date().toISOString(),
          }

          if (serverToolCallId) {
            serverToolIdMapRef.current.set(serverToolCallId, localId)
            activeToolCallIdRef.current = serverToolCallId
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

        case 'tool_end': {
          const endServerId: string | undefined = data.tool_call_id
          let targetLocalId: string | null = null

          if (endServerId && serverToolIdMapRef.current.has(endServerId)) {
            targetLocalId = serverToolIdMapRef.current.get(endServerId)!
          } else if (currentToolCallRef.current) {
            targetLocalId = currentToolCallRef.current.id
          }

          if (targetLocalId) {
            const completedToolRef = currentToolCallRef.current
            // Respect the backend's status if provided, default to 'completed'
            const backendStatus: ToolStatus = data.status || 'completed'
            const outputText = data.output || (backendStatus === 'completed' ? 'Completed' : backendStatus)
            const endTime = new Date().toISOString()
            const displayName = data.name

            setToolCalls((prev) => {
              const target = prev.find((t) => t.id === targetLocalId)
              if (!target) return prev
              const updatedTool: ToolCallInfo = {
                ...target,
                status: backendStatus,
                output: outputText,
                endTime,
              }
              if (completedToolRef?.id === targetLocalId) {
                currentToolCallRef.current = null
              }
              return prev.map((t) => t.id === targetLocalId ? updatedTool : t)
            })
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== targetLocalId) return m
                const tool = m.toolCalls?.[0]
                const updatedTool: ToolCallInfo = tool
                  ? { ...tool, status: backendStatus, output: outputText, endTime }
                  : { id: targetLocalId, name: displayName || 'Tool', status: backendStatus, output: outputText, endTime }
                return {
                  ...m,
                  content: `${displayName || updatedTool.name} ${backendStatus}`,
                  toolCalls: [updatedTool],
                }
              })
            )

            // If the tool that just ended was the active tool, close its UI.
            if (endServerId && activeToolCallIdRef.current === endServerId) {
              setActiveTool(null)
              activeToolCallIdRef.current = null
            }
          }
          break
        }

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

          const pauseServerId: string | undefined = data.tool_call_id
          if (pauseServerId) activeToolCallIdRef.current = pauseServerId
          const pauseLocalId = pauseServerId
            ? serverToolIdMapRef.current.get(pauseServerId) ?? null
            : currentToolCallRef.current?.id ?? null

          if (pauseLocalId) {
            setToolCalls((prev) =>
              prev.map((t) =>
                t.id === pauseLocalId ? { ...t, status: 'waiting_for_approval' as const } : t
              )
            )
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== pauseLocalId || !m.toolCalls?.length) return m
                return {
                  ...m,
                  toolCalls: [{ ...m.toolCalls[0], status: 'waiting_for_approval' as const }],
                }
              })
            )
          }

          setPendingAction({
            toolCallId: data.tool_call_id || 'unknown',
            actionName: data.action_name || 'Action',
            params: data.params || {},
          })
          break
        }

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
          // This handles edge cases where the backend sends 'done' without
          // 'tool_end' (e.g. backend doesn't support tool_result yet).
          finalizeRunningTools()
          break
        }

        case 'error': {
          if (rafPendingRef.current) flushStreamingTokens()
          setIsTyping(false)
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

        case 'edit_successful': {
          break
        }

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

        // -------------------------------------------------------
        // GENERIC tool UI request.
        // The backend sends this when a tool needs human interaction.
        // The frontend looks up the tool component from the registry
        // and renders it via <ToolRenderer>. No tool-specific logic here.
        // -------------------------------------------------------
        case 'show_ticket_dialogue':
        case 'show_tool_ui':
        case 'tool_input_required': {
          setIsTyping(false)

          const serverId = data.tool_call_id
          if (serverId) activeToolCallIdRef.current = serverId

          // Transition the tool to 'waiting_for_user_input'
          const uiLocalId = serverId
            ? serverToolIdMapRef.current.get(serverId) ?? null
            : currentToolCallRef.current?.id ?? null

          if (uiLocalId) {
            setToolCalls((prev) =>
              prev.map((t) =>
                t.id === uiLocalId ? { ...t, status: 'waiting_for_user_input' as const } : t
              )
            )
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== uiLocalId || !m.toolCalls?.length) return m
                return {
                  ...m,
                  toolCalls: [{ ...m.toolCalls[0], status: 'waiting_for_user_input' as const }],
                }
              })
            )
          }

          // Set the active tool — ToolRenderer will look up the component.
          setActiveTool({
            toolCallId: data.tool_call_id || 'unknown',
            actionName: data.action_name || 'unknown',
            params: data.params || {},
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
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [customerEmail, customerName, scheduleFlush, flushStreamingTokens, finalizeRunningTools])

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
    ws.send(JSON.stringify({ type: 'stop' }))
    if (rafPendingRef.current) flushStreamingTokens()
    setIsTyping(false)
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

  const confirmAction = useCallback((approved: boolean) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    if (confirmSentRef.current) return
    confirmSentRef.current = true

    ws.send(JSON.stringify({ type: 'confirm', approved }))
    setPendingAction(null)
    setIsTyping(true)

    if (approved) {
      // Transition the tool back to 'running' after approval.
      const approveServerId = activeToolCallIdRef.current
      const approveLocalId = approveServerId
        ? serverToolIdMapRef.current.get(approveServerId) ?? null
        : currentToolCallRef.current?.id ?? null
      if (approveLocalId) {
        setToolCalls((prev) =>
          prev.map((t) =>
            t.id === approveLocalId ? { ...t, status: 'running' as const } : t
          )
        )
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== approveLocalId || !m.toolCalls?.length) return m
            return {
              ...m,
              content: `Running ${m.toolCalls[0].name}...`,
              toolCalls: [{ ...m.toolCalls[0], status: 'running' as const }],
            }
          })
        )
      }
    } else {
      // User declined — send a tool_result with 'cancelled' status.
      // The backend owns the lifecycle, so we just report the user's decision.
      const declineServerId = activeToolCallIdRef.current
      if (declineServerId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'tool_result',
          tool_call_id: declineServerId,
          status: 'cancelled',
        }))
      }
      // Optimistically update the UI — the backend will confirm via tool_end.
      const declineLocalId = declineServerId
        ? serverToolIdMapRef.current.get(declineServerId) ?? null
        : currentToolCallRef.current?.id ?? null
      if (declineLocalId) {
        const now = new Date().toISOString()
        setToolCalls((prev) =>
          prev.map((t) =>
            t.id === declineLocalId ? { ...t, status: 'cancelled' as const, output: 'Declined by user', endTime: now } : t
          )
        )
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== declineLocalId || !m.toolCalls?.length) return m
            return {
              ...m,
              content: `${m.toolCalls[0].name} cancelled`,
              toolCalls: [{ ...m.toolCalls[0], status: 'cancelled' as const, output: 'Declined by user', endTime: now }],
            }
          })
        )
        currentToolCallRef.current = null
        activeToolCallIdRef.current = null
      }
    }
  }, [])

  // ---- Send Tool Result ----
  // This is the GENERIC way for tools to report their outcome.
  // The frontend sends tool_result to the backend.
  // The backend resumes execution and eventually sends tool_end.
  // The frontend NEVER invents a terminal status.

  const sendToolResult = useCallback((toolCallId: string, status: ToolResultStatus, payload?: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    // Send the result to the backend.
    ws.send(JSON.stringify({
      type: 'tool_result',
      tool_call_id: toolCallId,
      status,
      payload: payload ?? null,
    }))

    // Close the tool UI.
    setActiveTool(null)

    // Transition the tool to 'running' (backend is processing the result).
    // The backend will send tool_end when it's done.
    const localId = serverToolIdMapRef.current.get(toolCallId) ?? null
    if (localId) {
      setToolCalls((prev) =>
        prev.map((t) =>
          t.id === localId ? { ...t, status: 'running' as const } : t
        )
      )
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== localId || !m.toolCalls?.length) return m
          return {
            ...m,
            content: `Running ${m.toolCalls[0].name}...`,
            toolCalls: [{ ...m.toolCalls[0], status: 'running' as const }],
          }
        })
      )
    }

    // Clear the active tool ref.
    if (activeToolCallIdRef.current === toolCallId) {
      activeToolCallIdRef.current = null
    }
  }, [])

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
    serverToolIdMapRef.current.clear()
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
