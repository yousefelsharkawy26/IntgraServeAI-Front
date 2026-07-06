export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'escalated' | 'resolved' | 'closed' | 'cancelled'
export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low'
export type TicketSource = 'email' | 'chat' | 'web' | 'api' | 'widget'

export interface TicketMessage {
  id: string
  ticketId: string
  content: string
  sender: 'user' | 'customer' | 'ai' | 'system'
  senderName: string
  senderAvatar?: string
  attachments?: Attachment[]
  createdAt: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  mimeType: string
}

export interface InternalNote {
  id: string
  ticketId: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  ticketId: string
  action: string
  actorName: string
  details?: string
  createdAt: string
}

export interface Ticket {
  id: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  source: TicketSource
  customerName: string
  customerEmail: string
  customerAvatar?: string
  assignedTo?: string
  assignedToName?: string
  tags: string[]
  messages: TicketMessage[]
  internalNotes: InternalNote[]
  activityLog: ActivityLog[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  slaDeadline?: string
}

export interface TicketFilters {
  status?: TicketStatus | 'all'
  priority?: TicketPriority | 'all'
  search?: string
  assignedTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page: number
  limit: number
}

export interface TicketListResponse {
  tickets: Ticket[]
  total: number
  page: number
  totalPages: number
}

export interface CreateTicketData {
  subject: string
  description: string
  priority: TicketPriority
  customerName: string
  customerEmail: string
}

export interface UpdateTicketData {
  subject?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assignedTo?: string
}
