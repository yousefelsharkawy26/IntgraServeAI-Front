import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import type { ToastNotification } from '@/types/notification'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

// Theme-aware color classes (light + dark variants) so toasts stay
// readable in both themes. Previously only light classes existed.
const colorMap = {
  success:
    'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100',
  error:
    'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-100',
  warning:
    'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100',
  info:
    'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-100',
}

const iconColorMap = {
  success: 'text-emerald-500 dark:text-emerald-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-blue-500 dark:text-blue-400',
}

interface ToastProps {
  toast: ToastNotification
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useNotificationStore()
  const Icon = iconMap[toast.type]

  // role="status" so screen readers announce toasts. aria-live is implicit
  // on role=status (polite). For errors we use role="alert" (assertive).
  const role = toast.type === 'error' ? 'alert' : 'status'

  return (
    <motion.div
      layout
      role={role}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${colorMap[toast.type]}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorMap[toast.type]}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs opacity-80">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  )
}