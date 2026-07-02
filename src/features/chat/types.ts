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
}

export interface ChatConfig {
  theme: 'light' | 'dark'
  primaryColor: string
  position: 'left' | 'right'
  borderRadius: number
  welcomeMessage: string
  logo?: string
  companyName: string
}

export interface ChatState {
  isOpen: boolean
  isExpanded: boolean
  messages: ChatMessage[]
  isTyping: boolean
  inputValue: string
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  theme: 'light',
  primaryColor: '#4F46E5',
  position: 'right',
  borderRadius: 16,
  welcomeMessage: 'Hello! How can we help you today?',
  companyName: 'IntegraServe',
}

export const SUGGESTED_QUESTIONS = [
  'How do I reset my password?',
  'What are your business hours?',
  'How do I upgrade my plan?',
  'Can I talk to a human agent?',
]
