// ============================================================
// Chat Typing Indicator
// Premium animated typing indicator with AI avatar
// ============================================================

import React from 'react'
import { motion } from 'framer-motion'
import { ChatAvatar } from './ChatAvatar'
import { ThinkingDots } from './ChatStreamingCursor'

interface ChatTypingIndicatorProps {
  className?: string
}

export const ChatTypingIndicator = React.memo(function ChatTypingIndicator({
  className,
}: ChatTypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`flex gap-3 ${className}`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        <ChatAvatar sender="ai" size="md" status="thinking" />
      </div>

      {/* Typing bubble */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/40 px-4 py-3">
          <ThinkingDots />
        </div>
        <span className="text-[11px] text-muted-foreground animate-pulse">
          AI is thinking...
        </span>
      </div>
    </motion.div>
  )
})

// Tool execution indicator - shows when a tool is running
interface ToolExecutionIndicatorProps {
  toolName: string
  className?: string
}

export const ToolExecutionIndicator = React.memo(function ToolExecutionIndicator({
  toolName,
  className,
}: ToolExecutionIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="h-3.5 w-3.5 rounded-full border-2 border-primary/30 border-t-primary"
      />
      <span>Running <span className="font-medium text-foreground">{toolName}</span>...</span>
    </motion.div>
  )
})
