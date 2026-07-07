// ============================================================
// IntegraServe AI Chat - Feature Export
// ============================================================

// Components
export { default as ChatPage } from './components/ChatPage'
export { ChatWidget } from './components/ChatWidget'
export { ChatLayout } from './components/ChatLayout'
export { ChatSidebar } from './components/ChatSidebar'
export { ChatEmptyState } from './components/ChatEmptyState'
export { ChatComposer } from './components/ChatComposer'
export { ChatMarkdown } from './components/ChatMarkdown'
export { ChatCodeBlock, InlineCode } from './components/ChatCodeBlock'
export { UserMessage, AIMessage, SystemMessage, ToolExecutionCard } from './components/ChatMessage'
export { ChatTypingIndicator, ToolExecutionIndicator } from './components/ChatTypingIndicator'
export { ChatPendingAction } from './components/ChatPendingAction'
export { ChatAttachmentCard, PendingFileChip, ImagePreviewModal } from './components/ChatAttachmentCard'
export { ChatAvatar, StatusBadge } from './components/ChatAvatar'
export { StreamingCursor, ThinkingDots, MessageSkeleton, Shimmer } from './components/ChatStreamingCursor'

// Hooks
export { useChatWebSocket } from './hooks/useChatWebSocket'

// Store
export { useChatStore } from './store/useChatStore'

// Services
export {
  updateMessage,
  deleteMessage,
  uploadFile,
  getAttachments,
  getAssetUrl,
  fetchConversations,
  createConversation,
  deleteConversation,
  updateConversation,
} from './services/chat.service'
export { API_ENDPOINTS, API_BASE_URL, WS_API_BASE_URL } from '@/constants/api'

// Types
export type {
  ChatAttachment,
  ChatMessage,
  ChatConfig,
  ChatState,
  PendingFile,
  PendingAction,
  SuggestedPrompt,
  Conversation,
  ToolCallInfo,
  ModelOption,
} from './types'
export {
  DEFAULT_CHAT_CONFIG,
  SUGGESTED_PROMPTS,
  QUICK_ACTIONS,
  MODEL_OPTIONS,
  FOLDER_COLORS,
  FILE_TYPE_CONFIG,
} from './types'