// ============================================================
// Chat Sidebar
// Modern sidebar with conversations, search, folders, and navigation
// ============================================================

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Pin, Star, Archive, MessageSquare,
  X, Settings, PanelLeft, PanelLeftClose, Sparkles,
  Inbox, HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Conversation } from '../types'

interface ChatSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onPin: (id: string) => void
  onFavorite: (id: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export const ChatSidebar = React.memo(function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onPin,
  onFavorite,
  collapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'favorites' | 'archived'>('all')

  // Filter conversations
  const filtered = useMemo(() => {
    let result = [...conversations]

    // Apply filter
    switch (activeFilter) {
      case 'pinned':
        result = result.filter((c) => c.isPinned)
        break
      case 'favorites':
        result = result.filter((c) => c.isFavorite)
        break
      case 'archived':
        result = result.filter((c) => c.isArchived)
        break
      default:
        result = result.filter((c) => !c.isArchived)
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q)
      )
    }

    // Sort: pinned first, then by timestamp
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [conversations, activeFilter, searchQuery])

  // Group by time
  const grouped = useMemo(() => {
    const groups: Record<string, Conversation[]> = {}

    filtered.forEach((conv) => {
      const date = new Date(conv.timestamp)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      let key: string
      if (diffDays === 0) key = 'Today'
      else if (diffDays === 1) key = 'Yesterday'
      else if (diffDays < 7) key = 'Previous 7 days'
      else if (diffDays < 30) key = 'Previous 30 days'
      else key = 'Older'

      if (!groups[key]) groups[key] = []
      groups[key].push(conv)
    })

    return groups
  }, [filtered])

  // Collapsed state
  if (collapsed) {
    return (
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 64 }}
        className="flex flex-col items-center border-r bg-card py-3 gap-2 shrink-0"
      >
        <SidebarIconButton icon={<PanelLeft className="h-5 w-5" />} label="Expand sidebar" onClick={onToggleCollapse} />
        <div className="w-8 h-px bg-border my-1" />
        <SidebarIconButton icon={<Plus className="h-5 w-5" />} label="New chat" onClick={onNewChat} />
        <SidebarIconButton icon={<Inbox className="h-5 w-5" />} label="All conversations" onClick={() => setActiveFilter('all')} />
        <SidebarIconButton icon={<Pin className="h-5 w-5" />} label="Pinned" onClick={() => setActiveFilter('pinned')} />
        <SidebarIconButton icon={<Star className="h-5 w-5" />} label="Favorites" onClick={() => setActiveFilter('favorites')} />
        <SidebarIconButton icon={<Archive className="h-5 w-5" />} label="Archived" onClick={() => setActiveFilter('archived')} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full border-r bg-card shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">IntegraServe</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNewChat}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border border-border/60',
            'bg-background px-4 py-2.5 text-sm font-medium text-foreground',
            'hover:bg-muted hover:border-border transition-all shadow-sm',
          )}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={cn(
              'w-full rounded-lg border border-input bg-background pl-8 pr-8 py-2 text-sm',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-3 pb-2">
        <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
          {(['all', 'pinned', 'favorites', 'archived'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all',
                activeFilter === filter
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {filter === 'all' && <MessageSquare className="h-3 w-3" />}
              {filter === 'pinned' && <Pin className="h-3 w-3" />}
              {filter === 'favorites' && <Star className="h-3 w-3" />}
              {filter === 'archived' && <Archive className="h-3 w-3" />}
              <span className="capitalize">{filter}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([groupTitle, convs]) => (
            <div key={groupTitle}>
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {groupTitle}
              </div>
              {convs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onSelect={onSelect}
                  onPin={onPin}
                  onFavorite={onFavorite}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div className="border-t p-2">
        <div className="flex items-center gap-1">
          <SidebarAction icon={<Settings className="h-4 w-4" />} label="Settings" />
          <SidebarAction icon={<HelpCircle className="h-4 w-4" />} label="Help" />
        </div>
      </div>
    </motion.div>
  )
})

// ============================================================
// Conversation Item
// ============================================================

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onPin: (id: string) => void
  onFavorite: (id: string) => void
  onArchive: (id: string) => void
}

const ConversationItem = React.memo(function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onPin,
  onFavorite,
}: Omit<ConversationItemProps, 'onDelete' | 'onArchive'>) {

  return (
    <div className="relative group/item">
      <motion.button
        whileHover={{ x: 1 }}
        onClick={() => onSelect(conversation.id)}
        className={cn(
          'w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground hover:bg-muted',
        )}
      >
        <MessageSquare className={cn(
          'h-4 w-4 shrink-0 mt-0.5',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={cn(
              'text-sm font-medium truncate',
              isActive && 'text-primary'
            )}>
              {conversation.title}
            </span>
            {conversation.isPinned && (
              <Pin className="h-3 w-3 text-amber-500 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {conversation.preview}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground/60">
              {formatRelativeTime(conversation.timestamp)}
            </span>
            <span className="text-[10px] text-muted-foreground/40">
              {conversation.messageCount} messages
            </span>
          </div>
        </div>

        {/* Quick actions on hover */}
        <div className={cn(
          'absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity',
          'bg-card shadow-sm rounded-md border',
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onPin(conversation.id) }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={conversation.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={cn('h-3 w-3', conversation.isPinned && 'text-amber-500 fill-amber-500')} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(conversation.id) }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={conversation.isFavorite ? 'Remove favorite' : 'Favorite'}
          >
            <Star className={cn('h-3 w-3', conversation.isFavorite && 'text-amber-500 fill-amber-500')} />
          </button>
        </div>
      </motion.button>
    </div>
  )
})

// ============================================================
// Sidebar Helper Components
// ============================================================

function SidebarIconButton({ icon, label, onClick, active }: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        active && 'bg-primary/10 text-primary'
      )}
    >
      {icon}
    </button>
  )
}

function SidebarAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs',
        'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function formatRelativeTime(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return ''
  }
}
