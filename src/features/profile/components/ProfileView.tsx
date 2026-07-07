import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil,
  Lock,
  Shield,
  Clock,
  AlertCircle,
  Settings,
  CheckCircle2,
  Mail,
  Building2,
  Activity,
  KeyRound,
  Calendar,
  Inbox,
} from 'lucide-react'
import { useProfile, useActivityLogs } from '../hooks/useProfile'
import { EditProfileModal } from './EditProfileModal'
import { ChangePasswordModal } from './ChangePasswordModal'
import { Pagination } from '@/components/common/Pagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PAGE_SIZE } from '@/features/users/lib/constants'

const iconMap: Record<string, { node: React.ReactNode; ring: string; bg: string }> = {
  'Password changed': {
    node: <AlertCircle className="h-4 w-4" />,
    ring: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-500/10',
  },
  'Login from new device': {
    node: <Shield className="h-4 w-4" />,
    ring: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  Login: {
    node: <CheckCircle2 className="h-4 w-4" />,
    ring: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-500/10',
  },
}

// Tiny helper — turn "Backend Engineer" etc. into a 2-color gradient pair
const gradientFromRole = (role: string) => {
  const r = (role || '').toLowerCase()
  if (r.includes('admin')) return 'from-rose-500 to-orange-500'
  if (r.includes('super')) return 'from-fuchsia-500 to-violet-500'
  if (r.includes('manager') || r.includes('lead')) return 'from-amber-400 to-pink-500'
  if (r.includes('eng') || r.includes('dev')) return 'from-sky-500 to-indigo-500'
  if (r.includes('design')) return 'from-pink-500 to-purple-500'
  if (r.includes('sale')) return 'from-emerald-500 to-teal-500'
  return 'from-blue-500 to-purple-500'
}

// Skeleton ───────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl md:col-span-1" />
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
      </div>
    </div>
  )
}

export default function ProfileView() {
  const { data: user, isLoading } = useProfile()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const { data: logsData, isFetching: logsLoading } = useActivityLogs(page, limit)

  const logs = logsData?.logs ?? []
  const total = logsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // If total shrinks below current page (e.g. limit changed), reset to last valid page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const safePage = Math.min(page, totalPages)

  if (isLoading || !user) return <ProfileSkeleton />

  const gradient = gradientFromRole(user.role)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8"
    >
      {/* ───────── Hero header ───────── */}
      <Card className="overflow-hidden border-[var(--color-border-light)]">
        {/* gradient banner */}
        <div
          className={`relative h-28 w-full bg-gradient-to-r ${gradient} sm:h-32`}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay" />
        </div>

        <CardContent className="-mt-12 sm:-mt-14">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-5">
            {/* Avatar */}
            <div
              className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-3xl font-bold text-white ring-4 ring-[var(--color-bg-surface)] shadow-lg sm:h-28 sm:w-28`}
            >
              <span className="drop-shadow-sm">{user.name?.charAt(0).toUpperCase()}</span>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-[var(--color-bg-surface)]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1 sm:pb-2"
                 style={{ zIndex: 2 }}>
              <h1 className="truncate text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl"
                  style={{ width: 'fit-content', borderRadius: '10px', padding: '5px', backgroundColor: 'var(--color-border-light)' }}>
                {user.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                {user.department && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {user.department}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-[var(--color-text-primary)] px-3 py-0.5 text-xs text-[var(--color-bg-surface)] hover:bg-[var(--color-text-primary)]/90">
                  <Shield className="mr-1 h-3 w-3" /> {user.role}
                </Badge>
                {user.department && (
                  <Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs">
                    {user.department}
                  </Badge>
                )}
                <Badge className="rounded-full bg-green-50 px-3 py-0.5 text-xs text-green-700 hover:bg-green-50 dark:bg-green-500/15 dark:text-green-400">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-green-500" />
                  Active
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full gap-2 sm:w-auto sm:pb-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 gap-2 rounded-full text-xs sm:flex-none"
                onClick={() => setEditModalOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───────── Main grid ───────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─────── Left column: account + security ─────── */}
        <div className="space-y-6 lg:col-span-1">
          {/* Account info */}
          <Card className="border-[var(--color-border-light)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-[var(--color-text-muted)]" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
              <InfoRow icon={<Shield className="h-4 w-4" />} label="Role" value={user.role} />
              {user.department && (
                <InfoRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Department"
                  value={user.department}
                />
              )}
              {user.createdAt && (
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Joined"
                  value={new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                />
              )}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-[var(--color-border-light)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Password</p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                    Keep your account safe with a strong password
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 rounded-full text-xs"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Change
                </Button>
              </div>

              {/* 2FA stub — placeholder for future */}
              <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--color-border-medium)] bg-[var(--color-bg-base)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Two-Factor Auth</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Coming soon</p>
                </div>
                <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                  Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─────── Right column: activity log w/ pagination ─────── */}
        <Card className="border-[var(--color-border-light)] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
              Activity Log
            </CardTitle>
            <Badge variant="outline" className="rounded-full text-[11px]">
              {total} {total === 1 ? 'event' : 'events'}
            </Badge>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {logsLoading && page === 1 ? (
                <motion.div
                  key="initial-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </motion.div>
              ) : logs.length === 0 ? (
                <EmptyState />
              ) : (
                <motion.ul
                  key={`page-${page}-${limit}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {logs.map((log) => {
                    const meta = iconMap[log.action] ?? {
                      node: <Settings className="h-4 w-4 text-[var(--color-text-muted)]" />,
                      ring: 'text-[var(--color-text-muted)]',
                      bg: 'bg-[var(--color-bg-base)]',
                    }
                    return (
                      <li
                        key={log.id}
                        className="group flex items-start gap-3 rounded-lg border border-[var(--color-border-light)] px-3 py-3 transition-all hover:border-[var(--color-border-medium)] hover:bg-[var(--color-bg-base)] sm:px-4"
                      >
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.ring}`}
                        >
                          {meta.node}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                            {log.action}
                          </p>
                          {log.details && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                              {log.details}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                            {log.ipAddress && (
                              <span className="font-mono">{log.ipAddress}</span>
                            )}
                            <time dateTime={log.createdAt}>
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </time>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </motion.ul>
              )}
            </AnimatePresence>

            {/* Pagination footer */}
            {logs.length > 0 && (
              <div className="mt-5 border-t border-[var(--color-border-light)] pt-4">
                <Pagination
                  page={safePage}
                  total={total}
                  limit={limit}
                  onPageChange={(p) => {
                    setPage(p)
                    // Scroll back to activity section on small screens
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      document
                        .getElementById('activity-section')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  onLimitChange={(l) => {
                    setLimit(l)
                    setPage(1)
                  }}
                  showLimitSelect
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditProfileModal open={editModalOpen} onClose={() => setEditModalOpen(false)} user={user} />
      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </motion.div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-base)] text-[var(--color-text-muted)]">
          {icon}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      </div>
      <span className="truncate text-sm font-medium text-[var(--color-text-primary)]" title={value}>
        {value}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-medium)] bg-[var(--color-bg-base)] px-6 py-12 text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-surface)] shadow-sm">
        <Inbox className="h-5 w-5 text-[var(--color-text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--color-text-primary)]">No activity yet</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
        Your recent actions will appear here.
      </p>
    </motion.div>
  )
}
