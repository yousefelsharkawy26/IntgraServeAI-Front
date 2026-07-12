// ============================================================
// Chat Widget - Floating authenticated chat experience
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Maximize2,
  MessageCircle,
  Minimize2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useChatStore } from '../store/useChatStore'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatComposer } from './ChatComposer'
import { UserMessage, AIMessage, SystemMessage, ToolExecutionCard } from './ChatMessage'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import { ChatPendingAction } from './ChatPendingAction'
import { ImagePreviewModal } from './ChatAttachmentCard'
import { StatusBadge } from './ChatAvatar'
import { ToolRenderer } from '../tools'
import type { ToolTransport } from '../tools'
import type { PendingFile, ChatMessage, ChatConfig } from '../types'
import { DEFAULT_CHAT_CONFIG } from '../types'

interface ChatWidgetProps {
  config?: Partial<ChatConfig>
  customerEmail?: string
  customerName?: string
  token?: string | null
}

const DEMO_CUSTOMER = {
  email: 'guest@integraserve.ai',
  name: 'Guest',
}

const createDraftSessionId = (customerEmail?: string) =>
  `session-${customerEmail || 'anonymous'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function ChatWidget({
  config: userConfig,
  customerEmail,
  customerName,
  token,
}: ChatWidgetProps) {
  const config = useMemo(() => ({ ...DEFAULT_CHAT_CONFIG, ...userConfig }), [userConfig])
  const resolvedCustomerEmail = customerEmail || DEMO_CUSTOMER.email
  const resolvedCustomerName = customerName || DEMO_CUSTOMER.name

  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [draftSessionId, setDraftSessionId] = useState(() => createDraftSessionId(resolvedCustomerEmail))

  const objectUrlsRef = useRef<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousCustomerEmailRef = useRef(resolvedCustomerEmail)

  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const storeMessages = useChatStore((s) => s.messages)
  const isTyping = useChatStore((s) => s.isTyping)
  const pendingAction = useChatStore((s) => s.pendingAction)
  const inputValue = useChatStore((s) => s.inputValue)
  const pendingFiles = useChatStore((s) => s.pendingFiles)
  const previewImage = useChatStore((s) => s.previewImage)
  const connectionStatus = useChatStore((s) => s.connectionStatus)

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

  const {
    messages: wsMessages,
    connectionStatus: wsStatus,
    isTyping: wsIsTyping,
    pendingAction: wsPendingAction,
    toolCalls: wsToolCalls,
    activeTool,
    conversationId,
    connect,
    disconnect,
    sendMessage: wsSendMessage,
    editMessage: wsEditMessage,
    removeMessage: wsRemoveMessage,
    confirmAction: wsConfirmAction,
    sendToolResult,
    resetChatState,
    stopGeneration,
  } = useChatWebSocket({
    customerEmail: resolvedCustomerEmail,
    customerName: resolvedCustomerName,
    token,
    sessionId: draftSessionId,
  })

  const revokeObjectUrl = useCallback((url?: string) => {
    if (!url || !objectUrlsRef.current.has(url)) return
    URL.revokeObjectURL(url)
    objectUrlsRef.current.delete(url)
  }, [])

  const revokeAllObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current.clear()
  }, [])

  const resetWidgetState = useCallback(() => {
    setMessages([])
    setIsTyping(false)
    setPendingAction(null)
    setToolCalls([])
    setInputValue('')
    revokeAllObjectUrls()
    clearPendingFiles()
    setPreviewImage(null)
  }, [
    clearPendingFiles,
    revokeAllObjectUrls,
    setInputValue,
    setIsTyping,
    setMessages,
    setPendingAction,
    setPreviewImage,
    setToolCalls,
  ])

  // Mirror WebSocket state into the chat UI store.
  useEffect(() => {
    setMessages(wsMessages)
  }, [setMessages, wsMessages])

  useEffect(() => {
    setIsTyping(wsIsTyping)
  }, [setIsTyping, wsIsTyping])

  useEffect(() => {
    setPendingAction(wsPendingAction)
  }, [setPendingAction, wsPendingAction])

  useEffect(() => {
    setToolCalls(wsToolCalls)
  }, [setToolCalls, wsToolCalls])

  useEffect(() => {
    setConnectionStatus(wsStatus)
  }, [setConnectionStatus, wsStatus])

  // Store the backend-created conversation id in frontend state only.
  // The browser URL remains /chat for the entire conversation lifecycle.
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId)
    }
  }, [conversationId, setActiveConversation])

  // Switching users must clear local chat state to prevent data leakage.
  useEffect(() => {
    if (previousCustomerEmailRef.current === resolvedCustomerEmail) return

    previousCustomerEmailRef.current = resolvedCustomerEmail
    resetChatState()
    resetWidgetState()
    setActiveConversation(null)
    setDraftSessionId(createDraftSessionId(resolvedCustomerEmail))
    setIsOpen(false)
    setIsMaximized(false)
  }, [resetChatState, resetWidgetState, resolvedCustomerEmail, setActiveConversation])

  // Connect only while the widget is open.
  useEffect(() => {
    if (!isOpen || !resolvedCustomerEmail || !draftSessionId) {
      disconnect()
      return
    }

    connect()
    return () => disconnect()
  }, [connect, disconnect, draftSessionId, isOpen, resolvedCustomerEmail])

  useEffect(() => {
    if (!isOpen) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, isTyping, storeMessages])

  useEffect(() => {
    return () => {
      revokeAllObjectUrls()
    }
  }, [revokeAllObjectUrls])

  const handleSendMessage = useCallback((content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    const sent = wsSendMessage(trimmed)
    if (!sent) return

    setInputValue('')
    revokeAllObjectUrls()
    clearPendingFiles()
  }, [clearPendingFiles, revokeAllObjectUrls, setInputValue, wsSendMessage])

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
    resetWidgetState()
    setActiveConversation(null)
    setDraftSessionId(createDraftSessionId(resolvedCustomerEmail))
  }, [resetChatState, resetWidgetState, resolvedCustomerEmail, setActiveConversation])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setIsMaximized(false)
  }, [])

  const visibleMessages = useMemo(
    () => storeMessages.filter((message) => !(message.sender === 'user' && message.is_deleted)),
    [storeMessages]
  )
  const showEmpty = visibleMessages.length === 0 && !isTyping
  const isConnected = connectionStatus === 'connected'
  const widgetSideClass = config.position === 'left' ? 'sm:left-4' : 'sm:right-4'
  const activeToolConversationId = activeConversationId || conversationId

  const toolTransport = useMemo<ToolTransport>(
    () => ({
      sendResult: (toolCallId, status, payload) => {
        sendToolResult(toolCallId, status, payload)
      },
      sendProgress: () => {},
      sendLog: () => {},
    }),
    [sendToolResult]
  )

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full',
              'shadow-2xl shadow-primary/25 transition-transform hover:scale-105 active:scale-95',
              config.position === 'left' ? 'left-4' : 'right-4'
            )}
            style={{ backgroundColor: config.primaryColor }}
            aria-label="Open chat"
          >
            <MessageCircle className="h-6 w-6 text-white" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            key={isMaximized ? 'chat-widget-maximized' : 'chat-widget'}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'fixed z-[60] flex flex-col overflow-hidden border bg-background shadow-2xl',
              isMaximized
                ? 'inset-0 h-[100dvh] w-screen rounded-none sm:inset-4 sm:h-auto sm:w-auto sm:rounded-2xl'
                : cn(
                    'inset-x-0 bottom-0 h-[100dvh] w-screen rounded-none',
                    'sm:inset-x-auto sm:bottom-4 sm:h-[min(80dvh,calc(100dvh-2rem))] sm:w-[min(380px,calc(100vw-2rem))] sm:rounded-2xl',
                    'lg:h-[min(700px,calc(100dvh-2rem))] lg:w-[min(420px,calc(100vw-2rem))]',
                    widgetSideClass
                  )
            )}
            aria-label="IntegraServe AI chat widget"
          >
            <header
              className="flex h-14 shrink-0 items-center justify-between px-3 text-white sm:px-4"
              style={{ backgroundColor: config.primaryColor }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{config.companyName} AI</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    <StatusBadge status={connectionStatus} />
                    <span className="hidden sm:inline">{isConnected ? config.model : 'Connecting…'}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <HeaderIconButton label="New chat" onClick={handleNewChat}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </HeaderIconButton>
                <HeaderIconButton
                  label={isMaximized ? 'Restore chat widget' : 'Maximize chat widget'}
                  onClick={() => setIsMaximized((expanded) => !expanded)}
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
                </HeaderIconButton>
                <HeaderIconButton label="Close chat" onClick={handleClose}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </HeaderIconButton>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-4">
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
                <AnimatePresence mode="wait">
                  {showEmpty ? (
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
                      className="space-y-5"
                    >
                      {visibleMessages.map((message) => (
                        <MessageRenderer
                          key={message.id}
                          message={message}
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

            <div className="shrink-0 border-t bg-card/95 pt-3 backdrop-blur-sm">
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

          </motion.section>
        )}
      </AnimatePresence>

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
        conversationId={activeToolConversationId}
        transport={toolTransport}
      />
    </>
  )
}

function HeaderIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-white/60"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

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
