import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  userService,
  type CreateUserData,
  type UpdateUserBasicInfo,
  type UpdateUserRolesData,
  type UpdateUserPasswordData,
  type BulkUserOperationData,
} from '@/services/user.service'

import { useNotificationStore } from '@/store/notificationStore'

import { QUERY_KEYS } from '@/constants/queryKeys'

import type { UserFilters } from '@/types'

// ─── queries ────────────────────────────────────────────────────────────────

export function useUsers(filters?: Partial<UserFilters>) {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, filters],
    queryFn: () => userService.getUsers({ page: 1, limit: 10, ...filters }),
  })
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: () => userService.getUser(id),
    enabled: !!id,
  })
}

export function useMyLogs(page = 1, limit = 10) {
  return useQuery({
    queryKey: [...QUERY_KEYS.myLogs, page, limit],
    queryFn: () => userService.getMyLogs(page, limit),
  })
}

export function useUserLogs(userId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [...QUERY_KEYS.userLogs(userId), page, limit],
    queryFn: () => userService.getUserLogs(userId, page, limit),
    enabled: !!userId,
  })
}

// ─── mutations ──────────────────────────────────────────────────────────────

export function useUserMutations() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users })

  const createUser = useMutation({
    mutationFn: (data: CreateUserData) => userService.createUser(data),
    onSuccess: () => {
      invalidateUsers()
      addToast({ type: 'success', title: 'User created', message: 'New user account has been created.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to create user', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const updateBasicInfo = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserBasicInfo }) => userService.updateUserBasicInfo(id, data),
    onSuccess: (_, variables) => {
      invalidateUsers()
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(variables.id) })
      addToast({ type: 'success', title: 'User updated', message: 'User information saved.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Update failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const updatePassword = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPasswordData }) => userService.updateUserPassword(id, data),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Password updated', message: 'User password has been changed.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Password update failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const updateRoles = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRolesData }) => userService.updateUserRoles(id, data),
    onSuccess: (_, variables) => {
      invalidateUsers()
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(variables.id) })
      addToast({ type: 'success', title: 'Roles updated', message: 'User roles have been changed.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Roles update failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const bulkActivate = useMutation({
    mutationFn: (data: BulkUserOperationData) => userService.bulkActivateUsers(data),
    onSuccess: (result) => {
      invalidateUsers()
      addToast({ type: 'success', title: 'Bulk activation complete', message: `${result.successful} of ${result.total_requested} users activated.` })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Bulk activation failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const bulkDeactivate = useMutation({
    mutationFn: (data: BulkUserOperationData) => userService.bulkDeactivateUsers(data),
    onSuccess: (result) => {
      invalidateUsers()
      addToast({ type: 'success', title: 'Bulk deactivation complete', message: `${result.successful} of ${result.total_requested} users deactivated.` })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Bulk deactivation failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  // NEW — single user activate / deactivate
  // Assumes userService exposes:
  //   activateUser(id):   POST /users/:id/activate
  //   deactivateUser(id): POST /users/:id/deactivate
  // If your service only has the bulk endpoint, swap to:
  //   mutationFn: (id) => userService.bulkActivateUsers({ user_ids: [id] })
  const activateUser = useMutation({
    mutationFn: (id: string) => userService.bulkActivateUsers({ user_ids: [id] }),
    onSuccess: (_, id) => {
      invalidateUsers()
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(id) })
      addToast({ type: 'success', title: 'User activated', message: 'User has been activated.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Activation failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const deactivateUser = useMutation({
    mutationFn: (id: string) => userService.bulkDeactivateUsers({ user_ids: [id] }),
    onSuccess: (_, id) => {
      invalidateUsers()
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(id) })
      addToast({ type: 'success', title: 'User deactivated', message: 'User has been deactivated.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Deactivation failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  return {
    createUser,
    updateBasicInfo,
    updatePassword,
    updateRoles,
    bulkActivate,
    bulkDeactivate,
    activateUser,    // NEW
    deactivateUser,  // NEW
  }
}