import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useTickets } from '../hooks/useTickets'
import { CreateTicketModal } from './CreateTicketModal'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { RevealCard } from '@/components/common/RevealCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { TICKET_STATUSES, TICKET_PRIORITIES, KANBAN_COLUMNS, TICKET_STATUS_CONFIG } from '@/constants/tickets'
import type { TicketStatus, TicketPriority } from '@/types/ticket'

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.03 * i, duration: 0.3, ease: [0.25, 1, 0.5, 1] as const },
  }),
}

export default function TicketQueue() {
  const navigate = useNavigate()
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [status, setStatus] = useState<TicketStatus | 'all'>('all')
  const [priority, setPriority] = useState<TicketPriority | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useTickets({
    status,
    priority,
    search: search || undefined,
    page,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  return (
    <motion.div className="space-y-4">
      {/* Header */}
      <RevealCard delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] p-0.5">
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'table' ? 'bg-[var(--color-text-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'kanban' ? 'bg-[var(--color-text-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Kanban
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="h-9 w-full rounded-full border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] pl-9 text-sm sm:w-64"
              />
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-9 gap-1.5 rounded-full bg-[var(--color-accent-orange)] text-xs font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-orange)] hover:shadow-md hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">Filters:</span>
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as TicketStatus | 'all'); setPage(1) }}>
            <SelectTrigger className="h-8 w-[130px] rounded-full border-[var(--color-border-medium)] text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TICKET_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => { setPriority(v as TicketPriority | 'all'); setPage(1) }}>
            <SelectTrigger className="h-8 w-[130px] rounded-full border-[var(--color-border-medium)] text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {TICKET_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </RevealCard>

      {/* Content */}
      {view === 'table' ? (
        <RevealCard delay={0.1}>
          <Card className="border-[var(--color-border-light)] transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-border-light)]" />
                      <div className="h-4 flex-1 animate-pulse rounded bg-[var(--color-border-light)]" />
                      <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-border-light)]" />
                      <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-border-light)]" />
                    </div>
                  ))}
                </div>
              ) : data?.tickets.length === 0 ? (
                <EmptyState
                  title="No tickets found"
                  description="Create your first ticket to get started."
                  action={<Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-full">Create Ticket</Button>}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border-light)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">ID</th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Title</th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Customer</th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Priority</th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {data?.tickets.map((ticket, i) => (
                          <motion.tr
                            key={ticket.id}
                            custom={i}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="group cursor-pointer border-b border-[var(--color-border-light)] transition-all duration-200 hover:bg-[var(--color-bg-base)] hover:scale-[1.001]"
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                          >
                            <td className="px-4 py-3.5 font-mono text-xs text-[var(--color-text-muted)]">#{ticket.id}</td>
                            <td className="px-4 py-3.5 max-w-[250px] truncate font-medium text-[var(--color-text-primary)]">{ticket.subject}</td>
                            <td className="px-4 py-3.5 text-[var(--color-text-secondary)]">{ticket.customerName}</td>
                            <td className="px-4 py-3.5"><PriorityBadge priority={ticket.priority as TicketPriority} /></td>
                            <td className="px-4 py-3.5"><StatusBadge status={ticket.status as TicketStatus} /></td>
                            <td className="px-4 py-3.5 text-right text-xs text-[var(--color-text-muted)]">
                              {new Date(ticket.updatedAt).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {data && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                Page {page} of {data.totalPages} ({data.total} total)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-[var(--color-text-muted)]"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  const start = Math.max(1, page - 2)
                  const p = start + i
                  if (p > data.totalPages) return null
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'ghost'}
                      size="icon"
                      className={`h-8 w-8 rounded-full text-xs font-medium ${
                        p === page ? 'bg-[var(--color-accent-orange)] text-white hover:bg-[var(--color-accent-orange)]' : 'text-[var(--color-text-muted)]'
                      }`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                })}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-[var(--color-text-muted)]"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </RevealCard>
      ) : (
        <RevealCard delay={0.1}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {KANBAN_COLUMNS.map((status) => {
              const column = TICKET_STATUS_CONFIG[status]
              return (
                <div key={status} className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-3 transition-all duration-300 hover:shadow-md">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{column.label}</h3>
                    <span className="rounded-full bg-[var(--color-bg-base)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                      {data?.tickets.filter((t) => t.status === status).length || 0}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {data?.tickets
                      .filter((t) => t.status === status)
                      .map((ticket, i) => (
                        <motion.div
                          key={ticket.id}
                          custom={i}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          className="cursor-pointer rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{ticket.customerName}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <PriorityBadge priority={ticket.priority as TicketPriority} />
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              {new Date(ticket.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </RevealCard>
      )}

      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </motion.div>
  )
}
