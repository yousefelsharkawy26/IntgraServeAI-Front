import { motion } from 'framer-motion'
import { CountUp } from './CountUp'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: number
  subtitle: string
  suffix?: string
  color?: string
  index?: number
}

export function MetricCard({ label, value, subtitle, suffix = '', color, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col items-start justify-center border-b border-r border-[var(--color-bg-grid)] bg-[var(--color-bg-surface)] px-6 py-5"
    >
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </span>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn('text-4xl font-semibold tracking-tight', color || 'text-[var(--color-text-primary)]')}>
          <CountUp target={value} duration={800} />
        </span>
        {suffix && (
          <span className={cn('text-lg font-medium', color || 'text-[var(--color-text-primary)]')}>
            {suffix}
          </span>
        )}
      </div>
      <span className="mt-1 text-xs text-[var(--color-text-muted)]">{subtitle}</span>
    </motion.div>
  )
}
