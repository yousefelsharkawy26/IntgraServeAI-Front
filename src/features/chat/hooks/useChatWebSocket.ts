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

export function useChatWebSocket({ customerEmail, customerName }: ChatWebSocketOptions): UseChatWebSocketReturn {
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
          const toolCall: ToolCallInfo = {
            id: `tool-${generateId()}`,
            name: data.name || 'Tool',
            status: 'running',
            input: data.input || {},
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

        case 'tool_end': {
          const completedTool = currentToolCallRef.current
          if (completedTool) {
            const updatedTool: ToolCallInfo = {
              ...completedTool,
              status: 'completed',
              output: data.output || 'Completed',
              endTime: new Date().toISOString(),
            }
            setToolCalls((prev) =>
              prev.map((t) => t.id === completedTool.id ? updatedTool : t)
            )
            setMessages((prev) =>
              prev.map((m) =>
                m.id === completedTool.id
                  ? { ...m, content: `${data.name} completed`, toolCalls: [updatedTool] }
                  : m
              )
            )
            currentToolCallRef.current = null
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
          setMessages((prev) => [...prev, {
            id: `ticket-${generateId()}`,
            content: `Opening ticket form for ${data.action_name}...`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          }])
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

    ws.send(JSON.stringify({ type: 'chat', content: content.trim() }))
  }, [])

  // ---- Send Generate ----

  const sendGenerate = useCallback((content: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    setIsTyping(true)
    setPendingAction(null)
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
