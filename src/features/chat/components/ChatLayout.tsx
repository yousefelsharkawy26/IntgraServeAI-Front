// ============================================================
// Chat Layout
// Main layout with sidebar + content area
// ============================================================

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { ChatSidebar } from './ChatSidebar'
import type { Conversation, ConversationFilter } from '../types'

interface ChatLayoutProps {
  children: React.ReactNode
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  conversations: Conversation[]
  activeConversationId: string | null
  activeFilter: ConversationFilter
  searchQuery: string
  isLoadingConversations?: boolean
  isFetchingMoreConversations?: boolean
  hasMoreConversations?: boolean
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onFilterChange: (filter: ConversationFilter) => void
  onSearchChange: (query: string) => void
  onLoadMoreConversations: () => void
  onPinConversation: (id: string) => void
  onFavoriteConversation: (id: string) => void
  onArchiveConversation: (id: string) => void
}

export const ChatLayout = React.memo(function ChatLayout({
  children,
  sidebarCollapsed,
  onToggleSidebar,
  conversations,
  activeConversationId,
  activeFilter,
  searchQuery,
  isLoadingConversations,
  isFetchingMoreConversations,
  hasMoreConversations,
  onSelectConversation,
  onNewChat,
  onFilterChange,
  onSearchChange,
  onLoadMoreConversations,
  onPinConversation,
  onFavoriteConversation,
  onArchiveConversation,
}: ChatLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence initial={false} mode="popLayout">
        {!sidebarCollapsed && (
          <ChatSidebar
            conversations={conversations}
            activeId={activeConversationId}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            isLoading={isLoadingConversations}
            isFetchingMore={isFetchingMoreConversations}
            hasMore={hasMoreConversations}
            onSelect={onSelectConversation}
            onNewChat={onNewChat}
            onFilterChange={onFilterChange}
            onSearchChange={onSearchChange}
            onLoadMore={onLoadMoreConversations}
            onPin={onPinConversation}
            onFavorite={onFavoriteConversation}
            onArchive={onArchiveConversation}
            collapsed={false}
            onToggleCollapse={onToggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Collapsed sidebar (just icons) */}
      {sidebarCollapsed && (
        <CollapsedSidebar onExpand={onToggleSidebar} onNewChat={onNewChat} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
})

// Collapsed sidebar with just icons
function CollapsedSidebar({ onExpand, onNewChat }: { onExpand: () => void; onNewChat: () => void }) {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: 64 }}
      className="flex flex-col items-center border-r bg-card py-3 gap-2 shrink-0"
    >
      <button
        onClick={onExpand}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Expand sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
      <div className="w-8 h-px bg-border my-1" />
      <IconButton icon={<Plus className="h-5 w-5" />} label="New chat" onClick={onNewChat} />
    </motion.div>
  )
}

function IconButton({ icon, label, onClick }: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {icon}
    </button>
  )
}
