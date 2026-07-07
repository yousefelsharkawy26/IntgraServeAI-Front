import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

import { useUserLogs } from '../hooks'
import type { User } from '@/types/auth'

const PAGE_SIZE = 10

interface Props {
  user: User | null
  open: boolean
  onClose: () => void
}

export function UserActivityLogs({ user, open, onClose }: Props) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useUserLogs(open && user ? user.id : '', page, PAGE_SIZE)

  // response shape from userService.getUserLogs: { logs, total }
  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0

  return (
    <AnimatePresence>
      {open && user && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="fixed left-1/2 top-[5%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Activity Logs</h2>
                <p className="text-xs text-[var(--color-text-muted)]">{user.name}</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-[var(--color-text-muted)]">
                  <FileText className="h-8 w-8" />
                  No activity recorded yet.
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {logs.map((log) => (
                      <li
                        key={log.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border-light)] p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{log.action}</p>
                          {'description' in log && log.description && (
                            <p className="text-xs text-[var(--color-text-muted)]">{log.description}</p>
                          )}
                        </div>
                        <time className="shrink-0 text-xs text-[var(--color-text-muted)]">
                          {new Date(log.createdAt).toLocaleString()}
                        </time>
                      </li>
                    ))}
                  </ul>

                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-end gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-[var(--color-text-muted)] px-2">
                        {page} / {totalPages}
                      </span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}