// ============================================================
// Enhanced Chat WebSocket Hook
// Preserves all original business logic with improved state management.
//
// Key performance improvement: streaming tokens are buffered and
// flushed to React state at most once per animation frame, instead
// of triggering a setMessages(...) call on every single token.
// For a 2000-token response this collapses ~2000 renders down to
// ~120 (one per frame at 60fps), and avoids the O(n²) cost of
// array.map() + string concatenation per token.
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'
import { WS_API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { ChatMessage, PendingAction, ToolCallInfo } from '../types'

export interface ChatWebSocketOptions {
  customerEmail: string
  customerName: string
  setIsCreateTicketModalOpen: (isOpen: boolean) => void
}

export interface UseChatWebSocketReturn {
  messages: ChatMessage[]
  connectionStatus: 'disconnected' | 'connecting' | 'connected'
  isTyping: boolean
  pendingAction: PendingAction | null
  toolCalls: ToolCallInfo[]
  connect: () => void
  disconnect: () => void
  sendMessage: (content: string) => void
  sendGenerate: (content: string) => void
  editMessage: (messageId: string, newContent: string) => void
  removeMessage: (messageId: string) => void
  confirmAction: (approved: boolean) => void
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

export function useChatWebSocket({ customerEmail, customerName, setIsCreateTicketModalOpen }: ChatWebSocketOptions): UseChatWebSocketReturn {
  // ---- State ----
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [toolCalls, setToolCalls] = useState<ToolCallInfo[]>([])

  // ---- Refs ----
  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef(getOrCreateSessionId())
  const conversationIdRef = useRef<string | null>(null)
  const aiMsgIdRef = useRef<string | null>(null)
  const aiBufferRef = useRef('')
  // rAF-batching refs — accumulate tokens between frames, flush once per frame.
  const rafPendingRef = useRef(false)
  const pendingTokensRef = useRef<string>('')
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const currentToolCallRef = useRef<ToolCallInfo | null>(null)
  // Tracks server-provided tool_call_id → local tool ID mapping so that
  // duplicate 'tool_start' events (or a 'tool_start' that arrives after
  // 'show_ticket_dialogue') update the existing tool call instead of
  // creating a phantom second execution.
  const serverToolIdMapRef = useRef<Map<string, string>>(new Map())
  // Guard against sending the 'confirm' message more than once for the
  // same approval. Even though the UI disables the button after the first
  // click, this ref provides a belt-and-suspenders guarantee at the
  // transport layer.
  const confirmSentRef = useRef(false)

  // -------------------------------------------------------
  // rAF-batched flush of streaming tokens to React state.
  // Multiple tokens arriving in the same frame are coalesced into
  // a single setMessages call and a single string concatenation.
  // -------------------------------------------------------
  const flushStreamingTokens = useCallback(() => {
    rafPendingRef.current = false
    const chunk = pendingTokensRef.current
    pendingTokensRef.current = ''
    if (!chunk || !aiMsgIdRef.current) return

    // Accumulate into the persistent buffer (still O(n) total length,
    // but we only do it once per frame instead of once per token).
    aiBufferRef.current += chunk

    // Structural update: only the streaming message changes — everything
    // else in the array is referentially unchanged, so memoized children
    // (MessageRenderer / AIMessage / ChatMarkdown) skip re-rendering.
    setMessages((prev) => {
      const next = prev.slice()
      const idx = next.findIndex((m) => m.id === aiMsgIdRef.current)
      if (idx === -1) return prev
      const cur = next[idx]
      // Only allocate a new object for the streaming message.
      next[idx] = { ...cur, content: aiBufferRef.current, isStreaming: true }
      return next
    })
  }, [])

  const scheduleFlush = useCallback(() => {
    if (rafPendingRef.current) return
    rafPendingRef.current = true
    // requestAnimationFrame fires ~16ms (60fps); if the browser is
    // backgrounded, rAF is throttled which naturally reduces work.
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(flushStreamingTokens)
    } else {
      // SSR/old-browser fallback: flush on a short timer.
      setTimeout(flushStreamingTokens, 16)
    }
  }, [flushStreamingTokens])

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
          // First token creates the AI message immediately (so the user sees
          // the bubble appear with the cursor), then subsequent tokens are
          // rAF-batched.
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

          // Deduplication: if the server already sent a tool_start for this
          // tool_call_id, update the existing tool call in-place instead of
          // creating a phantom second execution.
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
            name: data.name || 'Tool',
            status: 'running',
            input: data.input || {},
            startTime: new Date().toISOString(),
          }

          // Map server tool_call_id → local ID for future deduplication.
          if (serverToolCallId) {
            serverToolIdMapRef.current.set(serverToolCallId, localId)
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
          // Determine which tool call to complete. Prefer the server's
          // tool_call_id mapped through serverToolIdMapRef, falling back
          // to currentToolCallRef for backwards compatibility.
          const endServerId: string | undefined = data.tool_call_id
          let targetLocalId: string | null = null

          if (endServerId && serverToolIdMapRef.current.has(endServerId)) {
            targetLocalId = serverToolIdMapRef.current.get(endServerId)!
          } else if (currentToolCallRef.current) {
            targetLocalId = currentToolCallRef.current.id
          }

          if (targetLocalId) {
            const completedToolRef = currentToolCallRef.current
            const outputText = data.output || 'Completed'
            const endTime = new Date().toISOString()
            const displayName = data.name

            setToolCalls((prev) => {
              const target = prev.find((t) => t.id === targetLocalId)
              if (!target) return prev
              const updatedTool: ToolCallInfo = {
                ...target,
                status: 'completed',
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
                  ? { ...tool, status: 'completed', output: outputText, endTime }
                  : { id: targetLocalId, name: displayName || 'Tool', status: 'completed', output: outputText, endTime }
                return {
                  ...m,
                  content: `${displayName || updatedTool.name} completed`,
                  toolCalls: [updatedTool],
                }
              })
            )
          }
          break
        }

        case 'pause': {
          // Force-flush any pending tokens before finalizing the streaming state.
          if (rafPendingRef.current) flushStreamingTokens()
          setIsTyping(false)
          if (aiMsgIdRef.current) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgIdRef.current ? { ...m, isStreaming: false } : m
              )
            )
          }
          // Reset the confirm guard for this new approval cycle.
          confirmSentRef.current = false
          setPendingAction({
            toolCallId: data.tool_call_id || 'unknown',
            actionName: data.action_name || 'Action',
            params: data.params || {},
          })
          break
        }

        case 'done': {
          // Force-flush any pending tokens so the final message shows everything.
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
            // Mark system error messages so the UI can style them distinctly
            // instead of fragile string matching.
            isError: true,
          } as ChatMessage])
          break
        }

        case 'ended': {
          setConnectionStatus('disconnected')
          break
        }

        case 'edit_successful': {
          // Edit was processed successfully
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

        case 'show_ticket_dialogue': {
          // The user has already approved the action (via the 'pause' → 'confirm'
          // flow). This event signals that the tool is now executing and the
          // frontend should show the ticket-creation form.
          //
          // IMPORTANT: Do NOT call setPendingAction() here. The approval phase
          // is over — setting pendingAction would cause a second Human Approval
          // card to appear alongside the modal, which is the root cause of the
          // duplicate-approval bug (proven by runtime simulation).
          setIsTyping(false)
          setIsCreateTicketModalOpen(true)
          break
        }
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      // Flush any in-flight tokens so the user sees the final content
      // even if the connection drops mid-stream.
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
  }, [customerEmail, customerName, scheduleFlush, flushStreamingTokens])

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
      // Cancel any pending rAF by simply clearing the flag; the next flush
      // will be a no-op since pendingTokensRef is also cleared below.
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
    // Reset guards for the new conversation turn.
    confirmSentRef.current = false
    serverToolIdMapRef.current.clear()

    ws.send(JSON.stringify({ type: 'chat', content: content.trim() }))
  }, [])

  // ---- Send Generate ----

  const sendGenerate = useCallback((content: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    setIsTyping(true)
    setPendingAction(null)
    // Reset guards for the new conversation turn.
    confirmSentRef.current = false
    serverToolIdMapRef.current.clear()
    ws.send(JSON.stringify({ type: 'generate', content: content.trim() }))
  }, [])

  // ---- Stop Generation ----

  const stopGeneration = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'stop' }))
    // Flush any pending tokens so the stopped message shows its final state.
    if (rafPendingRef.current) flushStreamingTokens()
    setIsTyping(false)
  }, [flushStreamingTokens])

  // ---- Edit Message ----

  const editMessage = useCallback((messageId: string, newContent: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    // Optimistic update
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

    // Guard: prevent sending the 'confirm' message more than once per
    // approval cycle. Without this guard, a race between the UI
    // unmounting the ChatPendingAction card and a rapid second click
    // (or a re-render that re-fires the callback) could send two
    // 'confirm' messages to the backend, causing it to execute the
    // tool twice.
    if (confirmSentRef.current) return
    confirmSentRef.current = true

    ws.send(JSON.stringify({ type: 'confirm', approved }))
    setPendingAction(null)
    setIsTyping(true)
  }, [])

  // ---- Clear Messages ----

  const clearMessages = useCallback(() => {
    setMessages([])
    aiMsgIdRef.current = null
    aiBufferRef.current = ''
    pendingTokensRef.current = ''
    rafPendingRef.current = false
    confirmSentRef.current = false
    serverToolIdMapRef.current.clear()
    currentToolCallRef.current = null
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
    connect,
    disconnect,
    sendMessage,
    sendGenerate,
    editMessage,
    removeMessage,
    confirmAction,
    clearMessages,
    stopGeneration,
  }
}
