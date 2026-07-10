import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import { mapBackendTicketToFrontend, mapBackendMessageToFrontend } from '@/mappers/ticket.mapper'
import { useAuthStore } from '@/store/authStore'
import type { Ticket, TicketListResponse, TicketFilters, CreateTicketData, UpdateTicketData, TicketMessage, InternalNote } from '@/types/ticket'

export const ticketService = {
  async getTickets(filters: TicketFilters): Promise<TicketListResponse> {
    const params = new URLSearchParams()
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority)
    if (filters.search) params.append('search', filters.search)
    if (filters.sortBy) params.append('sort_by', filters.sortBy === 'updatedAt' ? 'updated_at' : 'created_at')
    params.append('page', String(filters.page))
    params.append('limit', String(filters.limit))

    const userRoles = useAuthStore.getState().user?.roles || []
    const endpoint = userRoles.includes('Admin') 
      ? '/tickets/admin/all' 
      : '/tickets/my-tickets'

    const { data } = await api.get<any>(`${endpoint}?${params.toString()}`)
    const tickets = (data.tickets || []).map(mapBackendTicketToFrontend)

    return {
      tickets,
      total: data.total || 0,
      page: data.page || 1,
      totalPages: Math.ceil((data.total || 0) / filters.limit),
    }
  },

  async getTicket(id: string): Promise<Ticket> {
    const { data } = await api.get<any>(API_ENDPOINTS.tickets.detail(id))
    const messagesResponse = await api.get<any>(API_ENDPOINTS.tickets.messages(id))
    const rawMessages = messagesResponse.data.messages || []
    
    const ticket = mapBackendTicketToFrontend(data)
    
    ticket.messages = rawMessages
      .filter((m: any) => !m.is_internal_note)
      .map(mapBackendMessageToFrontend)
      
    ticket.internalNotes = rawMessages
      .filter((m: any) => m.is_internal_note)
      .map((n: any) => ({
        id: String(n.id),
        ticketId: String(n.ticket_id),
        content: n.message_text,
        authorId: String(n.sender_id || ''),
        authorName: n.sender_name || 'Agent',
        createdAt: n.created_at,
      }))

    const activityLog = [
      { id: '1', ticketId: ticket.id, action: 'Ticket created', actorName: ticket.customerName, createdAt: ticket.createdAt }
    ]
    if (data.assigned_at) {
      activityLog.push({ id: '2', ticketId: ticket.id, action: 'Assigned to agent', actorName: ticket.assignedToName || 'Agent', createdAt: data.assigned_at })
    }
    if (data.resolved_at) {
      activityLog.push({ id: '3', ticketId: ticket.id, action: 'Marked as resolved', actorName: ticket.assignedToName || 'Agent', createdAt: data.resolved_at })
    }
    if (data.closed_at) {
      activityLog.push({ id: '4', ticketId: ticket.id, action: 'Ticket closed', actorName: 'System', createdAt: data.closed_at })
    }
    ticket.activityLog = activityLog

    return ticket
  },

  async createTicket(ticket: CreateTicketData): Promise<Ticket> {
    const backendData = {
      title: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      customer_name: ticket.customerName,
      customer_email: ticket.customerEmail,
      external_customer_id: 'AGENT_CREATED',
    }
    const { data } = await api.post<any>('/tickets/external/create', backendData)
    return this.getTicket(data.ticket_id)
  },

  async updateTicket(id: string, ticket: UpdateTicketData): Promise<Ticket> {
    if (ticket.status) {
      await this.changeStatus(id, ticket.status)
    }
    if (ticket.assignedTo) {
      await this.assignTicket(id)
    }
    return this.getTicket(id)
  },

  async deleteTicket(id: string): Promise<void> {
    await api.delete(`/tickets/admin/${id}`)
  },

  async assignTicket(id: string): Promise<any> {
    const { data } = await api.patch<any>(`/tickets/${id}/assign-to-me`)
    return data
  },

  async changeStatus(id: string, status: string): Promise<any> {
    let endpoint = `/tickets/${id}/status`
    let body: any = { status }

    if (status === 'resolved') {
      endpoint = `/tickets/${id}/resolve`
      body = { resolution_notes: 'Resolved by customer support agent.' }
    } else if (status === 'closed') {
      endpoint = `/tickets/${id}/close`
      body = {}
    } else if (status === 'cancelled') {
      endpoint = `/tickets/${id}/cancel`
      body = { cancellation_reason: 'Canceled by customer support agent.' }
    }

    const { data } = await api.patch<any>(endpoint, body)
    return data
  },

  async getTicketMessages(id: string): Promise<TicketMessage[]> {
    const { data } = await api.get<any>(API_ENDPOINTS.tickets.messages(id))
    return (data.messages || []).map(mapBackendMessageToFrontend)
  },

  async addMessage(id: string, content: string): Promise<TicketMessage> {
    const formData = new FormData()
    formData.append('message_text', content)
    formData.append('is_internal_note', 'false')

    const { data } = await api.post<any>(API_ENDPOINTS.tickets.messages(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return {
      id: data.message_id || String(Date.now()),
      ticketId: id,
      content,
      sender: 'user',
      senderName: useAuthStore.getState().user?.name || 'Agent',
      createdAt: new Date().toISOString(),
    }
  },

  async addNote(id: string, content: string): Promise<InternalNote> {
    const formData = new FormData()
    formData.append('message_text', content)
    formData.append('is_internal_note', 'true')

    const { data } = await api.post<any>(API_ENDPOINTS.tickets.messages(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return {
      id: data.message_id || String(Date.now()),
      ticketId: id,
      content,
      authorId: useAuthStore.getState().user?.id || '',
      authorName: useAuthStore.getState().user?.name || 'Agent',
      createdAt: new Date().toISOString(),
    }
  },
}
