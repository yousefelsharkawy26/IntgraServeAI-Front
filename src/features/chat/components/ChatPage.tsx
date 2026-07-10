// ============================================================
// Chat Page - Main Integration
// Full-page premium AI chat experience
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeft, CircleDot,
} from 'lucide-react'

import { useChatStore } from '../store/useChatStore'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { useChatConversations } from '../hooks/useChatConversations'
import { fetchConversationDetail } from '../services/chat.service'
import { ChatLayout } from './ChatLayout'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatComposer } from './ChatComposer'
import { UserMessage, AIMessage, SystemMessage, ToolExecutionCard } from './ChatMessage'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import { ChatPendingAction } from './ChatPendingAction'
import { ImagePreviewModal } from './ChatAttachmentCard'
import { StatusBadge } from './ChatAvatar'
import type { PendingFile, ChatMessage, Conversation } from '../types'
import '../chat.css'
import { ToolRenderer } from '../tools'
import type { ToolTransport } from '../tools'
import { useAuthStore } from '@/store/authStore'

const createDraftSessionId = (userId?: string) =>
  `session-${userId || 'anonymous'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export default function ChatPage() {
  const { conversationId: routeConversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  const [draftSessionId, setDraftSessionId] = useState(() => createDraftSessionId(authUser?.id))
  const shouldNavigateAfterFirstMessageRef = useRef(false)
  const skipNextHydrationRef = useRef(false)
  const pendingFirstMessageRef = useRef('')
  const createdDraftConversationIdRef = useRef<string | null>(null)
  const objectUrlsRef = useRef<Set<string>>(new Set())

  const sidebarOpen = useChatStore((s) => s.sidebarOpen)
  const storeMessages = useChatStore((s) => s.messages)
  const isTyping = useChatStore((s) => s.isTyping)
  const pendingAction = useChatStore((s) => s.pendingAction)
  const inputValue = useChatStore((s) => s.inputValue)
  const pendingFiles = useChatStore((s) => s.pendingFiles)
  const previewImage = useChatStore((s) => s.previewImage)
  const connectionStatus = useChatStore((s) => s.connectionStatus)
  const config = useChatStore((s) => s.config)

  const toggleSidebar = useChatStore((s) => s.toggleSidebar)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const setMessages = useChatStore((s) => s.setMessages)
  const setIsTyping = useChatStore((s) => s.setIsTyping)
  const setPendingAction = useChatStore((s) => s.setPendingAction)
  const setToolCalls = useChatStore((s) => s.setToolCalls)
  const setInputValue = useChatStore((s) => s.setInputValue)
  const addPendingFile = useChatStore((s) => s.addPendingFile)
  const removePendingFile = useChatStore((s) => s.removePendingFile)
  const clearPendingFiles = useChatStore((s) => s.clearPendingFiles)
  const setPreviewImage = useChatStore((s) => s.setPreviewImage)
  const setConnectionStatus = useChatStore((s) => s.setConnectionStatus)

  const userId = authUser?.id || ''
  const userEmail = authUser?.email || ''

  const conversationsQuery = useChatConversations({ userId, userEmail })

  const conversationDetailQuery = useQuery({
    queryKey: ['chat', 'conversation-detail', userId, routeConversationId],
    enabled: Boolean(userId && routeConversationId),
    queryFn: () => fetchConversationDetail(routeConversationId!),
    staleTime: 15_000,
    gcTime: 2 * 60_000,
    retry: 1,
  })

  const activeConversation = conversationDetailQuery.data
  const effectiveSessionId = routeConversationId
    ? activeConversation?.sessionId || (routeConversationId === createdDraftConversationIdRef.current ? draftSessionId : null)
    : draftSessionId

  // ---- WebSocket hook ----
  const {
    messages: wsMessages,
    connectionStatus: wsStatus,
    isTyping: wsIsTyping,
    pendingAction: wsPendingAction,
    activeTool,
    conversationId,
    connect,
    disconnect,
    sendMessage: wsSendMessage,
    editMessage: wsEditMessage,
    removeMessage: wsRemoveMessage,
    confirmAction: wsConfirmAction,
    sendToolResult,
    hydrateMessages,
    resetChatState,
    stopGeneration,
  } = useChatWebSocket({
    customerEmail: userEmail,
    customerName: authUser?.name || 'Customer',
    token: accessToken,
    sessionId: effectiveSessionId,
  })

  const revokeObjectUrl = useCallback((url?: string) => {
    if (!url || !objectUrlsRef.current.has(url)) return
    URL.revokeObjectURL(url)
    objectUrlsRef.current.delete(url)
  }, [])

  const resetDraftState = useCallback(() => {
    setMessages([])
    setIsTyping(false)
    setPendingAction(null)
    setToolCalls([])
    setInputValue('')
    pendingFiles.forEach((file) => revokeObjectUrl(file.preview))
    clearPendingFiles()
    setPreviewImage(null)
  }, [clearPendingFiles, pendingFiles, revokeObjectUrl, setInputValue, setIsTyping, setMessages, setPendingAction, setPreviewImage, setToolCalls])

  // ---- Sync WebSocket state to store ----
  useEffect(() => {
    setMessages(wsMessages)
  }, [wsMessages, setMessages])

  useEffect(() => {
    setIsTyping(wsIsTyping)
  }, [wsIsTyping, setIsTyping])

  useEffect(() => {
    setPendingAction(wsPendingAction)
  }, [wsPendingAction, setPendingAction])

  useEffect(() => {
    setConnectionStatus(wsStatus)
  }, [wsStatus, setConnectionStatus])

  // User switching/logout must clear all chat-local state so conversations and
  // drafts from the previous account cannot flash for the next account.
  useEffect(() => {
    resetChatState()
    resetDraftState()
    setActiveConversation(routeConversationId || null)
    setDraftSessionId(createDraftSessionId(authUser?.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id])

  // Route is the source of truth for active conversation.
  useEffect(() => {
    setActiveConversation(routeConversationId || null)
  }, [routeConversationId, setActiveConversation])

  // Hydrate messages on deep-link/refresh for existing conversations.
  useEffect(() => {
    if (!routeConversationId) {
      hydrateMessages([])
      return
    }
    if (conversationDetailQuery.data) {
      if (skipNextHydrationRef.current) {
        skipNextHydrationRef.current = false
      } else {
        hydrateMessages(conversationDetailQuery.data.messages)
      }
      conversationsQuery.upsertConversation(conversationDetailQuery.data)
    }
  }, [conversationDetailQuery.data, conversationsQuery.upsertConversation, hydrateMessages, routeConversationId])

  // Connect after we know the correct session ID. For /chat this uses a fresh
  // draft session. For /chat/:id it uses that conversation's backend session_id.
  useEffect(() => {
    if (!userEmail || !effectiveSessionId) return
    connect()
    return () => disconnect()
  }, [connect, disconnect, effectiveSessionId, userEmail])

  // After the first user message in /chat, navigate to the server-created route.
  useEffect(() => {
    if (!shouldNavigateAfterFirstMessageRef.current || routeConversationId || !conversationId) return
    shouldNavigateAfterFirstMessageRef.current = false

    const optimisticConversation: Conversation = {
      id: conversationId,
      sessionId: effectiveSessionId || draftSessionId,
      customerEmail: userEmail,
      customerName: authUser?.name || 'Customer',
      title: pendingFirstMessageRef.current || 'New Chat',
      preview: pendingFirstMessageRef.current,
      timestamp: new Date().toISOString(),
      messageCount: Math.max(1, storeMessages.length),
      isActive: true,
    }
    conversationsQuery.upsertConversation(optimisticConversation)
    createdDraftConversationIdRef.current = conversationId
    skipNextHydrationRef.current = true
    navigate(`/chat/${conversationId}`, { replace: true })
  }, [authUser?.name, conversationId, conversationsQuery, draftSessionId, effectiveSessionId, navigate, routeConversationId, storeMessages.length, userEmail])

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current.clear()
    }
  }, [])

  // ---- Scroll to bottom on new messages ----
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [storeMessages, isTyping])

  // ---- Handlers ----

  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim() && pendingFiles.length === 0) return
    const trimmed = content.trim()
    const sent = wsSendMessage(trimmed)
    if (!sent) return
    if (!routeConversationId) {
      pendingFirstMessageRef.current = trimmed
      shouldNavigateAfterFirstMessageRef.current = true
    }
    setInputValue('')
    pendingFiles.forEach((file) => revokeObjectUrl(file.preview))
    clearPendingFiles()
  }, [clearPendingFiles, pendingFiles, revokeObjectUrl, routeConversationId, setInputValue, wsSendMessage])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
      if (preview) objectUrlsRef.current.add(preview)
      const pendingFile: PendingFile = {
        id,
        file,
        preview,
      }
      addPendingFile(pendingFile)
    })
  }, [addPendingFile])

  const handleRemoveFile = useCallback((id: string) => {
    const file = pendingFiles.find((pendingFile) => pendingFile.id === id)
    revokeObjectUrl(file?.preview)
    removePendingFile(id)
  }, [pendingFiles, removePendingFile, revokeObjectUrl])

  const handleEditMessage = useCallback((id: string, content: string) => {
    wsEditMessage(id, content)
  }, [wsEditMessage])

  const handleDeleteMessage = useCallback((id: string) => {
    wsRemoveMessage(id)
  }, [wsRemoveMessage])

  const handleNewChat = useCallback(() => {
    resetChatState()
    resetDraftState()
    setActiveConversation(null)
    setDraftSessionId(createDraftSessionId(authUser?.id))
    shouldNavigateAfterFirstMessageRef.current = false
    pendingFirstMessageRef.current = ''
    createdDraftConversationIdRef.current = null
    navigate('/chat')
  }, [authUser?.id, navigate, resetChatState, resetDraftState, setActiveConversation])

  const handleSelectConversation = useCallback((id: string) => {
    if (id === routeConversationId) return
    navigate(`/chat/${id}`)
  }, [navigate, routeConversationId])

  // ---- Derived state ----
  const isConnected = connectionStatus === 'connected'
  const showEmpty = storeMessages.length === 0 && !isTyping
  const visibleMessages = useMemo(() =>
    storeMessages.filter((m) => !(m.sender === 'user' && m.is_deleted)),
    [storeMessages]
  )

  // ---- Tool Transport — bridges the runtime to the WebSocket layer ----
  const toolTransport = useMemo<ToolTransport>(
    () => ({
      sendResult: (_toolCallId, status, payload, _reason) => {
        sendToolResult(_toolCallId, status, payload)
      },
      sendProgress: () => {},
      sendLog: () => {},
    }),
    [sendToolResult]
  )

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  // ---- Render ----
  return (
    <ChatLayout
      sidebarCollapsed={!sidebarOpen}
      onToggleSidebar={toggleSidebar}
      conversations={conversationsQuery.conversations}
      activeConversationId={routeConversationId || null}
      activeFilter={conversationsQuery.filter}
      searchQuery={conversationsQuery.searchQuery}
      isLoadingConversations={conversationsQuery.isLoading}
      isFetchingMoreConversations={conversationsQuery.isFetchingNextPage}
      hasMoreConversations={conversationsQuery.hasNextPage}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
      onFilterChange={conversationsQuery.setFilter}
      onSearchChange={conversationsQuery.setSearchQuery}
      onLoadMoreConversations={conversationsQuery.loadMore}
      onPinConversation={conversationsQuery.togglePinned}
      onFavoriteConversation={conversationsQuery.toggleFavorite}
      onArchiveConversation={conversationsQuery.toggleArchived}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              aria-label="Open sidebar"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Open sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <StatusBadge status={connectionStatus} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isConnected ? (
              <span className="flex items-center gap-1.5">
                <CircleDot className="h-3 w-3 text-emerald-500" />
                GPT-4o
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CircleDot className="h-3 w-3 text-amber-400" />
                Connecting...
              </span>
            )}
          </span>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <AnimatePresence mode="wait">
            {conversationDetailQuery.isLoading && routeConversationId ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading conversation…</div>
            ) : conversationDetailQuery.isError && routeConversationId ? (
              <div className="py-10 text-center text-sm text-red-500">Unable to load this conversation.</div>
            ) : showEmpty ? (
              <ChatEmptyState
                key="empty"
                onSendMessage={handleSendMessage}
                welcomeMessage={config.welcomeMessage}
              />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {visibleMessages.map((msg) => (
                  <MessageRenderer
                    key={msg.id}
                    message={msg}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                  />
                ))}

                {isTyping && <ChatTypingIndicator />}

                {pendingAction && (
                  <ChatPendingAction
                    pendingAction={pendingAction}
                    onConfirm={wsConfirmAction}
                  />
                )}

                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Composer area */}
      <div className="shrink-0 border-t bg-card/50 backdrop-blur-sm">
        <ChatComposer
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          onStop={stopGeneration}
          pendingFiles={pendingFiles}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          isTyping={isTyping}
          isConnected={isConnected}
        />
      </div>

      <AnimatePresence>
        {previewImage && (
          <ImagePreviewModal
            imageUrl={previewImage}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>

      <ToolRenderer
        activeTool={activeTool}
        conversationId={routeConversationId || conversationId}
        transport={toolTransport}
      />
    </ChatLayout>
  )
}

// ============================================================
// Message Renderer - routes to correct message component
// ============================================================

interface MessageRendererProps {
  message: ChatMessage
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
}

const MessageRenderer = React.memo(function MessageRenderer({
  message,
  onEdit,
  onDelete,
}: MessageRendererProps) {
  if (message.sender === 'system') {
    if (message.toolCalls && message.toolCalls.length > 0) {
      return <ToolExecutionCard toolCall={message.toolCalls[0]} />
    }
    return <SystemMessage message={message} />
  }

  if (message.sender === 'user') {
    return (
      <UserMessage
        message={message}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
  }

  return <AIMessage message={message} />
})
