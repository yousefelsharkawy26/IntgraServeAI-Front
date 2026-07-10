// ============================================================
// Chat Sidebar
// Modern sidebar with infinite conversations, search, folders, and navigation
// ============================================================

import React, { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Pin, Star, Archive, MessageSquare,
  X, Settings, PanelLeftClose, Sparkles,
  HelpCircle, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Conversation, ConversationFilter } from '../types'

interface ChatSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  activeFilter: ConversationFilter
  searchQuery: string
  isLoading?: boolean
  isFetchingMore?: boolean
  hasMore?: boolean
  onSelect: (id: string) => void
  onNewChat: () => void
  onFilterChange: (filter: ConversationFilter) => void
  onSearchChange: (query: string) => void
  onLoadMore: () => void
  onPin: (id: string) => void
  onFavorite: (id: string) => void
  onArchive: (id: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export const ChatSidebar = React.memo(function ChatSidebar({
  conversations,
  activeId,
  activeFilter,
  searchQuery,
  isLoading,
  isFetchingMore,
  hasMore,
  onSelect,
  onNewChat,
  onFilterChange,
  onSearchChange,
  onLoadMore,
  onPin,
  onFavorite,
  onArchive,
  collapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const grouped = useMemo(() => {
    const groups: Record<string, Conversation[]> = {}

    conversations.forEach((conv) => {
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
  }, [conversations])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingMore) {
          onLoadMore()
        }
      },
      { root: target.parentElement, rootMargin: '280px 0px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isFetchingMore, onLoadMore])

  // Collapsed state
  if (collapsed) {
    return null
  }

  return (
    <motion.aside
      aria-label="Conversations sidebar"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full border-r bg-card shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600" aria-hidden="true">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">IntegraServe</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNewChat}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border border-border/60',
            'bg-background px-4 py-2.5 text-sm font-medium text-foreground',
            'hover:bg-muted hover:border-border transition-all shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Chat
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
            className={cn(
              'w-full rounded-lg border border-input bg-background pl-8 pr-8 py-2 text-sm',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-3 pb-2">
        <div className="flex gap-1 p-0.5 rounded-lg bg-muted" role="tablist" aria-label="Filter conversations">
          {(['all', 'pinned', 'favorites', 'archived'] as const).map((filter) => {
            const Icon = filter === 'all' ? MessageSquare : filter === 'pinned' ? Pin : filter === 'favorites' ? Star : Archive
            return (
              <button
                type="button"
                key={filter}
                role="tab"
                aria-selected={activeFilter === filter}
                aria-pressed={activeFilter === filter}
                onClick={() => onFilterChange(filter)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeFilter === filter
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                <span className="capitalize">{filter}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([groupTitle, convs]) => (
            <div key={groupTitle}>
              <div
                className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                role="heading"
                aria-level={3}
              >
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
                  onArchive={onArchive}
                />
              ))}
            </div>
          ))
        )}

        <div ref={loadMoreRef} className="h-8" aria-hidden="true" />
        {isFetchingMore && (
          <div className="flex items-center justify-center py-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {!hasMore && conversations.length > 0 && (
          <p className="py-2 text-center text-[10px] text-muted-foreground/70">End of conversations</p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="border-t p-2">
        <div className="flex items-center gap-1">
          <SidebarAction icon={<Settings className="h-4 w-4" />} label="Settings" />
          <SidebarAction icon={<HelpCircle className="h-4 w-4" />} label="Help" />
        </div>
      </div>
    </motion.aside>
  )
})

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: (id: string) => void
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
  onArchive,
}: ConversationItemProps) {
  return (
    <div className="relative group/item">
      <motion.div
        role="button"
        tabIndex={0}
        whileHover={{ x: 1 }}
        onClick={() => onSelect(conversation.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect(conversation.id)
          }
        }}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`${conversation.title}. ${conversation.messageCount} messages. ${formatRelativeTime(conversation.timestamp)}${conversation.isPinned ? '. Pinned.' : ''}${conversation.isFavorite ? '. Favorite.' : ''}`}
        className={cn(
          'w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground hover:bg-muted',
        )}
      >
        <MessageSquare className={cn(
          'h-4 w-4 shrink-0 mt-0.5',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={cn(
              'text-sm font-medium truncate',
              isActive && 'text-primary'
            )}>
              {conversation.title}
            </span>
            {conversation.isPinned && (
              <Pin className="h-3 w-3 text-amber-500 shrink-0" aria-hidden="true" />
            )}
            {conversation.isFavorite && (
              <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" aria-hidden="true" />
            )}
          </div>
          {conversation.preview && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {conversation.preview}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground/70">
              <time dateTime={conversation.timestamp}>{formatRelativeTime(conversation.timestamp)}</time>
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {conversation.messageCount} messages
            </span>
          </div>
        </div>

        <div className={cn(
          'absolute right-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity',
          'bg-card shadow-sm rounded-md border',
          'group-hover/item:opacity-100 group-focus-within/item:opacity-100 motion-reduce:opacity-100',
        )}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPin(conversation.id) }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={conversation.isPinned ? `Unpin ${conversation.title}` : `Pin ${conversation.title}`}
            aria-pressed={conversation.isPinned}
          >
            <Pin className={cn('h-3 w-3', conversation.isPinned && 'text-amber-500 fill-amber-500')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFavorite(conversation.id) }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={conversation.isFavorite ? `Remove ${conversation.title} from favorites` : `Add ${conversation.title} to favorites`}
            aria-pressed={conversation.isFavorite}
          >
            <Star className={cn('h-3 w-3', conversation.isFavorite && 'text-amber-500 fill-amber-500')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onArchive(conversation.id) }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={conversation.isArchived ? `Unarchive ${conversation.title}` : `Archive ${conversation.title}`}
            aria-pressed={conversation.isArchived}
          >
            <Archive className={cn('h-3 w-3', conversation.isArchived && 'text-blue-500')} aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </div>
  )
})

function SidebarAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs',
        'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
