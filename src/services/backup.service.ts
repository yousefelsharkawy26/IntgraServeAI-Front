import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import type { Backup, BackupListResponse } from '@/types/backup'

export const backupService = {
  async getBackups(): Promise<BackupListResponse> {
    const { data } = await api.get<any>(API_ENDPOINTS.backups.list)
    const backups = (data.backups || []).map((b: any) => ({
      id: b.filename,
      name: b.filename,
      description: `Action configuration snapshot`,
      status: 'completed' as const,
      size: b.size_bytes || 0,
      metrics: [],
      changes: [],
      createdAt: b.created_at,
      completedAt: b.created_at,
    }))
    return {
      backups,
      total: data.total || backups.length,
    }
  },

  async getBackup(id: string): Promise<any> {
    const { data } = await api.get<any>(API_ENDPOINTS.backups.detail(id))
    return data
  },

  async restoreBackup(id: string): Promise<{ message: string }> {
    const { data } = await api.post<any>(API_ENDPOINTS.backups.restore(id))
    return data
  },

  async compareBackup(id: string): Promise<Backup> {
    const { data } = await api.get<any>(API_ENDPOINTS.backups.compare(id))
    return {
      id: data.filename,
      name: data.filename,
      description: `Action configuration snapshot`,
      status: 'completed',
      size: 0,
      createdAt: new Date().toISOString(),
      metrics: [
        { key: 'backupActions', label: 'Actions in Backup', current: data.current_actions_count, backup: data.backup_actions_count },
        { key: 'totalActions', label: 'Current Actions', current: data.current_actions_count, backup: data.backup_actions_count }
      ],
      changes: [
        ...(data.added || []).map((name: string) => ({ type: 'added' as const, path: name, newValue: 'New action added' })),
        ...(data.removed || []).map((name: string) => ({ type: 'removed' as const, path: name, oldValue: 'Action removed' })),
        ...(data.modified || []).map((name: string) => ({ type: 'modified' as const, path: name, newValue: 'Action configuration modified' }))
      ]
    }
  },
}

