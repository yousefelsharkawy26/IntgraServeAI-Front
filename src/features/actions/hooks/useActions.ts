import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionService } from '@/services/action.service'
import { useNotificationStore } from '@/store/notificationStore'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { ActionFilters, CreateActionData } from '@/types/action'

export function useActions(filters?: ActionFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.actions, filters],
    queryFn: () => actionService.getActions(filters),
  })
}

export function useActionDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.action(id),
    queryFn: () => actionService.getAction(id),
    enabled: !!id,
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
      addToast({ type: 'error', title: 'Failed to create action', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const updateAction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateActionData> }) => actionService.updateAction(id, data),
    onSuccess: (updatedAction, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.action(variables.id) })
      addToast({ type: 'success', title: 'Action updated', message: `Action '${updatedAction.name}' updated successfully.` })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to update action', message: err?.response?.data?.message || 'Please try again.' })
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
      addToast({ type: 'error', title: 'Failed to toggle status', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const deleteAction = useMutation({
    mutationFn: (id: string) => actionService.deleteAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
      addToast({ type: 'success', title: 'Action deleted', message: 'Action removed successfully.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to delete action', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  return { createAction, updateAction, toggleAction, deleteAction }
}
