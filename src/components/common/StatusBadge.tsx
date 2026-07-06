import { TICKET_STATUS_CONFIG } from '@/constants/tickets'
import type { TicketStatus } from '@/types/ticket'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

const FALLBACK_CONFIG = {
  label: 'Unknown',
  color: 'text-gray-700',
  bgColor: 'bg-gray-100',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = TICKET_STATUS_CONFIG[status]

  if (!config) {
    // Don't crash the page on an unexpected/missing status value —
    // log it so the mismatch (API vs TICKET_STATUS_CONFIG) gets noticed and fixed.
    console.warn(`StatusBadge: unknown status "${status}" — falling back to default display.`)
  }

  const resolved = config ?? FALLBACK_CONFIG

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium',
        resolved.bgColor,
        resolved.color,
        className
      )}
    >
      {resolved.label}
    </span>
  )
}
