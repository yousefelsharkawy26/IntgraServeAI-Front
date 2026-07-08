// ============================================================
// IntegraServe AI Chat - Enhanced Types
// Premium AI Chat Interface Types
// ============================================================

export interface ChatAttachment {
  id: string
  name: string
  url: string
  type: string
  size?: number
}

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ai' | 'system'
  timestamp: string
  is_edited?: boolean
  is_deleted?: boolean
  attachments?: ChatAttachment[]
  /** Streaming state - true while tokens are arriving */
  isStreaming?: boolean
  /** Tool execution metadata */
  toolCalls?: ToolCallInfo[]
  /** Reasoning/thinking content (collapsible) */
  reasoning?: string
  /** Explicit error flag — replaces fragile content.toLowerCase().includes('error') checks */
  isError?: boolean
}

/** All possible tool lifecycle states reported by the backend or derived locally. */
export type ToolStatus =
  | 'pending'
  | 'waiting_for_approval'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'

export interface ToolCallInfo {
  id: string
  /** Server-provided identifier for this tool invocation (may be undefined for legacy events). */
  serverToolCallId?: string
  name: string
  status: ToolStatus
  input?: Record<string, unknown>
  output?: string
  startTime?: string
  endTime?: string
}

export interface Conversation {
  id: string
  title: string
  preview: string
  timestamp: string
  messageCount: number
  isPinned?: boolean
  isFavorite?: boolean
  isArchived?: boolean
  folder?: string
  unreadCount?: number
}

export interface ChatConfig {
  theme: 'light' | 'dark' | 'system'
  primaryColor: string
  position: 'left' | 'right'
  borderRadius: number
  welcomeMessage: string
  logo?: string
  companyName: string
  model: string
}

export interface ChatState {
  isOpen: boolean
  isExpanded: boolean
  sidebarOpen: boolean
  activeConversationId: string | null
  conversations: Conversation[]
  messages: ChatMessage[]
  isTyping: boolean
  inputValue: string
  pendingFiles: PendingFile[]
  isDragging: boolean
  editingMessageId: string | null
  editValue: string
  previewImage: string | null
  uploadingFiles: boolean
  searchQuery: string
  searchOpen: boolean
  activeFolder: string | null
  showArchived: boolean
}

export interface PendingFile {
  id: string
  file: File
  preview: string
  uploaded?: UploadedFileInfo
  progress?: number
  error?: string
}

export interface UploadedFileInfo {
  url: string
  name: string
  type: string
  size: number
}

export interface PendingAction {
  toolCallId: string
  actionName: string
  params: Record<string, unknown>
}

export interface SuggestedPrompt {
  id: string
  label: string
  icon: string
  category: string
}

export interface ModelOption {
  id: string
  name: string
  description: string
  provider: string
  maxTokens: number
}

// ============================================================
// Constants
// ============================================================

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  theme: 'system',
  primaryColor: '#6366f1',
  position: 'right',
  borderRadius: 16,
  welcomeMessage: 'Hello! I\'m your AI assistant. How can I help you today?',
  companyName: 'IntegraServe',
  model: 'gpt-4o',
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: '1', label: 'How do I reset my password?', icon: 'Key', category: 'Account' },
  { id: '2', label: 'What are your business hours?', icon: 'Clock', category: 'Support' },
  { id: '3', label: 'How do I upgrade my plan?', icon: 'TrendingUp', category: 'Billing' },
  { id: '4', label: 'Can I talk to a human agent?', icon: 'Users', category: 'Support' },
  { id: '5', label: 'Explain our refund policy', icon: 'Receipt', category: 'Billing' },
  { id: '6', label: 'Help me troubleshoot an error', icon: 'Wrench', category: 'Technical' },
]

export const QUICK_ACTIONS = [
  { id: 'new-chat', label: 'New Chat', icon: 'Plus', shortcut: 'Ctrl+N' },
  { id: 'search', label: 'Search', icon: 'Search', shortcut: 'Ctrl+K' },
  { id: 'settings', label: 'Settings', icon: 'Settings', shortcut: 'Ctrl+,' },
]

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model', provider: 'OpenAI', maxTokens: 128000 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient', provider: 'OpenAI', maxTokens: 128000 },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Excellent reasoning', provider: 'Anthropic', maxTokens: 200000 },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Quick responses', provider: 'Anthropic', maxTokens: 200000 },
]

export const FOLDER_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
]

export const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  'image/': { icon: 'Image', color: '#8b5cf6', label: 'Image' },
  'application/pdf': { icon: 'FileText', color: '#ef4444', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'FileText', color: '#3b82f6', label: 'Word' },
  'application/msword': { icon: 'FileText', color: '#3b82f6', label: 'Word' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: 'Table', color: '#22c55e', label: 'Excel' },
  'application/vnd.ms-excel': { icon: 'Table', color: '#22c55e', label: 'Excel' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: 'Presentation', color: '#f97316', label: 'PowerPoint' },
  'text/plain': { icon: 'FileText', color: '#6b7280', label: 'Text' },
  'text/csv': { icon: 'Table', color: '#22c55e', label: 'CSV' },
  'text/markdown': { icon: 'FileText', color: '#6b7280', label: 'Markdown' },
  'application/json': { icon: 'Code', color: '#f59e0b', label: 'JSON' },
  'application/zip': { icon: 'Archive', color: '#6b7280', label: 'Archive' },
}

export const WIDGET_SIZE = {
  width: 420,
  height: 640,
  expandedPadding: 16,
}

export const CHAT_LAYOUT = {
  sidebarWidth: 280,
  sidebarWidthCollapsed: 0,
  maxContentWidth: 768,
  composerMaxWidth: 768,
}
