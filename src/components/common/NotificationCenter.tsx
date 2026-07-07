import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, X, Filter } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { NotificationCategory } from '@/types/notification'

const categoryColors: Record<NotificationCategory, string> = {
  ticket: 'bg-blue-500',
  system: 'bg-purple-500',
  user: 'bg-emerald-500',
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

  const panelRef = useRef<HTMLDivElement>(null)

  // Escape to close + focus trap + focus restoration.
  useModalA11y({
    open: isPanelOpen,
    onClose: () => setPanelOpen(false),
    containerRef: panelRef,
    labelId: 'notifications-title',
  })

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
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby="notifications-title"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-14 z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                <h3 id="notifications-title" className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread`}
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent-orange)] px-1.5 text-[11px] font-semibold text-white"
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  aria-label="Mark all notifications as read"
                >
                  <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                  Read all
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div
              className="flex items-center gap-1 border-b border-[var(--color-border-light)] px-3 py-2"
              role="group"
              aria-label="Filter by category"
            >
              <Filter className="mr-1 h-3 w-3 text-[var(--color-text-muted)]" aria-hidden="true" />
              {(Object.keys(categoryLabels) as Array<NotificationCategory | 'all'>).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  aria-pressed={filterCategory === cat}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    filterCategory === cat
                      ? 'bg-[var(--color-text-primary)] text-white'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]',
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
                  <Bell className="h-8 w-8 text-[var(--color-text-muted)]" aria-hidden="true" />
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-light)]">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg-base)] focus-within:bg-[var(--color-bg-base)]',
                        !notification.read && 'bg-blue-50/40 dark:bg-blue-950/20',
                      )}
                    >
                      <div
                        className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', categoryColors[notification.category])}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !notification.read ? 'font-semibold' : 'font-medium', 'text-[var(--color-text-primary)]')}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                          <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleTimeString()}</time>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            aria-label={`Mark "${notification.title}" as read`}
                            className="rounded p-1 hover:bg-[var(--color-bg-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Check className="h-3 w-3 text-[var(--color-text-muted)]" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNotification(notification.id)}
                          aria-label={`Dismiss "${notification.title}"`}
                          className="rounded p-1 hover:bg-[var(--color-bg-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="h-3 w-3 text-[var(--color-text-muted)]" aria-hidden="true" />
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
