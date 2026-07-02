import api from '@/services/api'
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api'
import type { ChatAttachment } from '../types'

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

export async function updateMessage(messageId: string, text: string) {
  const { data } = await api.put<UpdateMessageResponse>(
    `${API_ENDPOINTS.chat.messageDetail(messageId)}`,
    { message_text: text }
  )
  return data
}

export async function deleteMessage(messageId: string) {
  const { data } = await api.delete<{ message: string }>(
    `${API_ENDPOINTS.chat.messageDetail(messageId)}`
  )
  return data
}

export async function uploadFile(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadFileResponse>(
    `${API_ENDPOINTS.chat.upload}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function getAttachments(messageId: string) {
  const { data } = await api.get<ChatAttachment[]>(
    `${API_ENDPOINTS.chat.attachments(messageId)}`
  )
  return data
}

export function getAssetUrl(url: string) {
  if (url.startsWith('http')) return url
  return `${API_BASE_URL.replace('/api', '')}${url}`
}
