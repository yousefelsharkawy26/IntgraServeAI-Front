export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'ticket' | 'system' | 'user' | 'backup'

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

export interface ToastNotification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

export interface NotificationFilters {
  read?: boolean
  category?: NotificationCategory | 'all'
}
