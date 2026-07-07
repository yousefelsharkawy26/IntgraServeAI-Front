// ============================================================
// Chat Composer - Hero Component
// Auto-growing textarea, drag & drop, attachments, keyboard shortcuts
// ============================================================

import React, { useRef, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip, Mic, Sparkles,
  CornerDownLeft, StopCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PendingFile } from '../types'
import { PendingFileChip } from './ChatAttachmentCard'

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: (value: string) => void
  onStop?: () => void
  pendingFiles: PendingFile[]
  onFileSelect: (files: FileList | null) => void
  onRemoveFile: (id: string) => void
  isTyping: boolean
  isConnected: boolean
  disabled?: boolean
}

export const ChatComposer = React.memo(function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  pendingFiles,
  onFileSelect,
  onRemoveFile,
  isTyping,
  isConnected,
  disabled,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isSendDisabled = disabled || (!value.trim() && pendingFiles.length === 0) || !isConnected || isTyping

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 200
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [value])

  // Send handler
  const handleSend = useCallback(() => {
    if (isSendDisabled) return
    onSend(value)
    onChange('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, onSend, onChange, isSendDisabled])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter to send (no shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Shift+Enter for newline (default behavior)
  }, [handleSend])

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files?.length > 0) {
      onFileSelect(e.dataTransfer.files)
    }
  }, [onFileSelect])

  // Paste handler for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      const dataTransfer = new DataTransfer()
      files.forEach((f) => dataTransfer.items.add(f))
      onFileSelect(dataTransfer.files)
    }
  }, [onFileSelect])

  // File input handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [onFileSelect])

  return (
    <div
      className={cn(
        'relative w-full max-w-3xl mx-auto px-4 pb-4',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-4 z-50 rounded-2xl border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center backdrop-blur-sm"
          >
            <div className="text-center">
              <Paperclip className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-primary">Drop files here to attach</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main composer container */}
      <motion.div
        layout
        className={cn(
          'relative rounded-2xl border bg-card shadow-sm transition-all duration-200',
          isFocused && 'border-primary/30 shadow-md ring-2 ring-primary/10',
          !isConnected && 'opacity-70',
        )}
      >
        {/* Pending files area */}
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pb-0 flex flex-wrap gap-2">
                <AnimatePresence>
                  {pendingFiles.map((file) => (
                    <PendingFileChip
                      key={file.id}
                      file={file}
                      onRemove={onRemoveFile}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <div className="relative flex items-end gap-2 p-3">
          {/* Left actions */}
          <div className="flex items-center gap-1 shrink-0 pb-1">
            <ComposerButton
              icon={<Paperclip className="h-[18px] w-[18px]" />}
              label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected}
            />
            <ComposerButton
              icon={<Mic className="h-[18px] w-[18px]" />}
              label="Voice input"
              disabled={!isConnected}
            />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={handlePaste}
            placeholder={isConnected ? 'Message IntegraServe AI…' : 'Connecting…'}
            disabled={!isConnected || disabled}
            rows={1}
            aria-label="Message input"
            aria-describedby="composer-hint"
            className={cn(
              'flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none disabled:cursor-not-allowed',
              'min-h-[40px] max-h-[200px]',
            )}
          />

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0 pb-1">
            {/* Send / Stop button */}
            {isTyping ? (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={onStop}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground
                  hover:bg-destructive/90 transition-colors shadow-sm"
                title="Stop generating"
                aria-label="Stop generating"
              >
                <StopCircle className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleSend}
                disabled={isSendDisabled}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all shadow-sm',
                  isSendDisabled
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md'
                )}
                title="Send message"
                aria-label="Send message"
              >
                <CornerDownLeft className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Bottom hint bar */}
        <div className="flex items-center justify-between px-3 pb-2 pt-0">
          <div id="composer-hint" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />
            <span className="text-[11px] text-muted-foreground/70">
              {isConnected ? 'AI may produce inaccurate information' : 'Connecting to server…'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>
            <span>to send</span>
            <kbd className="ml-2 rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Shift+Enter
            </kbd>
            <span>for newline</span>
          </div>
        </div>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.json,.md"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  )
})

// ============================================================
// Composer Button (small circular action buttons)
// ============================================================

interface ComposerButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}

const ComposerButton = React.memo(function ComposerButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: ComposerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        active && 'bg-primary/10 text-primary'
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  )
})