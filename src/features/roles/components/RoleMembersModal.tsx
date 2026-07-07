import { useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { X } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

import { useRoleMembers } from '../hooks/useRoles'

type RoleMembersModalProps = {
  roleId: string | null
  onClose: () => void
}

export default function RoleMembersModal({
  roleId,
  onClose,
}: RoleMembersModalProps) {
  return (
    <AnimatePresence>
      {roleId && (
        <RoleMembersModalContent roleId={roleId} onClose={onClose} />
      )}
    </AnimatePresence>
  )
}

function RoleMembersModalContent({
  roleId,
  onClose,
}: {
  roleId: string
  onClose: () => void
}) {
  const query = useRoleMembers(roleId)
  const isLoading = query.isLoading
  const isError = query.isError
  const users: any[] = unwrapUsers(query.data)

  // Close on ESC — matches the behavior of RoleFormModal and the
  // ConfirmDeleteModal in RolesGrid for consistency.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-members-title"
        className="fixed left-1/2 top-[10%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
          <h2
            id="role-members-title"
            className="text-lg font-semibold text-[var(--color-text-primary)]"
          >
            Role Members
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600 text-center py-4">
              Failed to load members. Please try again.
            </p>
          ) : users.length > 0 ? (
            users.map((user: any, index: number) => (
              <div
                // Stable, deterministic key — never use Math.random() as a key.
                key={user.id ?? `member-${index}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-light)] p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white">
                  {getUserInitial(user)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {getUserEmail(user)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              No users in this role.
            </p>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ---------- Defensive user helpers (local to this file) ----------
function getUserDisplayName(user: any): string {
  if (!user) return 'Unknown user'
  return (
    user.name ??
    user.full_name ??
    user.fullName ??
    user.displayName ??
    ([user.first_name ?? user.firstName, user.last_name ?? user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
      user.username ||
      user.email ||
      'Unknown user')
  )
}

function getUserEmail(user: any): string {
  return user?.email ?? user?.mail ?? ''
}

function getUserInitial(user: any): string {
  const n = getUserDisplayName(user)
  return n?.charAt(0)?.toUpperCase() || '?'
}

// Handles any backend response shape: array, { users }, { data: { users } },
// { response: { users } }.
function unwrapUsers(payload: any): any[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  const inner = payload.response ?? payload.data ?? payload
  if (Array.isArray(inner)) return inner
  return (inner?.users as any[]) ?? []
}