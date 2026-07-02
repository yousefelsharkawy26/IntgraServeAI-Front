import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'No items found',
  description = 'There are no items to display at the moment.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-base)]">
        {icon || <Inbox className="h-8 w-8 text-[var(--color-text-muted)]" />}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-[var(--color-text-muted)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
