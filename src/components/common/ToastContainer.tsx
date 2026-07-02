import { AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '@/store/notificationStore'
import { Toast } from './Toast'

export function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts)

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
