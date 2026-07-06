import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '@/services/ticket.service'
import { useNotificationStore } from '@/store/notificationStore'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { CreateTicketData, TicketFilters, UpdateTicketData } from '@/types/ticket'

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.tickets, filters],
    queryFn: () => ticketService.getTickets(filters),
  })
}

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ticket(id),
    queryFn: () => ticketService.getTicket(id),
    enabled: !!id,
  })
}

export function useTicketMessages(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ticketMessages(id),
    queryFn: () => ticketService.getTicketMessages(id),
    enabled: !!id,
  })
}

export function useTicketMutations() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)

  const createTicket = useMutation({
  mutationFn: (data: CreateTicketData) => ticketService.createTicket(data),
  onSuccess: (newTicket) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets })
    addToast({
      type: 'success',
      title: 'Ticket created',
      message: `New ticket #${newTicket.id} created successfully.`,
    })
  },
  onError: (err: any) => {
    console.error('Error creating ticket:', err)
    addToast({
      type: 'error',
      title: 'Failed to create ticket',
      message: err?.response?.data?.message || 'Please try again.',
    })
  },
})

  const updateTicket = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketData }) => ticketService.updateTicket(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) })
      addToast({ type: 'success', title: 'Ticket updated', message: 'Changes saved successfully.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Update failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ticketService.changeStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticketMessages(variables.id) })
      addToast({ type: 'success', title: 'Status updated', message: `Ticket status set to ${variables.status}.` })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to update status', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const assignTicket = useMutation({
    mutationFn: ({ id }: { id: string }) => ticketService.assignTicket(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) })
      addToast({ type: 'success', title: 'Ticket assigned', message: 'Ticket assigned to you.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to assign ticket', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const addMessage = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => ticketService.addMessage(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticketMessages(variables.id) })
      addToast({ type: 'success', title: 'Reply sent', message: 'Your response was posted.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to send reply', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const addNote = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => ticketService.addNote(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticketMessages(variables.id) })
      addToast({ type: 'success', title: 'Note added', message: 'Internal note saved.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to add note', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  return { createTicket, updateTicket, changeStatus, assignTicket, addMessage, addNote }
}
