// ============================================================
// Streaming Cursor - Blinking cursor animation
// Shows during AI token streaming
// ============================================================

import React from 'react'
import { motion } from 'framer-motion'

interface StreamingCursorProps {
  className?: string
}

export const StreamingCursor = React.memo(function StreamingCursor({ className }: StreamingCursorProps) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`inline-block w-[2px] h-[1.2em] bg-primary align-text-bottom ml-0.5 ${className}`}
    />
  )
})

// Typing indicator dots for the "AI is thinking" state
interface ThinkingDotsProps {
  className?: string
}

export const ThinkingDots = React.memo(function ThinkingDots({ className }: ThinkingDotsProps) {
  return (
    <div
      role="status"
      aria-label="AI is thinking"
      className={`flex items-center gap-1 ${className}`}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
      <span className="sr-only">AI is thinking…</span>
    </div>
  )
})

// Skeleton loading shimmer for message placeholders
interface MessageSkeletonProps {
  count?: number
  className?: string
}

export const MessageSkeleton = React.memo(function MessageSkeleton({
  count = 1,
  className,
}: MessageSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading messages" className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2 max-w-[80%]">
            <div className="h-3 rounded bg-muted w-3/4" />
            <div className="h-3 rounded bg-muted w-1/2" />
            <div className="h-3 rounded bg-muted w-5/6" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
})

// Shimmer effect for loading states
interface ShimmerProps {
  className?: string
}

export const Shimmer = React.memo(function Shimmer({ className }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
})