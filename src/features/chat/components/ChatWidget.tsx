// ============================================================
// Chat Widget - Floating widget mode
// Premium floating chat widget like Intercom/Drift
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Maximize2, Minimize2, Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatComposer } from './ChatComposer'
import { UserMessage, AIMessage, SystemMessage, ToolExecutionCard } from './ChatMessage'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import { ChatPendingAction } from './ChatPendingAction'
import { ImagePreviewModal } from './ChatAttachmentCard'
import { StatusBadge } from './ChatAvatar'
import type { PendingFile, ChatMessage, ChatConfig } from '../types'
import { DEFAULT_CHAT_CONFIG } from '../types'

interface ChatWidgetProps {
  config?: Partial<ChatConfig>
  customerEmail?: string
  customerName?: string
}

const DEMO_USER = {
  email: 'guest@integraserve.ai',
  name: 'Guest',
}

export function ChatWidget({
  config: userConfig,
  customerEmail,
  customerName,
}: ChatWidgetProps) {
  const config = { ...DEFAULT_CHAT_CONFIG, ...userConfig }
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Local state for widget
  const [inputValue, setInputValue] = useState('')
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  // WebSocket
  const {
    messages,
    connectionStatus,
    isTyping,
    pendingAction,
    connect,
    disconnect,
    sendMessage: wsSendMessage,
    confirmAction: wsConfirmAction,
    stopGeneration,
  } = useChatWebSocket({
    customerEmail: customerEmail || DEMO_USER.email,
    customerName: customerName || DEMO_USER.name,
  })

  const isConnected = connectionStatus === 'connected'
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  // Connect when opened
  useEffect(() => {
    if (isOpen) connect()
  }, [isOpen, connect])

  // Handle send
  const handleSend = useCallback((content: string) => {
    if (!content.trim()) return
    wsSendMessage(content)
    setInputValue('')
  }, [wsSendMessage])

  // Handle file select
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const pendingFile: PendingFile = {
        id,
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }
      setPendingFiles((prev) => [...prev, pendingFile])
    })
  }, [])

  // Remove pending file
  const handleRemoveFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const showEmpty = messages.length === 0 && !isTyping
  const visibleMessages = messages.filter((m) => !(m.sender === 'user' && m.is_deleted))
  const positionClass = config.position === 'left' ? 'left-4' : 'right-4'

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-4 z-50 flex h-14 w-14 items-center justify-center',
              'rounded-full shadow-lg shadow-primary/20',
              'transition-transform hover:scale-105 active:scale-95',
              positionClass,
            )}
            style={{ backgroundColor: config.primaryColor }}
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'fixed bottom-4 z-50 flex flex-col overflow-hidden shadow-2xl',
              'bg-background border rounded-2xl',
              isExpanded ? 'inset-4 w-auto h-auto' : 'h-[640px] w-[420px]',
              positionClass,
            )}
            style={{ borderRadius: config.borderRadius }}
          >
            {/* Header */}
            <div
              className="flex h-14 shrink-0 items-center justify-between px-4"
              style={{ backgroundColor: config.primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{config.companyName} AI</p>
                  <div className="scale-75 origin-left">
                    <StatusBadge status={connectionStatus} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); disconnect() }}
                  className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-muted/30">
              <AnimatePresence mode="wait">
                {showEmpty ? (
                  <ChatEmptyState
                    key="empty"
                    onSendMessage={handleSend}
                    welcomeMessage={config.welcomeMessage}
                  />
                ) : (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    {visibleMessages.map((msg) => (
                      <WidgetMessageRenderer
                        key={msg.id}
                        message={msg}
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

            {/* Composer */}
            <div className="shrink-0 border-t bg-card">
              <ChatComposer
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                onStop={stopGeneration}
                pendingFiles={pendingFiles}
                onFileSelect={handleFileSelect}
                onRemoveFile={handleRemoveFile}
                isTyping={isTyping}
                isConnected={isConnected}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {previewImage && (
          <ImagePreviewModal
            imageUrl={previewImage}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// Widget message renderer
function WidgetMessageRenderer({
  message,
}: {
  message: ChatMessage
}) {
  if (message.sender === 'system') {
    if (message.toolCalls && message.toolCalls.length > 0) {
      return <ToolExecutionCard toolCall={message.toolCalls[0]} />
    }
    return <SystemMessage message={message} />
  }
  if (message.sender === 'user') {
    return <UserMessage message={message} />
  }
  return <AIMessage message={message} />
}
