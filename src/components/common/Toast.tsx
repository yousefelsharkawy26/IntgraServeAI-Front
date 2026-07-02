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

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

interface ToastProps {
  toast: ToastNotification
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useNotificationStore()
  const Icon = iconMap[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${colorMap[toast.type]}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorMap[toast.type]}`} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs opacity-80">{toast.message}</p>}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
