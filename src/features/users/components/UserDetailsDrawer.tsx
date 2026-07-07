import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Building2, Calendar, Shield, Power, PowerOff, FileText, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import { useUserDetail, useUserMutations } from '../hooks'
import { ROLE_BADGE_CLASS, getUserInitials } from '../lib/constants'
import type { User } from '@/types/auth'

interface Props {
  user: User | null
  open: boolean
  onClose: () => void
  onEdit: (user: User) => void
  onViewLogs: (user: User) => void
}

export function UserDetailsDrawer({ user, open, onClose, onEdit, onViewLogs }: Props) {
  const { data: fresh, isLoading } = useUserDetail(open && user ? user.id : '')
  const { activateUser, deactivateUser } = useUserMutations()

  const display = fresh ?? user
  const isActive = display?.status === 'active'
  const toggling = activateUser.isPending || deactivateUser.isPending

  const handleToggle = () => {
    if (!display) return
    if (isActive) deactivateUser.mutate(display.id)
    else activateUser.mutate(display.id)
  }

  return (
    <AnimatePresence>
      {open && display && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold">User Details</h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoading && !fresh ? (
              <div className="space-y-4 p-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-60" />
              </div>
            ) : (
              <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xl font-semibold text-white">
                    {getUserInitials(display)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{display.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                      <Mail className="h-3.5 w-3.5" />
                      {display.email}
                    </div>
                  </div>
                </div>

                <div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      ● Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      ● Inactive
                    </span>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border border-[var(--color-border-light)] p-4">
                  <DetailRow icon={<Shield className="h-4 w-4" />} label="Role">
                    <Badge variant="outline" className={`text-xs ${ROLE_BADGE_CLASS[display.role] || ''}`}>
                      {display.role}
                    </Badge>
                  </DetailRow>
                  <DetailRow icon={<Building2 className="h-4 w-4" />} label="Department">
                    {display.department}
                  </DetailRow>
                  <DetailRow icon={<Calendar className="h-4 w-4" />} label="Joined">
                    {new Date(display.createdAt).toLocaleDateString()}
                  </DetailRow>
                </div>

                <div className="space-y-2 border-t border-[var(--color-border-light)] pt-4">
                  <Button
                    className="w-full justify-center gap-2"
                    variant={isActive ? 'outline' : 'default'}
                    onClick={handleToggle}
                    disabled={toggling}
                  >
                    {isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    {isActive ? 'Deactivate User' : 'Activate User'}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => onEdit(display)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => onViewLogs(display)}>
                      <FileText className="h-4 w-4" /> Logs
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
        {icon} {label}
      </span>
      <span className="text-[var(--color-text-primary)]">{children}</span>
    </div>
  )
}