// ============================================================
// Chat UI Store - Zustand
// Holds widget UI state and active conversation id without URL routing.
// ============================================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  ChatMessage,
  PendingFile,
  PendingAction,
  ToolCallInfo,
} from '../types'

interface ChatUIState {
  // -- Conversation --
  activeConversationId: string | null

  // -- Messages (mirrored from WebSocket hook for UI access) --
  messages: ChatMessage[]
  isTyping: boolean
  pendingAction: PendingAction | null
  toolCalls: ToolCallInfo[]

  // -- Composer --
  inputValue: string
  pendingFiles: PendingFile[]

  // -- Preview --
  previewImage: string | null

  // -- Connection --
  connectionStatus: 'disconnected' | 'connecting' | 'connected'

  // -- Actions --
  setActiveConversation: (id: string | null) => void

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
  clearPendingFiles: () => void

  setPreviewImage: (url: string | null) => void
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void

  reset: () => void
}

const initialState = {
  activeConversationId: null,

  messages: [],
  isTyping: false,
  pendingAction: null,
  toolCalls: [],

  inputValue: '',
  pendingFiles: [],

  previewImage: null,

  connectionStatus: 'disconnected' as const,
}

export const useChatStore = create<ChatUIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Conversation
      setActiveConversation: (id) => set({ activeConversationId: id }),

      // Messages
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? { ...message, ...updates } : message
          ),
        })),
      removeMessage: (id) =>
        set((state) => ({ messages: state.messages.filter((message) => message.id !== id) })),
      setIsTyping: (typing) => set({ isTyping: typing }),
      setPendingAction: (action) => set({ pendingAction: action }),
      setToolCalls: (calls) => set({ toolCalls: calls }),

      // Composer
      setInputValue: (value) => set({ inputValue: value }),
      addPendingFile: (file) =>
        set((state) => ({ pendingFiles: [...state.pendingFiles, file] })),
      removePendingFile: (id) =>
        set((state) => ({
          pendingFiles: state.pendingFiles.filter((file) => file.id !== id),
        })),
      clearPendingFiles: () => set({ pendingFiles: [] }),

      // Preview
      setPreviewImage: (url) => set({ previewImage: url }),

      // Connection
      setConnectionStatus: (status) => set({ connectionStatus: status }),

      // Reset
      reset: () => set(initialState),
    }),
    { name: 'ChatStore' }
  )
)
