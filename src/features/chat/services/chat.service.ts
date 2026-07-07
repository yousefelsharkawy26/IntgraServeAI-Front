// ============================================================
// Chat Service - Preserved API calls with enhanced patterns
// ============================================================

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { ChatAttachment, Conversation } from '../types'

// -- Mock API client for demo (replace with your actual api instance) --
const api = {
  get: async <T>(url: string): Promise<{ data: T }> => {
    const res = await fetch(`${API_BASE_URL}${url}`)
    if (!res.ok) throw new Error(`GET ${url} failed`)
    return { data: await res.json() as T }
  },
  post: async <T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<{ data: T }> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config?.headers) {
      const cfgHeaders = config.headers as Record<string, string>
      Object.assign(headers, cfgHeaders)
    }
    const isFormData = data instanceof FormData
    if (isFormData) delete headers['Content-Type']

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: isFormData ? undefined : headers,
      body: isFormData ? data : JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`POST ${url} failed`)
    return { data: await res.json() as T }
  },
  put: async <T>(url: string, data?: unknown): Promise<{ data: T }> => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`PUT ${url} failed`)
    return { data: await res.json() as T }
  },
  delete: async <T>(url: string): Promise<{ data: T }> => {
    const res = await fetch(`${API_BASE_URL}${url}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`DELETE ${url} failed`)
    return { data: await res.json() as T }
  },
}

export interface UpdateMessageResponse {
  id: string
  message_text: string
  is_edited: boolean
  updated_at: string
}

export interface UploadFileResponse {
  filename: string
  url: string
  type: string
  size: number
}

export interface CreateConversationResponse {
  id: string
  title: string
  created_at: string
}

// ============================================================
// Message Operations
// ============================================================

export async function updateMessage(messageId: string, text: string): Promise<UpdateMessageResponse> {
  const { data } = await api.put<UpdateMessageResponse>(
    API_ENDPOINTS.chat.messageDetail(messageId),
    { message_text: text }
  )
  return data
}

export async function deleteMessage(messageId: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    API_ENDPOINTS.chat.messageDetail(messageId)
  )
  return data
}

// ============================================================
// File Operations
// ============================================================

export async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadFileResponse> {
  const form = new FormData()
  form.append('file', file)

  // Simulate progress if callback provided
  if (onProgress) {
    const total = file.size
    let loaded = 0
    const interval = setInterval(() => {
      loaded += total / 10
      if (loaded >= total) {
        loaded = total
        clearInterval(interval)
      }
      onProgress(Math.min(100, Math.round((loaded / total) * 100)))
    }, 100)
  }

  const { data } = await api.post<UploadFileResponse>(
    API_ENDPOINTS.chat.upload,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function getAttachments(messageId: string): Promise<ChatAttachment[]> {
  const { data } = await api.get<ChatAttachment[]>(
    API_ENDPOINTS.chat.attachments(messageId)
  )
  return data
}

export function getAssetUrl(url: string): string {
  if (url.startsWith('http')) return url
  return `${API_BASE_URL.replace('/api', '')}${url}`
}

// ============================================================
// Conversation Operations
// ============================================================

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const { data } = await api.get<Conversation[]>(API_ENDPOINTS.chat.conversations)
    return data
  } catch {
    // Return demo conversations if API not available
    return getDemoConversations()
  }
}

export async function createConversation(title: string): Promise<CreateConversationResponse> {
  const { data } = await api.post<CreateConversationResponse>(
    API_ENDPOINTS.chat.conversations,
    { title }
  )
  return data
}

export async function deleteConversation(conversationId: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    API_ENDPOINTS.chat.conversationDetail(conversationId)
  )
  return data
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<Conversation>
): Promise<Conversation> {
  const { data } = await api.put<Conversation>(
    API_ENDPOINTS.chat.conversationDetail(conversationId),
    updates
  )
  return data
}

// ============================================================
// Demo Data (for development/preview)
// ============================================================

function getDemoConversations(): Conversation[] {
  const now = new Date()
  return [
    {
      id: 'conv-1',
      title: 'Password Reset Help',
      preview: 'I need to reset my account password...',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      messageCount: 8,
      isPinned: true,
    },
    {
      id: 'conv-2',
      title: 'Billing Inquiry',
      preview: 'Can you explain the charges on my invoice?',
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      messageCount: 12,
      isFavorite: true,
    },
    {
      id: 'conv-3',
      title: 'API Integration Support',
      preview: 'How do I authenticate with the REST API?',
      timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
      messageCount: 24,
    },
    {
      id: 'conv-4',
      title: 'Feature Request: Dark Mode',
      preview: 'It would be great to have a dark mode option...',
      timestamp: new Date(now.getTime() - 48 * 3600000).toISOString(),
      messageCount: 6,
      folder: 'Feedback',
    },
    {
      id: 'conv-5',
      title: 'Technical Troubleshooting',
      preview: 'Getting error 500 on the dashboard...',
      timestamp: new Date(now.getTime() - 72 * 3600000).toISOString(),
      messageCount: 18,
      folder: 'Technical',
    },
    {
      id: 'conv-6',
      title: 'Account Upgrade Questions',
      preview: 'What features come with the Pro plan?',
      timestamp: new Date(now.getTime() - 7 * 24 * 3600000).toISOString(),
      messageCount: 10,
      isArchived: true,
    },
  ]
}
