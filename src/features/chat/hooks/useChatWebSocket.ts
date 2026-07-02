import { useState, useRef, useCallback, useEffect } from 'react'
import { WS_API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { ChatMessage } from '../types'

export interface ChatWebSocketOptions {
  customerEmail: string
  customerName: string
}

export interface PendingAction {
  toolCallId: string
  actionName: string
  params: Record<string, unknown>
}

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

export function useChatWebSocket({ customerEmail, customerName }: ChatWebSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef(getOrCreateSessionId())
  const conversationIdRef = useRef<string | null>(null)
  const aiMsgIdRef = useRef<string | null>(null)
  const aiBufferRef = useRef('')
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

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
        case 'connected':
          setConnectionStatus('connected')
          conversationIdRef.current = data.conversation_id
          break

        case 'token':
          if (!aiMsgIdRef.current) {
            const id = `ai-${generateId()}`
            aiMsgIdRef.current = id
            aiBufferRef.current = ''
            setMessages((prev) => [...prev, {
              id,
              content: '',
              sender: 'ai',
              timestamp: new Date().toISOString(),
            }])
          }
          aiBufferRef.current += data.content
          setMessages((prev) => prev.map((m) =>
            m.id === aiMsgIdRef.current ? { ...m, content: aiBufferRef.current } : m
          ))
          break

        case 'tool_start':
          setMessages((prev) => [...prev, {
            id: `tool-${generateId()}`,
            content: `🔧 Running ${data.name}...`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          }])
          break

        case 'tool_end':
          setMessages((prev) => [...prev, {
            id: `toolr-${generateId()}`,
            content: `✅ ${data.name} completed`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          }])
          break

        case 'pause':
          setIsTyping(false)
          setPendingAction({
            toolCallId: data.tool_call_id,
            actionName: data.action_name,
            params: data.params,
          })
          break

        case 'done':
          setIsTyping(false)
          aiMsgIdRef.current = null
          aiBufferRef.current = ''
          break

        case 'error':
          setIsTyping(false)
          setMessages((prev) => [...prev, {
            id: `err-${generateId()}`,
            content: `Error: ${data.message}`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          }])
          break

        case 'ended':
          setConnectionStatus('disconnected')
          break
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
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
  }, [customerEmail, customerName])

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
    setConnectionStatus('disconnected')
    aiMsgIdRef.current = null
    aiBufferRef.current = ''
  }, [])

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

  const editMessage = useCallback((messageId: string, newContent: string) => {
    setMessages((prev) => prev.map((m) =>
      m.id === messageId ? { ...m, content: newContent, is_edited: true } : m
    ))
  }, [])

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  const confirmAction = useCallback((approved: boolean) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(JSON.stringify({ type: 'confirm', approved }))
    setPendingAction(null)
    setIsTyping(true)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

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
    connect,
    disconnect,
    sendMessage,
    editMessage,
    removeMessage,
    confirmAction,
    clearMessages,
  }
}
