import { create } from 'zustand'
import type { Notification, ToastNotification, NotificationCategory } from '@/types/notification'

interface NotificationState {
  notifications: Notification[]
  toasts: ToastNotification[]
  unreadCount: number
  isPanelOpen: boolean

  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void

  addToast: (toast: Omit<ToastNotification, 'id'>) => void
  removeToast: (id: string) => void

  filterCategory: NotificationCategory | 'all'
  setFilterCategory: (category: NotificationCategory | 'all') => void
}

let toastIdCounter = 0

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,
  isPanelOpen: false,
  filterCategory: 'all',

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (!notification || notification.read) return state
      return {
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),

  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}`
    const duration = toast.duration ?? 4000
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      get().removeToast(id)
    }, duration)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setFilterCategory: (category) => set({ filterCategory: category }),
}))
