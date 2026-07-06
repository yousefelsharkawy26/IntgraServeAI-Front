import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.user('me'),
    queryFn: () => userService.getMe(),
  })
}

export function useProfileMutations() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const addToast = useNotificationStore((state) => state.addToast)

  const updateProfile = useMutation({
    mutationFn: userService.updateMe,
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user('me') })
      addToast({ type: 'success', title: 'Profile updated', message: 'Your profile has been saved.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Update failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  const changePassword = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      addToast({ type: 'success', title: 'Password changed', message: 'Your password has been updated.' })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Password change failed', message: err?.response?.data?.message || 'Please try again.' })
    },
  })

  return { updateProfile, changePassword }
}

export function useActivityLogs(page = 1, limit = 10) {
  return useQuery({
    queryKey: [...QUERY_KEYS.myLogs, page, limit],
    queryFn: () => userService.getMyLogs(page, limit),
  })
}
