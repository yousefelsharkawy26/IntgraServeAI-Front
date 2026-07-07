// ============================================================
// Chat Avatar Component
// Premium avatar with status indicator and animations
// ============================================================

import React from 'react'
import { motion } from 'framer-motion'
import { User, Sparkles, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatAvatarProps {
  sender: 'user' | 'ai' | 'system'
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'thinking' | 'error'
  className?: string
}

const sizeMap = {
  sm: { container: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  md: { container: 'h-9 w-9', icon: 'h-4.5 w-4.5' },
  lg: { container: 'h-11 w-11', icon: 'h-5.5 w-5.5' },
}

const senderConfig = {
  user: {
    gradient: 'from-blue-500 to-indigo-600',
    icon: User,
    label: 'You',
  },
  ai: {
    gradient: 'from-violet-500 to-purple-600',
    icon: Sparkles,
    label: 'AI Assistant',
  },
  system: {
    gradient: 'from-amber-500 to-orange-600',
    icon: Wrench,
    label: 'System',
  },
}

export const ChatAvatar = React.memo(function ChatAvatar({
  sender,
  size = 'md',
  status,
  className,
}: ChatAvatarProps) {
  const config = senderConfig[sender]
  const Icon = config.icon
  const s = sizeMap[size]

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn('relative shrink-0', className)}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
          s.container,
          config.gradient
        )}
      >
        <Icon className={cn('text-white', s.icon)} />
      </div>

      {/* Status indicator */}
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
            status === 'online' && 'bg-emerald-500',
            status === 'offline' && 'bg-slate-400',
            status === 'thinking' && 'bg-amber-400',
            status === 'error' && 'bg-red-500'
          )}
        />
      )}
    </motion.div>
  )
})

// Status badge for connection state
interface StatusBadgeProps {
  status: 'disconnected' | 'connecting' | 'connected'
  className?: string
}

export const StatusBadge = React.memo(function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    connected: { color: 'bg-emerald-500', label: 'Online', pulse: true },
    connecting: { color: 'bg-amber-400', label: 'Connecting...', pulse: true },
    disconnected: { color: 'bg-slate-400', label: 'Offline', pulse: false },
  }

  const c = config[status]

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', c.color, !c.pulse && 'hidden')} />
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', c.color)} />
      </span>
      <span className="text-[11px] text-muted-foreground">{c.label}</span>
    </div>
  )
})
