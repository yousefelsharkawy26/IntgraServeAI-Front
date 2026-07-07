// ============================================================
// Chat Empty State
// Premium landing experience with greeting, prompts, and actions
// ============================================================

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Zap, MessageSquare, Clock, TrendingUp,
  Users, Receipt, Wrench, Key, ArrowRight, Bot,
  Lightbulb, FileQuestion, Shield, BarChart3, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUGGESTED_PROMPTS } from '../types'
// Types imported via SUGGESTED_PROMPTS

interface ChatEmptyStateProps {
  onSendMessage: (message: string) => void
  welcomeMessage?: string
}

const iconMap: Record<string, React.ElementType> = {
  Key, Clock, TrendingUp, Users, Receipt, Wrench,
  Zap, MessageSquare, Lightbulb, FileQuestion, Shield, BarChart3, Settings,
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 28 } },
}

export const ChatEmptyState = React.memo(function ChatEmptyState({
  onSendMessage,
  welcomeMessage = "I'm your AI assistant. How can I help you today?",
}: ChatEmptyStateProps) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center min-h-full px-4 py-12"
    >
      {/* Background gradient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary/5 via-transparent to-transparent blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-radial from-violet-500/5 via-transparent to-transparent blur-2xl" />
      </div>

      {/* Hero section */}
      <motion.div variants={itemVariants} className="text-center mb-10 relative z-10">
        {/* Logo / Avatar */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/20"
        >
          <Bot className="h-8 w-8 text-white" />
        </motion.div>

        {/* Greeting */}
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {greeting}
        </h1>

        {/* Welcome message */}
        <p className="text-muted-foreground text-[15px] max-w-md mx-auto leading-relaxed">
          {welcomeMessage}
        </p>
      </motion.div>

      {/* Suggested prompts grid */}
      <motion.div variants={itemVariants} className="w-full max-w-2xl relative z-10">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Suggested questions
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {SUGGESTED_PROMPTS.map((prompt) => {
            const Icon = iconMap[prompt.icon] || MessageSquare
            return (
              <motion.button
                key={prompt.id}
                variants={itemVariants}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSendMessage(prompt.label)}
                className={cn(
                  'group flex items-start gap-3 rounded-xl border border-border/60 bg-card/50',
                  'p-3.5 text-left transition-all duration-200',
                  'hover:border-primary/30 hover:bg-card hover:shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {prompt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {prompt.category}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-0.5" />
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="mt-8 flex items-center gap-4 relative z-10">
        <QuickAction
          icon={<Sparkles className="h-4 w-4" />}
          label="New conversation"
          onClick={() => onSendMessage('')}
        />
        <QuickAction
          icon={<FileQuestion className="h-4 w-4" />}
          label="Help center"
          onClick={() => onSendMessage('How do I get help?')}
        />
        <QuickAction
          icon={<Users className="h-4 w-4" />}
          label="Talk to agent"
          onClick={() => onSendMessage('Can I talk to a human agent?')}
        />
      </motion.div>
    </motion.div>
  )
})

// ============================================================
// Quick Action Button
// ============================================================

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

const QuickAction = React.memo(function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border border-border/60 bg-card/50',
        'px-4 py-2 text-sm text-muted-foreground transition-all',
        'hover:border-primary/30 hover:text-foreground hover:bg-card hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
      )}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
})
