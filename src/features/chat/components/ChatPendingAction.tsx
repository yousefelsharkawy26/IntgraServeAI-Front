// ============================================================
// Chat Pending Action Card
// Human-in-the-loop confirmation for tool executions
// ============================================================

import React, { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Shield, Zap, ExternalLink, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PendingAction } from '../types'

interface ChatPendingActionProps {
  pendingAction: PendingAction
  onConfirm: (approved: boolean) => void
  className?: string
}

export const ChatPendingAction = React.memo(function ChatPendingAction({
  pendingAction,
  onConfirm,
  className,
}: ChatPendingActionProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleConfirm = (approved: boolean) => {
    setIsResponding(true)
    onConfirm(approved)
    // Defensive: clear the responding state if the parent doesn't unmount us
    // within a reasonable window. This was a real bug — if the WS response
    // never arrived, the buttons stayed disabled forever.
    window.setTimeout(() => setIsResponding(false), 8000)
  }

  // Escape to decline — keyboard users expect Escape to cancel a dialog.
  // We attach the listener directly (rather than via useModalA11y) because
  // this is an inline alertdialog, not an overlay modal.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isResponding) {
      e.preventDefault()
      handleConfirm(false)
    }
  }

  const actionConfig = getActionConfig(pendingAction.actionName)

  // Memoize the JSON.stringify so it only recomputes when params change,
  // not on every render (e.g. when isResponding flips).
  const paramsJson = useMemo(
    () => JSON.stringify(pendingAction.params, null, 2),
    [pendingAction.params]
  )
  const paramCount = pendingAction.params ? Object.keys(pendingAction.params).length : 0

  return (
    <motion.div
      ref={containerRef}
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="pending-action-title"
      aria-describedby="pending-action-desc"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card shadow-sm focus:outline-none',
        className
      )}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
            <Shield className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 id="pending-action-title" className="text-sm font-semibold text-foreground">
              Action Required
            </h4>
            <p id="pending-action-desc" className="text-xs text-muted-foreground mt-0.5">
              The AI wants to perform an action on your behalf
            </p>
          </div>
        </div>

        {/* Action card */}
        <div className="rounded-xl bg-muted/50 border border-border/50 p-3">
          <div className="flex items-center gap-2.5">
            <actionConfig.icon className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              {pendingAction.actionName}
            </span>
            <span className={cn(
              'ml-auto text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full',
              actionConfig.badgeClass
            )}>
              {actionConfig.risk}
            </span>
          </div>

          {/* Expandable params */}
          {paramCount > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDetails((s) => !s)}
                aria-expanded={showDetails}
                aria-controls="pending-action-params"
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
              >
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Parameters ({paramCount})
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.pre
                    id="pending-action-params"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 overflow-x-auto rounded-lg bg-black/5 dark:bg-white/5 p-2.5 text-[11px] text-muted-foreground scrollbar-thin"
                  >
                    <code>{paramsJson}</code>
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConfirm(true)}
            disabled={isResponding}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5',
              'bg-primary text-primary-foreground font-medium text-sm',
              'hover:bg-primary/90 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConfirm(false)}
            disabled={isResponding}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5',
              'border border-border bg-background text-foreground font-medium text-sm',
              'hover:bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <XCircle className="h-4 w-4" />
            Decline
          </motion.button>
        </div>
        <p className="text-[10px] text-muted-foreground/70 text-center">
          Press <kbd className="font-mono">Esc</kbd> to decline
        </p>
      </div>
    </motion.div>
  )
})

// ============================================================
// Action configuration based on action name
// ============================================================

function getActionConfig(actionName: string) {
  const configs: Record<string, { icon: typeof Zap; risk: string; badgeClass: string }> = {
    'create_support_ticket': {
      icon: Zap,
      risk: 'Medium',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    'create_technical_ticket': {
      icon: Zap,
      risk: 'Medium',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    'send_email': {
      icon: ExternalLink,
      risk: 'High',
      badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    'modify_data': {
      icon: Zap,
      risk: 'High',
      badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  // Default config
  const defaultConfig = {
    icon: Zap,
    risk: 'Low',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }

  // Find matching config
  for (const [key, config] of Object.entries(configs)) {
    if (actionName.toLowerCase().includes(key.toLowerCase())) {
      return config
    }
  }

  return defaultConfig
}