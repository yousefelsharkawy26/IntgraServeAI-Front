// ============================================================
// Chat Service - Preserved API calls with enhanced patterns
// ============================================================

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { ChatAttachment, Conversation } from '../types'
import api from '@/services/api'

// -- Mock API client for demo (replace with your actual api instance) --

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

export interface PageMeta {
  page: number
  limit: number
  total: number
  has_more: boolean
}

export interface ConversationsPage {
  items: Conversation[]
  meta: PageMeta
}

export interface ConversationDetail extends Conversation {
  messages: import('../types').ChatMessage[]
  messagesMeta?: PageMeta
}

interface BackendConversation {
  id: string
  session_id: string
  customer_email: string
  customer_name: string
  title?: string | null
  external_customer_id?: string | null
  is_active: boolean
  started_at: string
  ended_at?: string | null
  has_pending_state?: boolean
  message_count?: number
  messages?: BackendMessage[]
  messages_meta?: PageMeta
}

interface BackendMessage {
  id: string
  chat_conversation_id: string
  sender_type: string
  message_text: string
  created_at: string
  attachments?: Array<{
    id: string
    filename: string
    content_type: string
    size_bytes: number
  }>
}

const mapBackendConversation = (conversation: BackendConversation): Conversation => ({
  id: String(conversation.id),
  sessionId: conversation.session_id,
  customerEmail: conversation.customer_email,
  customerName: conversation.customer_name,
  title: conversation.title || 'New Chat',
  preview: conversation.has_pending_state ? 'Pending action' : '',
  timestamp: conversation.started_at,
  messageCount: conversation.message_count || 0,
  isActive: conversation.is_active,
})

const mapBackendMessage = (message: BackendMessage): import('../types').ChatMessage => {
  const senderType = String(message.sender_type || '').toLowerCase()
  const sender = senderType === 'ai'
    ? 'ai'
    : senderType === 'agent'
      ? 'system'
      : 'user'

  return {
    id: String(message.id),
    content: message.message_text || '',
    sender,
    timestamp: message.created_at,
    attachments: (message.attachments || []).map((attachment) => ({
      id: String(attachment.id),
      name: attachment.filename,
      url: '',
      type: attachment.content_type,
      size: attachment.size_bytes,
    })),
  }
}

export async function fetchConversationsPage({
  page = 1,
  limit = 30,
  customerEmail,
  search,
}: {
  page?: number
  limit?: number
  customerEmail?: string
  search?: string
}): Promise<ConversationsPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (customerEmail) params.set('customer_email', customerEmail)
  if (search) params.set('search', search)

  const { data } = await api.get<{ items: BackendConversation[]; meta: PageMeta }>(
    `${API_ENDPOINTS.chat.conversations}?${params.toString()}`
  )

  return {
    items: (data.items || []).map(mapBackendConversation),
    meta: data.meta,
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  const firstPage = await fetchConversationsPage({ page: 1, limit: 30 })
  return firstPage.items
}

export async function fetchConversationDetail(conversationId: string): Promise<ConversationDetail> {
  const { data } = await api.get<BackendConversation>(
    `${API_ENDPOINTS.chat.conversationDetail(conversationId)}?messages_page=1&messages_limit=100`
  )
  return {
    ...mapBackendConversation(data),
    messages: (data.messages || []).map(mapBackendMessage),
    messagesMeta: data.messages_meta,
  }
}

export async function createConversation(payload: {
  sessionId: string
  customerEmail: string
  customerName: string
  externalCustomerId?: string
}): Promise<CreateConversationResponse> {
  const { data } = await api.post<BackendConversation>(
    API_ENDPOINTS.chat.conversations,
    {
      session_id: payload.sessionId,
      customer_email: payload.customerEmail,
      customer_name: payload.customerName,
      external_customer_id: payload.externalCustomerId,
    }
  )
  const conversation = mapBackendConversation(data)
  return {
    id: conversation.id,
    title: conversation.title,
    created_at: conversation.timestamp,
  }
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
  const { data } = await api.patch<BackendConversation>(
    API_ENDPOINTS.chat.conversationDetail(conversationId),
    {
      customer_name: updates.customerName,
      is_active: updates.isActive,
    }
  )
  return mapBackendConversation(data)
}

