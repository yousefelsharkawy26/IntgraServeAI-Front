// ============================================================
// Chat UI Store - Zustand
// Manages all UI state separate from data/WebSocket state
// ============================================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  ChatMessage,
  Conversation,
  PendingFile,
  PendingAction,
  ChatConfig,
  ToolCallInfo,
} from '../types'
import { DEFAULT_CHAT_CONFIG } from '../types'

interface ChatUIState {
  // -- Layout --
  sidebarOpen: boolean
  isExpanded: boolean
  isMobile: boolean

  // -- Conversation --
  activeConversationId: string | null
  conversations: Conversation[]

  // -- Messages (mirrored from WS hook for UI access) --
  messages: ChatMessage[]
  isTyping: boolean
  pendingAction: PendingAction | null
  toolCalls: ToolCallInfo[]

  // -- Composer --
  inputValue: string
  pendingFiles: PendingFile[]
  isDragging: boolean
  composerFocused: boolean

  // -- Editing --
  editingMessageId: string | null
  editValue: string

  // -- Preview --
  previewImage: string | null
  previewFile: PendingFile | null

  // -- Search --
  searchQuery: string
  searchOpen: boolean

  // -- Filters --
  activeFolder: string | null
  showArchived: boolean

  // -- Config --
  config: ChatConfig

  // -- Connection --
  connectionStatus: 'disconnected' | 'connecting' | 'connected'

  // -- Actions --
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setIsExpanded: (expanded: boolean) => void
  setIsMobile: (mobile: boolean) => void

  setActiveConversation: (id: string | null) => void
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  pinConversation: (id: string) => void
  favoriteConversation: (id: string) => void
  archiveConversation: (id: string) => void

  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  removeMessage: (id: string) => void
  setIsTyping: (typing: boolean) => void
  setPendingAction: (action: PendingAction | null) => void
  setToolCalls: (calls: ToolCallInfo[]) => void

  setInputValue: (value: string) => void
  addPendingFile: (file: PendingFile) => void
  removePendingFile: (id: string) => void
  updateFileProgress: (id: string, progress: number) => void
  setFileError: (id: string, error: string) => void
  setFileUploaded: (id: string, info: { url: string; name: string; type: string; size: number }) => void
  clearPendingFiles: () => void
  setIsDragging: (dragging: boolean) => void
  setComposerFocused: (focused: boolean) => void

  setEditingMessage: (id: string | null, value?: string) => void
  setEditValue: (value: string) => void

  setPreviewImage: (url: string | null) => void
  setPreviewFile: (file: PendingFile | null) => void

  setSearchQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void

  setActiveFolder: (folder: string | null) => void
  setShowArchived: (show: boolean) => void

  setConfig: (config: Partial<ChatConfig>) => void
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void

  reset: () => void
}

const initialState = {
  sidebarOpen: true,
  isExpanded: false,
  isMobile: false,

  activeConversationId: null,
  conversations: [],

  messages: [],
  isTyping: false,
  pendingAction: null,
  toolCalls: [],

  inputValue: '',
  pendingFiles: [],
  isDragging: false,
  composerFocused: false,

  editingMessageId: null,
  editValue: '',

  previewImage: null,
  previewFile: null,

  searchQuery: '',
  searchOpen: false,

  activeFolder: null,
  showArchived: false,

  config: { ...DEFAULT_CHAT_CONFIG },

  connectionStatus: 'disconnected' as const,
}

export const useChatStore = create<ChatUIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Layout
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setIsExpanded: (expanded) => set({ isExpanded: expanded }),
      setIsMobile: (mobile) => set({ isMobile: mobile, sidebarOpen: !mobile }),

      // Conversation
      setActiveConversation: (id) => set({ activeConversationId: id }),
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) =>
        set((s) => ({ conversations: [conversation, ...s.conversations] })),
      updateConversation: (id, updates) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        })),
      pinConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
          ),
        })),
      favoriteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        })),
      archiveConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, isArchived: !c.isArchived } : c
          ),
        })),

      // Messages
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((s) => ({ messages: [...s.messages, message] })),
      updateMessage: (id, updates) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      removeMessage: (id) =>
        set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
      setIsTyping: (typing) => set({ isTyping: typing }),
      setPendingAction: (action) => set({ pendingAction: action }),
      setToolCalls: (calls) => set({ toolCalls: calls }),

      // Composer
      setInputValue: (value) => set({ inputValue: value }),
      addPendingFile: (file) =>
        set((s) => ({ pendingFiles: [...s.pendingFiles, file] })),
      removePendingFile: (id) =>
        set((s) => ({
          pendingFiles: s.pendingFiles.filter((f) => f.id !== id),
        })),
      updateFileProgress: (id, progress) =>
        set((s) => ({
          pendingFiles: s.pendingFiles.map((f) =>
            f.id === id ? { ...f, progress } : f
          ),
        })),
      setFileError: (id, error) =>
        set((s) => ({
          pendingFiles: s.pendingFiles.map((f) =>
            f.id === id ? { ...f, error } : f
          ),
        })),
      setFileUploaded: (id, info) =>
        set((s) => ({
          pendingFiles: s.pendingFiles.map((f) =>
            f.id === id ? { ...f, uploaded: info } : f
          ),
        })),
      clearPendingFiles: () => set({ pendingFiles: [] }),
      setIsDragging: (dragging) => set({ isDragging: dragging }),
      setComposerFocused: (focused) => set({ composerFocused: focused }),

      // Editing
      setEditingMessage: (id, value = '') =>
        set({ editingMessageId: id, editValue: value }),
      setEditValue: (value) => set({ editValue: value }),

      // Preview
      setPreviewImage: (url) => set({ previewImage: url }),
      setPreviewFile: (file) => set({ previewFile: file }),

      // Search
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchOpen: (open) => set({ searchOpen: open }),

      // Filters
      setActiveFolder: (folder) => set({ activeFolder: folder }),
      setShowArchived: (show) => set({ showArchived: show }),

      // Config
      setConfig: (config) =>
        set((s) => ({ config: { ...s.config, ...config } })),

      // Connection
      setConnectionStatus: (status) => set({ connectionStatus: status }),

      // Reset
      reset: () => set(initialState),
    }),
    { name: 'ChatStore' }
  )
)
