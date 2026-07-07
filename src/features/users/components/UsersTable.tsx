import React from 'react'
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

export const UsersTable = React.memo(function UsersTable({
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
                <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onToggleSelectAll}
                    aria-label="Select all users"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">User</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Role</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Department</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Joined</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Actions</th>
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
})

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

const UserRow = React.memo(function UserRow({
  user,
  selected,
  onToggleSelect,
  onEdit,
  onViewLogs,
  onRowClick,
  onToggleStatus,
  isTogglingStatus,
}: RowProps) {
  const isActive = user.status === 'active'

  // Keyboard support: clicking the row opens the details drawer, so the
  // row must also be reachable via keyboard (Tab) and activated via
  // Enter/Space. We add role="button" + tabIndex={0} + onKeyDown.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    // Enter or Space (Space without scrolling) triggers the row action.
    if (e.key === 'Enter' || (e.key === ' ' && !e.shiftKey)) {
      // Avoid hijacking Space on a checkbox/button inside the row — those
      // have their own handlers and would have stopped propagation already.
      const target = e.target as HTMLElement
      if (target.closest('button, [role="checkbox"], input')) return
      e.preventDefault()
      onRowClick(user)
    }
  }

  return (
    <tr
      role="button"
      tabIndex={0}
      aria-label={`View details for ${user.name}`}
      className="group transition-colors hover:bg-[var(--color-bg-base)] focus-visible:outline-none focus-visible:bg-[var(--color-bg-base)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer"
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('button, [role="checkbox"], input')) return
        onRowClick(user)
      }}
      onKeyDown={handleKeyDown}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(user.id)}
          aria-label={`Select ${user.name}`}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white"
            aria-hidden="true"
          >
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
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
        <time dateTime={user.createdAt}>{new Date(user.createdAt).toLocaleDateString()}</time>
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onEdit(user)}
            aria-label={`Edit ${user.name}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onViewLogs(user)}
            aria-label={`View activity logs for ${user.name}`}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-red-400'
                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:text-emerald-400'
            }`}
            onClick={() => onToggleStatus(user)}
            disabled={isTogglingStatus}
            aria-label={isActive ? `Deactivate ${user.name}` : `Activate ${user.name}`}
          >
            {isActive ? <PowerOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Power className="h-3.5 w-3.5" aria-hidden="true" />}
          </Button>
        </div>
      </td>
    </tr>
  )
})