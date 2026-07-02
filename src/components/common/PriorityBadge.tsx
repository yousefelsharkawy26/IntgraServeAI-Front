import { TICKET_PRIORITY_CONFIG } from '@/constants/tickets'
import type { TicketPriority } from '@/types/ticket'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: TicketPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = TICKET_PRIORITY_CONFIG[priority]

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.color, className)}>
      <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  )
}
