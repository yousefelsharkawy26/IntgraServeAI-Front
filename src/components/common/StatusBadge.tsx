import { TICKET_STATUS_CONFIG } from '@/constants/tickets'
import type { TicketStatus } from '@/types/ticket'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = TICKET_STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
