// ============================================================
// Chat Page - Main Integration
// Full-page premium AI chat experience
// ============================================================

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeft, CircleDot,
} from 'lucide-react'

import { useChatStore } from '../store/useChatStore'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { ChatLayout } from './ChatLayout'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatComposer } from './ChatComposer'
import { UserMessage, AIMessage, SystemMessage, ToolExecutionCard } from './ChatMessage'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import { ChatPendingAction } from './ChatPendingAction'
import { ImagePreviewModal } from './ChatAttachmentCard'
import { StatusBadge } from './ChatAvatar'
import type { PendingFile, ChatMessage } from '../types'
import '../chat.css'
import { ToolRenderer } from '../tools'
import type { ToolTransport } from '../tools'
// ============================================================
// Demo user - replace with your auth system
// ============================================================
const DEMO_USER = {
  email: 'demo@integraserve.ai',
  name: 'Demo User',
}

export default function ChatPage() {
  const sidebarOpen = useChatStore((s) => s.sidebarOpen)
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
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
  const setConversations = useChatStore((s) => s.setConversations)
  const addConversation = useChatStore((s) => s.addConversation)
  const pinConversation = useChatStore((s) => s.pinConversation)
  const favoriteConversation = useChatStore((s) => s.favoriteConversation)
  const setMessages = useChatStore((s) => s.setMessages)
  const setIsTyping = useChatStore((s) => s.setIsTyping)
  const setPendingAction = useChatStore((s) => s.setPendingAction)
  const setInputValue = useChatStore((s) => s.setInputValue)
  const addPendingFile = useChatStore((s) => s.addPendingFile)
  const removePendingFile = useChatStore((s) => s.removePendingFile)
  const clearPendingFiles = useChatStore((s) => s.clearPendingFiles)
  const setPreviewImage = useChatStore((s) => s.setPreviewImage)
  const setConnectionStatus = useChatStore((s) => s.setConnectionStatus)

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
    stopGeneration,
  } = useChatWebSocket({
    customerEmail: DEMO_USER.email,
    customerName: DEMO_USER.name,
  })

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

  // ---- Auto connect on mount ----
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // ---- Scroll to bottom on new messages ----
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [storeMessages, isTyping])

  // ---- Load conversations on mount ----
  useEffect(() => {
    import('../services/chat.service').then(({ fetchConversations }) => {
      fetchConversations().then((convs) => {
        setConversations(Array.isArray(convs) ? convs : [])
      }).catch(() => {
        // Demo data will be used
      })
    })
  }, [setConversations])

  // ---- Handlers ----

  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim() && pendingFiles.length === 0) return
    wsSendMessage(content)
    setInputValue('')
    clearPendingFiles()
  }, [wsSendMessage, pendingFiles.length, setInputValue, clearPendingFiles])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const pendingFile: PendingFile = {
        id,
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }
      addPendingFile(pendingFile)
    })
  }, [addPendingFile])

  const handleEditMessage = useCallback((id: string, content: string) => {
    wsEditMessage(id, content)
  }, [wsEditMessage])

  const handleDeleteMessage = useCallback((id: string) => {
    wsRemoveMessage(id)
  }, [wsRemoveMessage])

  const handleNewChat = useCallback(() => {
    setActiveConversation(null)
    // Create new conversation in store
    const newConv = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      preview: '',
      timestamp: new Date().toISOString(),
      messageCount: 0,
    }
    addConversation(newConv)
    setActiveConversation(newConv.id)
  }, [setActiveConversation, addConversation])

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
      sendResult: (toolCallId, status, payload, reason) => {
        sendToolResult(toolCallId, status, payload)
      },
      // Optional: forward progress and log events to backend
      sendProgress: (toolCallId, percent, message) => {
        // Future: ws.send({ type: 'tool_progress', tool_call_id, percent, message })
      },
      sendLog: (toolCallId, message, level) => {
        // Future: ws.send({ type: 'tool_log', tool_call_id, message, level })
      },
    }),
    [sendToolResult]
  )

  // ---- Render ----
  return (
    <ChatLayout
      sidebarCollapsed={!sidebarOpen}
      onToggleSidebar={toggleSidebar}
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={setActiveConversation}
      onNewChat={handleNewChat}
      onPinConversation={pinConversation}
      onFavoriteConversation={favoriteConversation}
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

                {/* Typing indicator */}
                {isTyping && <ChatTypingIndicator />}

                {/* Pending action */}
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
          onRemoveFile={removePendingFile}
          isTyping={isTyping}
          isConnected={isConnected}
        />
      </div>

      {/* Image preview modal */}
      <AnimatePresence>
        {previewImage && (
          <ImagePreviewModal
            imageUrl={previewImage}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>

      {/* Generic Tool Renderer — renders any registered tool */}
      <ToolRenderer
        activeTool={activeTool}
        conversationId={conversationId}
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
  // System/tool messages
  if (message.sender === 'system') {
    // Check if this is a tool execution message
    if (message.toolCalls && message.toolCalls.length > 0) {
      return <ToolExecutionCard toolCall={message.toolCalls[0]} />
    }
    return <SystemMessage message={message} />
  }

  // User message
  if (message.sender === 'user') {
    return (
      <UserMessage
        message={message}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
  }

  // AI message
  return <AIMessage message={message} />
})
