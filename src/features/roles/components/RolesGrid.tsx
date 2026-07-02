import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, CheckCircle2, XCircle, X } from 'lucide-react'
import { useRoles } from '../hooks/useRoles'
import { userService } from '@/services/user.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types/auth'

const moduleColors: Record<string, string> = {
  tickets: 'bg-blue-50 text-blue-700 border-blue-200',
  users: 'bg-green-50 text-green-700 border-green-200',
  roles: 'bg-purple-50 text-purple-700 border-purple-200',
  ai: 'bg-orange-50 text-orange-700 border-orange-200',
  backups: 'bg-amber-50 text-amber-700 border-amber-200',
  system: 'bg-red-50 text-red-700 border-red-200',
}

export default function RolesGrid() {
  const { data: roles, isLoading } = useRoles()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">Manage roles and their associated permissions. Edit role assignments per user from the Users screen.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles?.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="h-full border-[var(--color-border-light)] transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-bg-base)]">
                      <Shield className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Users className="h-3 w-3 text-[var(--color-text-muted)]" />
                        <span className="text-xs text-[var(--color-text-muted)]">{role.userCount} users</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">{role.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Permissions</p>
                  {role.permissions.map((perm) => (
                    <div key={perm.id} className="flex items-center justify-between rounded-md bg-[var(--color-bg-base)] px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        <span className="text-xs text-[var(--color-text-primary)] truncate">{perm.name}</span>
                      </div>
                      <Badge variant="outline" className={`h-5 text-[10px] ${moduleColors[perm.module] || ''}`}>
                        {perm.module}
                      </Badge>
                    </div>
                  ))}
                  {/* Show missing permissions */}
                  {['tickets.view', 'tickets.edit', 'users.manage', 'ai.configure', 'backups.view', 'system.settings']
                    .filter((key) => !role.permissions.some((p) => p.key === key))
                    .map((key) => (
                      <div key={key} className="flex items-center gap-2 rounded-md px-3 py-2 opacity-40">
                        <XCircle className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        <span className="text-xs text-[var(--color-text-muted)] line-through">{key.split('.').join(' ')}</span>
                      </div>
                    ))
                  }
                  <button
                    onClick={() => setSelectedRoleId(role.id)}
                    className="mt-2 w-full rounded-md border border-[var(--color-border-light)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)]"
                  >
                    View Members
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <RoleMembersModal roleId={selectedRoleId} onClose={() => setSelectedRoleId(null)} />
    </motion.div>
  )
}

function RoleMembersModal({ roleId, onClose }: { roleId: string | null; onClose: () => void }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['roles', roleId, 'users'],
    queryFn: () => userService.getUsers({ page: 1, limit: 100 }),
    enabled: !!roleId,
  })

  return (
    <AnimatePresence>
      {roleId && (
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
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Role Members</h2>
              <button
                onClick={onClose}
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
              ) : response?.users.length ? (
                response.users.map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border-light)] p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No users found.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
