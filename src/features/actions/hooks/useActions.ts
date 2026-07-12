import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionService } from '@/services/action.service'
import { useNotificationStore } from '@/store/notificationStore'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { ActionFilters, UpdateActionData } from '@/types/action'

/** Extract a human-readable error message from Axios error responses.
 *  The backend returns errors in multiple formats:
 *  - {"detail": {"error": "...", "message": "..."}}  (custom HTTPActionParsingException)
 *  - {"errors": {"field": "message"}}               (Pydantic validation error)
 *  - {"message": "..."}                              (generic)
 */
function extractErrorMessage(err: any): string {
  const data = err?.response?.data
  if (!data) return err?.message || 'An unexpected error occurred.'

  // Custom action parsing exceptions: { detail: { error, message } }
  if (data.detail?.message) return data.detail.message
  if (data.detail?.error) return data.detail.error

  // Pydantic validation errors: { errors: { field: message, ... } }
  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.entries(data.errors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('; ')
    return messages
  }

  // Generic: { message: "..." }
  if (data.message) return data.message

  return 'Please try again.'
}

export function useActions(filters?: ActionFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.actions, filters],
    queryFn: () => actionService.getActions(filters),
  })
}

export function useActionDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.action(id),
    queryFn: () => actionService.getAction(id),
    enabled: enabled && !!id,
  })
}

export function useActionMutations() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)

  const createAction = useMutation({
    mutationFn: actionService.createAction,
    onSuccess: (newAction) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
      addToast({ type: 'success', title: 'Action created', message: `Action '${newAction.name}' created successfully.` })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to create action', message: extractErrorMessage(err) })
    },
  })

  const updateAction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateActionData> }) => actionService.updateAction(id, data),
    onSuccess: (updatedAction, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.action(variables.id) })
      addToast({ type: 'success', title: 'Action updated', message: `Action '${updatedAction.name}' updated successfully.` })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to update action', message: extractErrorMessage(err) })
    },
  })

  const toggleAction = useMutation({
    mutationFn: (id: string) => actionService.toggleAction(id),
    onSuccess: (updatedAction) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.action(updatedAction.id) })
      addToast({
        type: 'success',
        title: 'Status updated',
        message: `Action '${updatedAction.name}' is now ${updatedAction.status}.`,
      })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to toggle status', message: extractErrorMessage(err) })
    },
  })

  const deleteAction = useMutation({
    mutationFn: (id: string) => actionService.deleteAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
      addToast({ type: 'success', title: 'Action deleted', message: 'Action removed successfully.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to delete action', message: extractErrorMessage(err) })
    },
  })

  return { createAction, updateAction, toggleAction, deleteAction }
}
