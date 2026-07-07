import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'

import { useUsers, useUserMutations, useRoles } from '../hooks'
import type { User } from '@/types/auth'
import { PAGE_SIZE, type StatusFilter } from '../lib/constants'

import { UsersToolbar } from './UsersToolbar'
import { UsersTable } from './UsersTable'
// import { UsersPagination } from './UsersPagination'   ← removed
import { UserFormModal } from './UserFormModal'
import { UserDetailsDrawer } from './UserDetailsDrawer'
import { UserActivityLogs } from './UserActivityLogs'

export default function UsersList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)   // ← new, drives both fetch & pager

  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [detailsUser, setDetailsUser] = useState<User | null>(null)
  const [logsUser, setLogsUser] = useState<User | null>(null)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useUsers({
    search: search || undefined,
    status,
    page,
    limit,                  // ← was PAGE_SIZE
  })
  const { data: roles } = useRoles()
  const {
    createUser,
    updateBasicInfo,
    updateRoles,
    bulkActivate,
    bulkDeactivate,
    activateUser,
    deactivateUser,
  } = useUserMutations()

  const users = data?.users || []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // Snap back if filters/search shrink the result below the current page
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const rolesForForm = (roles || []).map((r) => ({ id: r.id, name: r.name }))

  const resetPage = () => setPage(1)

  const handleLimitChange = (l: number) => {
    setLimit(l)
    setPage(1)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }
  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormOpen(true)
  }
  const handleViewLogs = (user: User) => setLogsUser(user)
  const handleRowClick = (user: User) => setDetailsUser(user)

  const handleSubmit = (formData: any) => {
    if (editingUser) {
      updateBasicInfo.mutate(
        { id: editingUser.id, data: { email: formData.email, full_name: formData.full_name } },
        {
          onSuccess: () =>
            updateRoles.mutate(
              { id: editingUser.id, data: { roles_id: formData.roles_id } },
              { onSuccess: () => setFormOpen(false) },
            ),
        },
      )
    } else {
      createUser.mutate({ ...formData, password: formData.password }, { onSuccess: () => setFormOpen(false) })
    }
  }

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const toggleSelectAll = () =>
    setSelectedIds((prev) => (prev.length === users.length ? [] : users.map((u) => u.id)))

  const handleBulkActivate = () =>
    selectedIds.length && bulkActivate.mutate({ user_ids: selectedIds }, { onSuccess: () => setSelectedIds([]) })
  const handleBulkDeactivate = () =>
    selectedIds.length && bulkDeactivate.mutate({ user_ids: selectedIds }, { onSuccess: () => setSelectedIds([]) })

  const handleToggleStatus = (user: User) => {
    if (user.status === 'active') deactivateUser.mutate(user.id)
    else activateUser.mutate(user.id)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">Manage team members and their access</p>
        <Button
          onClick={handleCreate}
          className="h-9 gap-2 rounded-lg bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90"
        >
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <UsersToolbar
        search={search}
        status={status}
        selectedCount={selectedIds.length}
        isBulkPending={bulkActivate.isPending || bulkDeactivate.isPending}
        onSearchChange={(v) => { setSearch(v); resetPage() }}
        onStatusChange={(v) => { setStatus(v); resetPage() }}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : users.length === 0 ? (
        <Card className="border-[var(--color-border-light)]">
          <CardContent>
            <EmptyState
              title="No users found"
              description="Try adjusting your search or filters."
              icon={<Users className="h-8 w-8 text-[var(--color-text-muted)]" />}
            />
          </CardContent>
        </Card>
      ) : (
        <UsersTable
          users={users}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={handleEdit}
          onViewLogs={handleViewLogs}
          onRowClick={handleRowClick}
          onToggleStatus={handleToggleStatus}
          isTogglingStatus={activateUser.isPending || deactivateUser.isPending}
        />
      )}

      {!isLoading && total > 0 && (
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
          showLimitSelect
        />
      )}

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={editingUser ? 'edit' : 'create'}
        user={editingUser}
        roles={rolesForForm}
        onSubmit={handleSubmit}
        isSubmitting={createUser.isPending || updateBasicInfo.isPending || updateRoles.isPending}
      />

      <UserDetailsDrawer
        user={detailsUser}
        open={!!detailsUser}
        onClose={() => setDetailsUser(null)}
        onEdit={handleEdit}
        onViewLogs={handleViewLogs}
      />

      <UserActivityLogs user={logsUser} open={!!logsUser} onClose={() => setLogsUser(null)} />
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
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
  )
}