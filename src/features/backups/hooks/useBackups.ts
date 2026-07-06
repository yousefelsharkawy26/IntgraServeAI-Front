import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupService } from '@/services/backup.service'
import { useNotificationStore } from '@/store/notificationStore'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function useBackups() {
  return useQuery({
    queryKey: QUERY_KEYS.backups,
    queryFn: () => backupService.getBackups(),
  })
}

export function useBackupDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.backupCompare(id),
    queryFn: () => backupService.compareBackup(id),
    enabled: !!id,
  })
}

export function useBackupMutations() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)

  const restoreBackup = useMutation({
    mutationFn: backupService.restoreBackup,
    onSuccess: (_, variables) => {
      addToast({ type: 'success', title: 'Backup restored', message: `System snapshot '${variables}' has been restored successfully.` })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backups })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.actions })
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Restore failed', message: err?.response?.data?.message || 'Failed to restore snapshot.' })
    },
  })

  return { restoreBackup }
}
