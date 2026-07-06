import type { Ticket, TicketMessage, Attachment } from '@/types/ticket'

export const mapBackendTicketToFrontend = (b: any): Ticket => {
  if (!b) return {} as Ticket
  return {
    id: String(b.id || ''),
    subject: b.title || '',
    description: b.description || '',
    status: b.status || 'open',
    priority: b.priority || 'medium',
    source: (b.ticket_type === 'tech' ? 'api' : 'web') as any, // backend ticket_type mapped to frontend source
    customerName: b.customer_name || '',
    customerEmail: b.customer_email || '',
    assignedTo: b.assignee_id || undefined,
    assignedToName: b.assignee_name || undefined,
    tags: b.ai_auto_created ? ['ai-created'] : [],
    messages: b.messages ? b.messages.map(mapBackendMessageToFrontend) : [],
    internalNotes: b.internal_notes ? b.internal_notes.map((n: any) => ({
      id: String(n.id),
      ticketId: String(n.ticket_id),
      content: n.message_text,
      authorId: String(n.sender_id || ''),
      authorName: n.sender_name || 'Agent',
      createdAt: n.created_at,
    })) : [],
    activityLog: b.activity_log || [],
    createdAt: b.created_at || '',
    updatedAt: b.updated_at || '',
    resolvedAt: b.resolved_at || undefined,
    slaDeadline: b.sla_due_date || undefined,
  }
}

export const mapBackendMessageToFrontend = (m: any): TicketMessage => {
  if (!m) return {} as TicketMessage
  
  // Map backend sender_type: agent, customer, ai, system to frontend sender: user, customer, ai, system
  let sender: 'user' | 'customer' | 'ai' | 'system' = 'system'
  if (m.sender_type === 'agent') sender = 'user'
  else if (m.sender_type === 'customer') sender = 'customer'
  else if (m.sender_type === 'ai') sender = 'ai'
  else if (m.sender_type === 'system') sender = 'system'

  return {
    id: String(m.id || ''),
    ticketId: String(m.ticket_id || ''),
    content: m.message_text || '',
    sender,
    senderName: m.sender_name || 'System',
    attachments: m.attachments ? m.attachments.map(mapBackendAttachmentToFrontend) : [],
    createdAt: m.created_at || '',
  }
}

export const mapBackendAttachmentToFrontend = (a: any, index: number = 0): Attachment => {
  if (!a) return {} as Attachment
  return {
    id: a.id || String(index),
    name: a.filename || 'Attachment',
    url: a.file_path ? `http://localhost:8000/${a.file_path}` : '', // maps to FastAPI static mount path
    size: a.file_size || 0,
    mimeType: a.content_type || 'application/octet-stream',
  }
}
