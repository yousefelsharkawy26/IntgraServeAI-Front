import { Search, Power, PowerOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

import { STATUS_OPTIONS, type StatusFilter } from '../lib/constants'

interface Props {
  search: string
  status: StatusFilter
  selectedCount: number
  isBulkPending: boolean
  onSearchChange: (v: string) => void
  onStatusChange: (v: StatusFilter) => void
  onBulkActivate: () => void
  onBulkDeactivate: () => void
}

export function UsersToolbar({
  search,
  status,
  selectedCount,
  isBulkPending,
  onSearchChange,
  onStatusChange,
  onBulkActivate,
  onBulkDeactivate,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] pl-9 text-sm"
        />
      </div>

      <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
        <SelectTrigger className="h-9 w-36 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--color-text-muted)]">{selectedCount} selected</span>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onBulkActivate} disabled={isBulkPending}>
            <Power className="h-3.5 w-3.5" />
            Activate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-red-600 hover:bg-red-50"
            onClick={onBulkDeactivate}
            disabled={isBulkPending}
          >
            <PowerOff className="h-3.5 w-3.5" />
            Deactivate
          </Button>
        </div>
      )}
    </div>
  )
}