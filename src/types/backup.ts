export type BackupStatus = 'completed' | 'in_progress' | 'failed'

export interface BackupMetric {
  key: string
  label: string
  current: number
  backup: number
  unit?: string
}

export interface BackupChange {
  type: 'added' | 'removed' | 'modified'
  path: string
  oldValue?: unknown
  newValue?: unknown
}

export interface Backup {
  id: string
  name: string
  description?: string
  status: BackupStatus
  size: number
  metrics: BackupMetric[]
  changes: BackupChange[]
  createdAt: string
  completedAt?: string
}

export interface BackupListResponse {
  backups: Backup[]
  total: number
}
