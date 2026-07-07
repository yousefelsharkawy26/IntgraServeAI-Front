import { motion } from 'framer-motion'

import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import type { Role } from '@/types/role'

export const moduleColors: Record<string, string> = {
  tickets: 'bg-blue-50 text-blue-700 border-blue-200',
  users: 'bg-green-50 text-green-700 border-green-200',
  roles: 'bg-purple-50 text-purple-700 border-purple-200',
  ai: 'bg-orange-50 text-orange-700 border-orange-200',
  backups: 'bg-amber-50 text-amber-700 border-amber-200',
  system: 'bg-red-50 text-red-700 border-red-200',
}

// Fallback color when a permission module isn't recognised by `moduleColors`.
// Previously the badge rendered with empty classes, which produced an
// unstyled look inconsistent with the rest of the list.
export const DEFAULT_MODULE_CLASS =
  'bg-gray-50 text-gray-700 border-gray-200'

function getModuleClass(moduleKey: string | undefined): string {
  if (!moduleKey) return DEFAULT_MODULE_CLASS
  return moduleColors[moduleKey] || DEFAULT_MODULE_CLASS
}

// Canonical permission list — shared with RoleFormModal.
// Edit this list to update both the card display and the form checkboxes.
export const ALL_PERMISSION_KEYS = [
  'tickets.view',
  'tickets.edit',
  'tickets.delete',
  'users.manage',
  'roles.manage',
  'ai.configure',
  'backups.view',
  'system.settings',
] as const

type Permission = Role['permissions'][number]

type RoleCardProps = {
  role: Role
  index: number
  onViewMembers: (roleId: string) => void
}

export default function RoleCard({
  role,
  index,
  onViewMembers,
}: RoleCardProps) {
  return (
    <motion.div
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
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {role.userCount} users
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
            {role.description}
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Permissions
            </p>

            {/* Granted permissions */}
            {role.permissions.map((perm: Permission) => (
              <div
                key={perm.id}
                className="flex items-center justify-between rounded-md bg-[var(--color-bg-base)] px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span className="text-xs text-[var(--color-text-primary)] truncate">
                    {perm.name}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`h-5 text-[10px] ${getModuleClass(perm.module)}`}
                >
                  {perm.module}
                </Badge>
              </div>
            ))}

            {/* Missing permissions — also show module badge for visual consistency */}
            {ALL_PERMISSION_KEYS.filter(
              (key) => !role.permissions.some((p) => p.key === key),
            ).map((key) => {
              const moduleKey = key.split('.')[0]
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md px-3 py-2 opacity-40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <XCircle className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                    <span className="text-xs text-[var(--color-text-muted)] line-through truncate">
                      {key}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`h-5 text-[10px] ${getModuleClass(moduleKey)}`}
                  >
                    {moduleKey}
                  </Badge>
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => onViewMembers(role.id)}
              className="mt-2 w-full rounded-md border border-[var(--color-border-light)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)]"
            >
              View Members
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}