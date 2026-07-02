import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Lock, Shield, Clock, AlertCircle, Settings, CheckCircle2 } from 'lucide-react'
import { useProfile, useActivityLogs } from '../hooks/useProfile'
import { EditProfileModal } from './EditProfileModal'
import { ChangePasswordModal } from './ChangePasswordModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const iconMap: Record<string, React.ReactNode> = {
  'Password changed': <AlertCircle className="h-4 w-4 text-red-500" />,
  'Login from new device': <Shield className="h-4 w-4 text-blue-500" />,
  'Login': <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

export default function ProfileView() {
  const { data: user, isLoading } = useProfile()
  const { data: logsData } = useActivityLogs()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const logs = logsData?.logs || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-2xl space-y-6">
      {/* Profile Card */}
      <Card className="border-[var(--color-border-light)]">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-2xl font-bold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{user.name}</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={() => setEditModalOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full bg-green-50 text-green-700 border-green-200">
                  {user.role}
                </Badge>
                {user.department && (
                  <Badge variant="outline" className="rounded-full">
                    {user.department}
                  </Badge>
                )}
                <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 border-blue-200">
                  Active
                </Badge>
              </div>
            </div>
          </div>
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
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-base)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Password</p>
              <p className="text-xs text-[var(--color-text-muted)]">Last changed 3 days ago</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={() => setPasswordModalOpen(true)}>
              <Lock className="h-3.5 w-3.5" />
              Change
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-[var(--color-border-light)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-border-light)] px-4 py-3 transition-colors hover:bg-[var(--color-bg-base)]">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-base)]">
                  {iconMap[log.action] || <Settings className="h-4 w-4 text-[var(--color-text-muted)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{log.action}</p>
                  {log.details && <p className="text-xs text-[var(--color-text-muted)]">{log.details}</p>}
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                    {log.ipAddress && <span>{log.ipAddress}</span>}
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditProfileModal open={editModalOpen} onClose={() => setEditModalOpen(false)} user={user} />
      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </motion.div>
  )
}
