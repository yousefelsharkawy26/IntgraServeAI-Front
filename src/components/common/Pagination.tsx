import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  /** Current 1-based page number */
  page: number
  /** Total number of records */
  total: number
  /** Items per page */
  limit: number
  /** Total number of pages (optional — auto-computed from total/limit if omitted) */
  totalPages?: number
  /** Show "items per page" selector */
  showLimitSelect?: boolean
  /** Available page sizes */
  limitOptions?: number[]
  /** Page-change callback */
  onPageChange: (page: number) => void
  /** Limit-change callback */
  onLimitChange?: (limit: number) => void
  /** Right-side extra content (e.g. showing X–Y of Z) */
  info?: React.ReactNode
  /** Override the labels shown next to page numbers */
  className?: string
}

/**
 * Build the visible page-number list with ellipsis.
 * Always show first, last, current and ±1 around current.
 */
function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = []
  const add = (v: number | '…') => pages.push(v)

  add(1)
  if (current > 4) add('…')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) add(i)

  if (current < total - 3) add('…')
  add(total)

  return pages
}

export function Pagination({
  page,
  total,
  limit,
  totalPages,
  showLimitSelect = false,
  limitOptions = [5, 10, 20, 50],
  onPageChange,
  onLimitChange,
  info,
  className = '',
}: PaginationProps) {
  const computedTotalPages = totalPages ?? Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), computedTotalPages)

  const start = total === 0 ? 0 : (safePage - 1) * limit + 1
  const end = Math.min(safePage * limit, total)
  const pages = buildPageList(safePage, computedTotalPages)

  const goPrev = () => onPageChange(Math.max(1, safePage - 1))
  const goNext = () => onPageChange(Math.min(computedTotalPages, safePage + 1))

  return (
    <div
      className={`flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {/* Left/right depending on locale — info & limit */}
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="text-xs text-[var(--color-text-muted)]">
          Showing <span className="font-medium text-[var(--color-text-primary)]">{start}</span>–
          <span className="font-medium text-[var(--color-text-primary)]">{end}</span> of{' '}
          <span className="font-medium text-[var(--color-text-primary)]">{total}</span>
        </span>

        {showLimitSelect && onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--color-text-muted)]">Rows</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 rounded-md border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] px-2 text-xs text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent-blue)]"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {info && <div className="text-xs text-[var(--color-text-muted)]">{info}</div>}
      </div>

      {/* Page controls */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          disabled={safePage === 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          disabled={safePage === 1}
          onClick={goPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        </Button>

        {pages.map((p, idx) =>
          p === '…' ? (
            <span
              key={`gap-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-[var(--color-text-muted)]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={[
                'h-8 min-w-[2rem] rounded-md px-2 text-xs font-medium transition-colors',
                p === safePage
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-surface)] shadow-sm'
                  : 'border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)]',
              ].join(' ')}
              aria-current={p === safePage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          disabled={safePage === computedTotalPages}
          onClick={goNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          disabled={safePage === computedTotalPages}
          onClick={() => onPageChange(computedTotalPages)}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}
