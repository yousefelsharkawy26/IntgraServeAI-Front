import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'

import { backupService } from '@/services/backup.service'
import { useNotificationStore } from '@/store/notificationStore'
import { QUERY_KEYS } from '@/constants/queryKeys'

// ---------- list ----------
export type UseBackupsParams = {
  page?: number
  limit?: number
  search?: string
}

export function useBackups(params: UseBackupsParams = {}) {
  return useQuery({
    // include params in the key so each page/limit/search combo caches independently
    queryKey: [...QUERY_KEYS.backups, params],
    queryFn: () => backupService.getBackups(params),

    // keep showing the previous page's data while the next one loads
    // (no empty flash when user clicks "next page")
    placeholderData: keepPreviousData,

    // short stale time so a navigate-back doesn't refetch instantly
    staleTime: 30_000,
  })
}

// ---------- compare / detail ----------
export function useBackupDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.backupCompare(id),
    queryFn: () => backupService.compareBackup(id),
    enabled: !!id,
    // compare data is fairly static per-snapshot — cache it
    staleTime: 5 * 60_000,
  })
}

// ---------- mutations ----------
export function useBackupMutations() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)

  const restoreBackup = useMutation({
    mutationFn: backupService.restoreBackup,

    onSuccess: (_, variables) => {
      addToast({
        type: 'success',
        title: 'Backup restored',
        message: `System snapshot '${variables}' has been restored successfully.`,
      })
      // refetch the list and any other data that depends on snapshot state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backups })

      // refetch *all* pages of the list, not just the active one
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.backups,
        exact: false,
        refetchType: 'active',
      })

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
    },

    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Restore failed',
        message: err?.response?.data?.message || 'Failed to restore snapshot.',
      })
    },
  })

  return { restoreBackup }
}