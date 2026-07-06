import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Plus, Pencil, Power, PowerOff, FileText } from 'lucide-react'
import { useUsers, useUserMutations } from '../hooks/useUsers'
import { useRoles } from '@/features/roles/hooks/useRoles'
import { UserFormModal } from './UserFormModal'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useNotificationStore } from '@/store/notificationStore'
import type { User } from '@/types/auth'

const roleColors: Record<string, string> = {
  'Administrator': 'bg-purple-50 text-purple-700 border-purple-200',
  'Manager': 'bg-blue-50 text-blue-700 border-blue-200',
  'Support Agent': 'bg-green-50 text-green-700 border-green-200',
  'Viewer': 'bg-gray-50 text-gray-700 border-gray-200',
}

export default function UsersList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { data, isLoading } = useUsers({
    search: search || undefined,
    status,
    page,
    limit: 10
  })
  const { data: roles } = useRoles()
  const { createUser, updateBasicInfo, updateRoles, bulkActivate, bulkDeactivate } = useUserMutations()
  const addToast = useNotificationStore((state) => state.addToast)

  const users = data?.users || []

  const handleCreate = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setModalOpen(true)
  }

  const handleViewLogs = (user: User) => {
    window.location.hash = `#user-logs-${user.id}`
    addToast({ type: 'info', title: 'User logs', message: `Activity log retrieval is available via the profile page or audit screen for ${user.name}.` })
  }

  const handleSubmit = (formData: any) => {
    const payload = {
      ...formData,
      ...(editingUser ? {} : { password: formData.password }),
    }
    if (editingUser) {
      updateBasicInfo.mutate(
        { id: editingUser.id, data: { email: formData.email, full_name: formData.full_name } },
        {
          onSuccess: () => {
            updateRoles.mutate(
              { id: editingUser.id, data: { roles_id: formData.roles_id } },
              { onSuccess: () => setModalOpen(false) }
            )
          },
        }
      )
    } else {
      createUser.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(users.map((u) => u.id))
    }
  }

  const handleBulkActivate = () => {
    if (selectedIds.length === 0) return
    bulkActivate.mutate({ user_ids: selectedIds })
    setSelectedIds([])
  }

  const handleBulkDeactivate = () => {
    if (selectedIds.length === 0) return
    bulkDeactivate.mutate({ user_ids: selectedIds })
    setSelectedIds([])
  }

  const rolesForForm = (roles || []).map((r) => ({ id: r.id, name: r.name }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">Manage team members and their access</p>
        <Button onClick={handleCreate} className="h-9 gap-2 rounded-lg bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] pl-9 text-sm" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[var(--color-text-muted)]">{selectedIds.length} selected</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleBulkActivate}
              disabled={bulkActivate.isPending}
            >
              <Power className="h-3.5 w-3.5" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-red-600 hover:bg-red-50"
              onClick={handleBulkDeactivate}
              disabled={bulkDeactivate.isPending}
            >
              <PowerOff className="h-3.5 w-3.5" />
              Deactivate
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      {isLoading ? (
        <Card className="border-[var(--color-border-light)]">
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border-light)]">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card className="border-[var(--color-border-light)]">
          <CardContent>
            <EmptyState title="No users found" description="Try adjusting your search or filters." icon={<Users className="h-8 w-8 text-[var(--color-text-muted)]" />} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[var(--color-border-light)] overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-light)]">
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider w-10">
                      <Checkbox
                        checked={selectedIds.length === users.length && users.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]">
                  {users.map((user) => (
                    <tr key={user.id} className="group transition-colors hover:bg-[var(--color-bg-base)]">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.includes(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">{user.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${roleColors[user.role] || ''}`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{user.department}</td>
                      <td className="px-4 py-3">
                        {user.status === 'active' ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <XCircle className="h-3.5 w-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEdit(user)}
                            title="Edit user"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleViewLogs(user)}
                            title="View activity logs"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages >= 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 text-xs ${p === page ? 'bg-[var(--color-text-primary)] text-white' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={editingUser ? 'edit' : 'create'}
        user={editingUser}
        roles={rolesForForm}
        onSubmit={handleSubmit}
        isSubmitting={createUser.isPending || updateBasicInfo.isPending || updateRoles.isPending}
      />
    </motion.div>
  )
}
