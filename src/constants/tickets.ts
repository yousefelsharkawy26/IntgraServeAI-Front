import type { TicketStatus, TicketPriority } from '@/types/ticket'

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: 'Open', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  pending: { label: 'Pending', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  escalated: { label: 'Escalated', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  resolved: { label: 'Resolved', color: 'text-green-700', bgColor: 'bg-green-50' },
  closed: { label: 'Closed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  canceled: { label: 'Canceled', color: 'text-red-700', bgColor: 'bg-red-50' },
}

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; dotColor: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-700', dotColor: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-700', dotColor: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-yellow-700', dotColor: 'bg-yellow-500' },
  low: { label: 'Low', color: 'text-green-700', dotColor: 'bg-green-500' },
}

export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'pending', 'escalated', 'resolved', 'closed', 'canceled']
export const TICKET_PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low']

export const KANBAN_COLUMNS: TicketStatus[] = ['open', 'in_progress', 'pending', 'escalated', 'resolved']

export const TICKET_SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Last Updated' },
  { value: 'updated_asc', label: 'First Updated' },
  { value: 'created_desc', label: 'Newest' },
  { value: 'created_asc', label: 'Oldest' },
  { value: 'priority_desc', label: 'Highest Priority' },
  { value: 'priority_asc', label: 'Lowest Priority' },
] as const
