import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  X,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Bot,
  User,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Pencil,
  Trash2,
  Check,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DEFAULT_CHAT_CONFIG, SUGGESTED_QUESTIONS } from '../types'
import type { ChatConfig, ChatAttachment, ChatMessage } from '../types'
import { useChatWebSocket } from '../hooks/useChatWebSocket'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { updateMessage, deleteMessage, uploadFile, getAssetUrl } from '../services/chat.service'

interface IntegraServeChatProps {
  config?: Partial<ChatConfig>
}

export function IntegraServeChat({ config: userConfig }: IntegraServeChatProps) {
  const config = { ...DEFAULT_CHAT_CONFIG, ...userConfig }
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingFiles, setPendingFiles] = useState<{
    file: File
    preview: string
    uploaded?: { url: string; name: string; type: string }
  }[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msgId: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const authUser = useAuthStore((s) => s.user)
  const {
    messages,
    connectionStatus,
    isTyping,
    pendingAction,
    connect,
    disconnect,
    sendMessage: wsSendMessage,
    editMessage: wsEditMessage,
    removeMessage,
    confirmAction,
  } = useChatWebSocket({
    customerEmail: authUser?.email || 'guest@integraserve.ai',
    customerName: authUser?.name || 'Guest',
  })

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'

  const handleSend = useCallback(async (content: string) => {
    if (!content.trim() && pendingFiles.length === 0) return

    const filesToUpload = pendingFiles.filter((f) => !f.uploaded)
    if (filesToUpload.length > 0) {
      setUploadingFiles(true)
      for (const pf of filesToUpload) {
        try {
          const result = await uploadFile(pf.file)
          pf.uploaded = { url: result.url, name: result.filename, type: result.type }
        } catch {
          // skip failed uploads
        }
      }
      setUploadingFiles(false)
    }

    wsSendMessage(content)
    setInputValue('')
    setPendingFiles([])
  }, [pendingFiles, wsSendMessage])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    connect()
  }, [connect])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setIsExpanded(false)
    setEditingId(null)
    setPendingFiles([])
    disconnect()
  }, [disconnect])

  const handleEditSave = useCallback(async (msgId: string) => {
    if (!editValue.trim()) return
    try {
      await updateMessage(msgId, editValue.trim())
      wsEditMessage(msgId, editValue.trim())
    } catch {
      return
    }
    setEditingId(null)
    setEditValue('')
  }, [editValue, wsEditMessage])

  const handleDelete = useCallback(async (msgId: string) => {
    try {
      await deleteMessage(msgId)
    } catch {
      // proceed optimistically
    }
    removeMessage(msgId)
  }, [removeMessage])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = files.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }))
    setPendingFiles((prev) => [...prev, ...newFiles])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, msgId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, msgId })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    const handler = () => closeContextMenu()
    window.addEventListener('click', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [contextMenu, closeContextMenu])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeContextMenu() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeContextMenu])

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const next = [...prev]
      if (next[index].preview) URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.setSelectionRange(editValue.length, editValue.length)
    }
  }, [editingId, editValue])

  const showWelcome = isOpen && messages.length === 0 && !isConnecting
  const visibleMessages = messages.filter((m) => !(m.sender === 'user' && m.is_deleted))
  const isLight = config.theme === 'light'
  const positionClass = config.position === 'left' ? 'left-4' : 'right-4'

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx"
        className="hidden"
        onChange={handleFileSelect}
      />

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={handleOpen}
            className={cn('fixed bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105', positionClass)}
            style={{ backgroundColor: config.primaryColor, borderRadius: config.borderRadius }}
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'fixed bottom-4 z-50 flex flex-col overflow-hidden shadow-2xl',
              isExpanded ? 'inset-4 w-auto h-auto rounded-2xl' : 'h-[520px] w-[380px] rounded-2xl',
              positionClass
            )}
            style={{
              backgroundColor: isLight ? '#ffffff' : '#1a1a2e',
              borderRadius: config.borderRadius,
              border: `1px solid ${isLight ? '#e5e7eb' : '#2d2d44'}`,
            }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between px-4" style={{ backgroundColor: config.primaryColor }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{config.companyName} Support</p>
                  <p className="text-[10px] text-white/70 flex items-center gap-1">
                    <span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-green-400' : isConnecting ? 'bg-yellow-400' : 'bg-red-400')} />
                    {isConnected ? 'Online' : isConnecting ? 'Connecting...' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsExpanded(!isExpanded)} className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button onClick={handleClose} className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={cn('flex-1 overflow-y-auto px-4 py-3 space-y-3', isLight ? 'bg-gray-50' : 'bg-[#0f0f23]')}>
              {showWelcome && (
                <WelcomeMessage message={config.welcomeMessage} isLight={isLight} />
              )}

              {visibleMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isLight={isLight}
                  primaryColor={config.primaryColor}
                  editingId={editingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  editInputRef={editInputRef}
                  onEditSave={handleEditSave}
                  onEditStart={(id, content) => { setEditingId(id); setEditValue(content); closeContextMenu() }}
                  onEditCancel={() => { setEditingId(null); setEditValue('') }}
                  onDelete={(id) => { handleDelete(id); closeContextMenu() }}
                  onPreview={(url) => setPreviewImage(url)}
                  onContextMenu={handleContextMenu}
                />
              ))}

              {isTyping && <TypingIndicator isLight={isLight} />}

              {pendingAction && (
                <PendingActionCard pendingAction={pendingAction} onConfirm={confirmAction} isLight={isLight} />
              )}

              {messages.length <= 1 && !isTyping && !pendingAction && !showWelcome && (
                <SuggestedQuestions onSelect={handleSend} isLight={isLight} />
              )}

              {contextMenu && (
                <ContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  onEdit={() => {
                    const msg = messages.find((m) => m.id === contextMenu.msgId)
                    if (msg) {
                      setEditingId(msg.id)
                      setEditValue(msg.content)
                    }
                    closeContextMenu()
                  }}
                  onDelete={() => {
                    handleDelete(contextMenu.msgId)
                    closeContextMenu()
                  }}
                  isLight={isLight}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              isConnected={isConnected}
              isConnecting={isConnecting}
              isTyping={isTyping}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSend={handleSend}
              pendingFiles={pendingFiles}
              onRemoveFile={removePendingFile}
              onFileClick={() => fileInputRef.current?.click()}
              uploadingFiles={uploadingFiles}
              isLight={isLight}
              primaryColor={config.primaryColor}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


function WelcomeMessage({ message, isLight }: { message: string; isLight: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex gap-2.5"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className={cn('max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed', isLight ? 'bg-white text-gray-800 shadow-sm' : 'bg-[#1e1e35] text-gray-200')}>
        <p>{message}</p>
      </div>
    </motion.div>
  )
}


interface EditBubbleProps {
  msg: ChatMessage
  editValue: string
  setEditValue: (v: string) => void
  editInputRef: React.RefObject<HTMLTextAreaElement | null>
  onEditSave: (id: string) => void
  onEditCancel: () => void
}

function EditBubble({ msg, editValue, setEditValue, editInputRef, onEditSave, onEditCancel }: EditBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-row-reverse gap-2.5"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
        <User className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="max-w-[75%]">
        <textarea
          ref={editInputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEditSave(msg.id) }
            if (e.key === 'Escape') onEditCancel()
          }}
          className="w-full resize-none rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm outline-none border border-gray-200 bg-white text-gray-800 dark:border-gray-600 dark:bg-[#1e1e35] dark:text-gray-200"
          rows={2}
        />
        <div className="mt-1 flex justify-end gap-1.5">
          <button onClick={() => onEditSave(msg.id)} className="flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700">
            <Check className="h-3 w-3" />
            Save
          </button>
          <button onClick={onEditCancel} className="flex items-center gap-1 rounded-full bg-gray-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-600">
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  )
}


interface NormalBubbleProps {
  msg: ChatMessage
  isLight: boolean
  primaryColor: string
  onEditStart: (id: string, content: string) => void
  onDelete: (id: string) => void
  onPreview: (url: string) => void
  onContextMenu: (e: React.MouseEvent, msgId: string) => void
}

function NormalBubble({ msg, isLight, primaryColor, onEditStart, onDelete, onPreview, onContextMenu }: NormalBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group flex gap-2.5', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row', msg.sender === 'system' ? 'justify-center' : '')}
    >
      {msg.sender !== 'system' && (
        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', msg.sender === 'ai' ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-blue-400 to-purple-500')}>
          {msg.sender === 'ai' ? <Sparkles className="h-3.5 w-3.5 text-white" /> : <User className="h-3.5 w-3.5 text-white" />}
        </div>
      )}

      {msg.sender === 'system' ? (
        <div className="max-w-[90%] rounded-md bg-transparent text-center text-xs text-gray-400 px-3.5 py-2.5">
          <p>{msg.content}</p>
        </div>
      ) : (
        <div
          onContextMenu={(e) => msg.sender === 'user' && onContextMenu(e, msg.id)}
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            msg.sender === 'user' ? 'max-w-[75%] rounded-br-md text-white' : 'max-w-[75%] rounded-bl-md',
            msg.sender !== 'user' && (isLight ? 'bg-white text-gray-800 shadow-sm' : 'bg-[#1e1e35] text-gray-200')
          )}
          style={msg.sender === 'user' ? { backgroundColor: primaryColor } : {}}
        >
          {msg.sender === 'ai' ? (
            <div className="markdown-body break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                  a: ({ node, ...props }: any) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                  li: ({ node, ...props }: any) => <li {...props} />,
                  h1: ({ node, ...props }: any) => <h1 className="text-lg font-bold mb-1 mt-2" {...props} />,
                  h2: ({ node, ...props }: any) => <h2 className="text-md font-bold mb-1 mt-2" {...props} />,
                  h3: ({ node, ...props }: any) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                  strong: ({ node, ...props }: any) => <strong className="font-semibold" {...props} />,
                  blockquote: ({ node, ...props }: any) => (
                    <blockquote className={cn("border-l-2 pl-2 italic mb-2", isLight ? "border-gray-300 text-gray-600" : "border-gray-600 text-gray-400")} {...props} />
                  ),
                  pre: ({ node, ...props }: any) => (
                    <pre className={cn("rounded-md p-2 overflow-x-auto font-mono text-[11px] mb-2", isLight ? "bg-gray-100 text-gray-800" : "bg-black/30 text-gray-200")} {...props} />
                  ),
                  code: ({ node, className, ...props }: any) => {
                    const isInline = !className?.includes('language-');
                    return (
                      <code
                        className={cn(
                          "font-mono text-[11px]",
                          isInline && (isLight ? "bg-gray-100 rounded px-1 py-0.5" : "bg-black/30 rounded px-1 py-0.5"),
                          className
                        )}
                        {...props}
                      />
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          )}

          {msg.attachments && msg.attachments.length > 0 && (
            <div className={cn('mt-2 space-y-1.5', msg.sender === 'user' ? 'text-white/90' : '')}>
              {msg.attachments.map((att) => (
                <AttachmentThumbnail key={att.id} attachment={att} onPreview={onPreview} light={isLight} />
              ))}
            </div>
          )}

          <div className={cn('mt-1 flex items-center gap-2', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            {msg.is_edited && (
              <span className={cn('text-[10px] italic', msg.sender === 'user' ? 'text-white/50' : 'text-gray-400')}>(edited)</span>
            )}
            <p className={cn('text-[10px]', msg.sender === 'user' ? 'text-white/60' : 'text-gray-400')}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {msg.sender === 'user' && (
            <div className="mt-1.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEditStart(msg.id, msg.content)}
                className={cn('flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors', isLight ? 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200')}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => onDelete(msg.id)}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}


function MessageBubble(props: {
  msg: ChatMessage
  isLight: boolean
  primaryColor: string
  editingId: string | null
  editValue: string
  setEditValue: (v: string) => void
  editInputRef: React.RefObject<HTMLTextAreaElement | null>
  onEditSave: (id: string) => void
  onEditStart: (id: string, content: string) => void
  onEditCancel: () => void
  onDelete: (id: string) => void
  onPreview: (url: string) => void
  onContextMenu: (e: React.MouseEvent, msgId: string) => void
}) {
  const { msg, editingId, editValue, setEditValue, editInputRef, onEditSave, onEditCancel, ...rest } = props

  if (msg.sender === 'user' && editingId === msg.id) {
    return (
      <EditBubble
        msg={msg}
        editValue={editValue}
        setEditValue={setEditValue}
        editInputRef={editInputRef}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
      />
    )
  }

  return (
    <NormalBubble
      msg={msg}
      {...rest}
      onEditStart={rest.onEditStart}
      onDelete={rest.onDelete}
      onPreview={rest.onPreview}
      onContextMenu={rest.onContextMenu}
    />
  )
}


function TypingIndicator({ isLight }: { isLight: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className={cn('rounded-2xl rounded-bl-md px-4 py-3', isLight ? 'bg-white shadow-sm' : 'bg-[#1e1e35]')}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              className={cn('h-2 w-2 rounded-full', isLight ? 'bg-gray-300' : 'bg-gray-600')}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}


function PendingActionCard({ pendingAction, onConfirm, isLight }: {
  pendingAction: { actionName: string; params: Record<string, unknown> }
  onConfirm: (approved: boolean) => void
  isLight: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center"
      style={{
        borderColor: isLight ? '#fed7aa' : '#78350f',
        backgroundColor: isLight ? '#fff7ed' : '#1c1917',
      }}
    >
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
        The AI wants to: <strong>{pendingAction.actionName}</strong>
      </p>
      {pendingAction.params && Object.keys(pendingAction.params).length > 0 && (
        <pre className="max-w-full overflow-x-auto rounded bg-black/5 p-2 text-[10px] text-gray-500 dark:bg-white/5 dark:text-gray-400">
          {JSON.stringify(pendingAction.params, null, 2)}
        </pre>
      )}
      <p className="text-[11px] text-gray-500">Do you approve this action?</p>
      <div className="flex gap-2">
        <button onClick={() => onConfirm(true)} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700">
          <CheckCircle className="h-3.5 w-3.5" />
          Approve
        </button>
        <button onClick={() => onConfirm(false)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700">
          <XCircle className="h-3.5 w-3.5" />
          Deny
        </button>
      </div>
    </motion.div>
  )
}


function SuggestedQuestions({ onSelect, isLight }: { onSelect: (q: string) => void; isLight: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-2 pt-1">
      {SUGGESTED_QUESTIONS.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className={cn('flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors', isLight ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50' : 'border-gray-700 bg-[#1e1e35] text-gray-400 hover:border-gray-600')}
        >
          {q}
          <ChevronRight className="h-3 w-3" />
        </button>
      ))}
    </motion.div>
  )
}


function ChatInput({
  isConnected, isConnecting, isTyping, inputValue, setInputValue, onSend,
  pendingFiles, onRemoveFile, onFileClick, uploadingFiles, isLight, primaryColor,
}: {
  isConnected: boolean
  isConnecting: boolean
  isTyping: boolean
  inputValue: string
  setInputValue: (v: string) => void
  onSend: (v: string) => void
  pendingFiles: { file: File; preview: string }[]
  onRemoveFile: (i: number) => void
  onFileClick: () => void
  uploadingFiles: boolean
  isLight: boolean
  primaryColor: string
}) {
  const canSend = (inputValue.trim() || pendingFiles.length > 0) && isConnected && !isTyping && !uploadingFiles

  return (
    <div className={cn('shrink-0 border-t', isLight ? 'border-gray-100 bg-white' : 'border-gray-800 bg-[#1a1a2e]')}>
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b px-3 py-2" style={{ borderColor: isLight ? '#e5e7eb' : '#2d2d44' }}>
          {pendingFiles.map((pf, i) => (
            <span key={i} className={cn('flex items-center gap-1 rounded-md px-2 py-0.5 text-xs', isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-800 text-gray-300')}>
              {pf.file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
              <span className="max-w-[80px] truncate">{pf.file.name}</span>
              <button onClick={() => onRemoveFile(i)} className="ml-0.5 hover:text-red-400"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="px-3 py-2.5">
        <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5', isLight ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-[#0f0f23]')}>
          <button
            onClick={onFileClick}
            disabled={!isConnected || isTyping}
            className="shrink-0 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSend) onSend(inputValue) }}
            placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
            disabled={!isConnected || isTyping}
            className={cn('flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400', isLight ? 'text-gray-800' : 'text-gray-200')}
          />
          <button
            onClick={() => onSend(inputValue)}
            disabled={!canSend}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40"
            style={{ backgroundColor: canSend ? primaryColor : undefined }}
          >
            {isConnecting || uploadingFiles ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Send className="h-3.5 w-3.5 text-white" />
            )}
          </button>
        </div>
        <p className={cn('mt-1.5 text-center text-[10px]', isLight ? 'text-gray-400' : 'text-gray-600')}>Powered by IntegraServeAI</p>
      </div>
    </div>
  )
}


function AttachmentThumbnail({ attachment, onPreview, light }: {
  attachment: ChatAttachment
  onPreview: (url: string) => void
  light: boolean
}) {
  const isImage = attachment.type.startsWith('image/')
  const url = getAssetUrl(attachment.url)

  if (isImage) {
    return (
      <button onClick={() => onPreview(url)} className={cn('group relative block overflow-hidden rounded-lg', light ? 'bg-gray-100' : 'bg-gray-800')}>
        <img src={url} alt={attachment.name} className="max-h-[120px] w-auto max-w-full cursor-pointer rounded-lg object-cover transition-transform group-hover:scale-105" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <Eye className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </button>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors', light ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="max-w-[120px] truncate">{attachment.name}</span>
      <Download className="h-3 w-3 shrink-0 ml-auto" />
    </a>
  )
}


function ContextMenu({ x, y, onEdit, onDelete, isLight }: {
  x: number
  y: number
  onEdit: () => void
  onDelete: () => void
  isLight: boolean
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const maxX = window.innerWidth - rect.width - 8
    const maxY = window.innerHeight - rect.height - 8
    if (rect.left > maxX) el.style.left = `${maxX}px`
    if (rect.top > maxY) el.style.top = `${maxY}px`
  }, [x, y])

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.1 }}
      style={{ left: x, top: y, position: 'fixed' }}
      className={cn(
        'z-[70] min-w-[130px] overflow-hidden rounded-xl border py-1 shadow-xl',
        isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-[#1a1a2e]'
      )}
    >
      <button
        onClick={onEdit}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors',
          isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-gray-700'
        )}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit message
      </button>
      <button
        onClick={onDelete}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete message
      </button>
    </motion.div>
  )
}
