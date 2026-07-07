import { CheckCircle2, XCircle, Pencil, FileText, Power, PowerOff } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { ROLE_BADGE_CLASS, getUserInitials } from '../lib/constants'
import type { User } from '@/types/auth'

interface Props {
  users: User[]
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onEdit: (user: User) => void
  onViewLogs: (user: User) => void
  onRowClick: (user: User) => void
  onToggleStatus: (user: User) => void
  isTogglingStatus: boolean
}

export function UsersTable({
  users,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onViewLogs,
  onRowClick,
  onToggleStatus,
  isTogglingStatus,
}: Props) {
  const allSelected = selectedIds.length === users.length && users.length > 0

  return (
    <Card className="border-[var(--color-border-light)] overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-light)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider w-10">
                  <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} />
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
                <UserRow
                  key={user.id}
                  user={user}
                  selected={selectedIds.includes(user.id)}
                  onToggleSelect={onToggleSelect}
                  onEdit={onEdit}
                  onViewLogs={onViewLogs}
                  onRowClick={onRowClick}
                  onToggleStatus={onToggleStatus}
                  isTogglingStatus={isTogglingStatus}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

interface RowProps {
  user: User
  selected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (user: User) => void
  onViewLogs: (user: User) => void
  onRowClick: (user: User) => void
  onToggleStatus: (user: User) => void
  isTogglingStatus: boolean
}

function UserRow({ user, selected, onToggleSelect, onEdit, onViewLogs, onRowClick, onToggleStatus, isTogglingStatus }: RowProps) {
  const isActive = user.status === 'active'

  return (
    <tr
      className="group transition-colors hover:bg-[var(--color-bg-base)] cursor-pointer"
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('button, [role="checkbox"], input')) return
        onRowClick(user)
      }}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(user.id)} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white">
            {getUserInitials(user)}
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{user.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className={`text-xs ${ROLE_BADGE_CLASS[user.role] || ''}`}>
          {user.role}
        </Badge>
      </td>
      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{user.department}</td>
      <td className="px-4 py-3">
        {isActive ? (
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
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(user)} title="Edit user">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onViewLogs(user)} title="View activity logs">
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
            onClick={() => onToggleStatus(user)}
            disabled={isTogglingStatus}
            title={isActive ? 'Deactivate user' : 'Activate user'}
          >
            {isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </td>
    </tr>
  )
}