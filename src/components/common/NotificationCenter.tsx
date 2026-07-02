import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, X, Filter } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NotificationCategory } from '@/types/notification'

const categoryColors: Record<NotificationCategory, string> = {
  ticket: 'bg-blue-500',
  system: 'bg-purple-500',
  user: 'bg-green-500',
  backup: 'bg-amber-500',
}

const categoryLabels: Record<NotificationCategory | 'all', string> = {
  all: 'All',
  ticket: 'Tickets',
  system: 'System',
  user: 'Users',
  backup: 'Backups',
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isPanelOpen,
    setPanelOpen,
    markAsRead,
    markAllAsRead,
    removeNotification,
    filterCategory,
    setFilterCategory,
  } = useNotificationStore()

  const filteredNotifications =
    filterCategory === 'all' ? notifications : notifications.filter((n) => n.category === filterCategory)

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-14 z-50 w-96 overflow-hidden rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--color-text-muted)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent-orange)] px-1.5 text-[11px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllAsRead}>
                  <Check className="mr-1 h-3 w-3" />
                  Read all
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 border-b border-[var(--color-border-light)] px-3 py-2">
              <Filter className="mr-1 h-3 w-3 text-[var(--color-text-muted)]" />
              {(Object.keys(categoryLabels) as Array<NotificationCategory | 'all'>).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    filterCategory === cat
                      ? 'bg-[var(--color-text-primary)] text-white'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]'
                  )}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>

            {/* List */}
            <ScrollArea className="h-80">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-8 w-8 text-[var(--color-text-muted)]" />
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-light)]">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg-base)]',
                        !notification.read && 'bg-blue-50/50'
                      )}
                    >
                      <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', categoryColors[notification.category])} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !notification.read ? 'font-semibold' : 'font-medium', 'text-[var(--color-text-primary)]')}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="rounded p-1 hover:bg-[var(--color-bg-base)]"
                          >
                            <Check className="h-3 w-3 text-[var(--color-text-muted)]" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="rounded p-1 hover:bg-[var(--color-bg-base)]"
                        >
                          <X className="h-3 w-3 text-[var(--color-text-muted)]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
