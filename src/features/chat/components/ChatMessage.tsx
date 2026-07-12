// ============================================================
// Chat Message Components
// User message, AI message, System/Tool message
// Premium message design with animations and interactions
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Pencil, Trash2, Check, X, RotateCcw,
  Copy, CheckCheck, Quote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { ChatMessage as ChatMessageType } from '../types'
import { ChatAvatar } from './ChatAvatar'
import { ChatMarkdown } from './ChatMarkdown'
import { StreamingCursor } from './ChatStreamingCursor'
import { ChatAttachmentCard } from './ChatAttachmentCard'

// ============================================================
// User Message
// ============================================================

interface UserMessageProps {
  message: ChatMessageType
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
}

export const UserMessage = React.memo(function UserMessage({
  message,
  onEdit,
  onDelete,
}: UserMessageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)

  const handleEditSave = useCallback(() => {
    if (editValue.trim() && editValue !== message.content) {
      onEdit?.(message.id, editValue.trim())
    }
    setIsEditing(false)
  }, [editValue, message.id, message.content, onEdit])

  const handleEditCancel = useCallback(() => {
    setEditValue(message.content)
    setIsEditing(false)
  }, [message.content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="group/user flex flex-col items-end gap-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Message row */}
      <div className="flex items-start gap-2.5 max-w-[85%]">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditSave()
                  if (e.key === 'Escape') handleEditCancel()
                }}
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditSave}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
                <span className="text-[10px] text-muted-foreground ml-1">
                  Ctrl+Enter to save
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 shadow-sm">
              <p className="text-[15px] leading-relaxed text-primary-foreground whitespace-pre-wrap">
                {message.content}
              </p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {message.attachments.map((att) => (
                    <ChatAttachmentCard
                      key={att.id}
                      attachment={att}
                      variant="compact"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timestamp & edited badge */}
          {!isEditing && (
            <div className="flex items-center justify-end gap-2 mt-1 px-1">
              {message.is_edited && (
                <span className="text-[10px] text-muted-foreground/60">edited</span>
              )}
              <span className="text-[10px] text-muted-foreground/50">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          )}
        </div>

        {/* Avatar */}
        <ChatAvatar sender="user" size="sm" />
      </div>

      {/* Action bar - appears on hover OR keyboard focus within */}
      {!isEditing && (
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-0.5 mr-10 opacity-0 group-hover/user:opacity-100 group-focus-within/user:opacity-100 motion-reduce:opacity-100"
        >
          <MessageActionButton
            icon={<Pencil className="h-3 w-3" />}
            label="Edit"
            onClick={() => setIsEditing(true)}
          />
          <MessageActionButton
            icon={<Trash2 className="h-3 w-3" />}
            label="Delete"
            onClick={() => onDelete?.(message.id)}
            variant="danger"
          />
          <CopyButton text={message.content} />
        </motion.div>
      )}
    </motion.div>
  )
})

// ============================================================
// AI Message
// ============================================================

interface AIMessageProps {
  message: ChatMessageType
  onRegenerate?: () => void
  onQuote?: (content: string) => void
}

export const AIMessage = React.memo(function AIMessage({
  message,
  onRegenerate,
  onQuote,
}: AIMessageProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="group/ai flex gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        <ChatAvatar
          sender="ai"
          size="md"
          status={message.isStreaming ? 'thinking' : undefined}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Sender label */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">IntegraServe AI</span>
          {message.isStreaming && (
            <span className="text-[10px] text-muted-foreground animate-pulse">
              writing...
            </span>
          )}
        </div>

        {/* Message content */}
        <div className="text-foreground">
          <ChatMarkdown content={message.content} />
          {message.isStreaming && <StreamingCursor />}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.attachments.map((att) => (
              <ChatAttachmentCard key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Action bar - visible on hover OR keyboard focus within */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-0.5 pt-1 opacity-0 group-hover/ai:opacity-100 group-focus-within/ai:opacity-100 motion-reduce:opacity-100"
        >
          <CopyButton text={message.content} />
          <MessageActionButton
            icon={<Quote className="h-3 w-3" />}
            label="Quote"
            onClick={() => onQuote?.(message.content)}
          />
          <MessageActionButton
            icon={<RotateCcw className="h-3 w-3" />}
            label="Regenerate"
            onClick={onRegenerate}
          />
        </motion.div>
      </div>
    </motion.div>
  )
})

// ============================================================
// System Message (Tool calls, errors, notifications)
// ============================================================

interface SystemMessageProps {
  message: ChatMessageType
}

export const SystemMessage = React.memo(function SystemMessage({ message }: SystemMessageProps) {
  // Prefer the explicit isError flag from the WS hook. Fall back to content
  // matching only for legacy / externally-injected system messages.
  const isError =
    message.isError === true ||
    (!message.isError && message.content.toLowerCase().includes('error')) ||
    message.content.toLowerCase().includes('failed')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center justify-center py-2',
        isError && 'text-red-500'
      )}
    >
      <div className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs',
        isError
          ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
          : 'bg-muted/60 text-muted-foreground'
      )}>
        {message.content}
      </div>
    </motion.div>
  )
})

// ============================================================
// Tool Execution Card
// ============================================================

import {
  CheckCircle2, XCircle, Loader2, Clock, Shield, Ban, Timer,
} from 'lucide-react'
import type { ToolCallInfo, ToolStatus } from '../types'

interface ToolExecutionCardProps {
  toolCall: ToolCallInfo
  className?: string
}

/** Visual configuration for every tool lifecycle state. */
const TOOL_STATUS_CONFIG: Record<
  ToolStatus,
  { icon: typeof Loader2; color: string; bg: string; spin: boolean; label: string }
> = {
  pending: {
    icon: Clock,
    color: 'text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-950/20',
    spin: false,
    label: 'Pending',
  },
  waiting_for_approval: {
    icon: Shield,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    spin: false,
    label: 'Awaiting Approval',
  },
  waiting_for_user_input: {
    icon: Shield,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    spin: false,
    label: 'Awaiting Input',
  },
  running: {
    icon: Loader2,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    spin: true,
    label: 'Running',
  },
  submitting: {
    icon: Loader2,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    spin: true,
    label: 'Submitting',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    spin: false,
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    spin: false,
    label: 'Failed',
  },
  cancelled: {
    icon: Ban,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    spin: false,
    label: 'Cancelled',
  },
  timeout: {
    icon: Timer,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    spin: false,
    label: 'Timed Out',
  },
  retrying: {
    icon: Loader2,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    spin: true,
    label: 'Retrying',
  },
}

export const ToolExecutionCard = React.memo(function ToolExecutionCard({
  toolCall,
  className,
}: ToolExecutionCardProps) {
  const config = TOOL_STATUS_CONFIG[toolCall.status] ?? TOOL_STATUS_CONFIG.running
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'rounded-xl border overflow-hidden my-2',
        config.bg,
        className
      )}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <Icon className={cn('h-4 w-4 shrink-0', config.color, config.spin && 'animate-spin')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{toolCall.name}</span>
            <span className={cn('text-[10px] uppercase tracking-wider font-medium', config.color)}>
              {config.label}
            </span>
          </div>
          {toolCall.output && toolCall.status !== 'running' && toolCall.status !== 'pending' && toolCall.status !== 'waiting_for_approval' && (
            <p className="mt-1 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
              {toolCall.output}
            </p>
          )}
          {toolCall.input && Object.keys(toolCall.input).length > 0 && (
            <pre className="mt-1.5 text-[11px] text-muted-foreground overflow-x-auto">
              <code>{JSON.stringify(toolCall.input, null, 2)}</code>
            </pre>
          )}
        </div>
      </div>
    </motion.div>
  )
})

// ============================================================
// Shared Components
// ============================================================

interface MessageActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  variant?: 'default' | 'danger'
}

const MessageActionButton = React.memo(function MessageActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: MessageActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        variant === 'danger' && 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  )
})

// Copy button with feedback
const CopyButton = React.memo(function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear the timeout on unmount so we never call setState on an unmounted
  // component (which would log a React warning).
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can reject in non-secure contexts; fail silently.
    }
  }, [text])

  return (
    <MessageActionButton
      icon={copied ? <CheckCheck className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      label={copied ? 'Copied!' : 'Copy'}
      onClick={handleCopy}
    />
  )
})

// Timestamp formatting
function formatTimestamp(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return ''
  }
}