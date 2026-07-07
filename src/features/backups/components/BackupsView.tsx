import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, Clock, HardDrive, RefreshCw, ArrowRightLeft,
  ChevronRight, CheckCircle2,
} from 'lucide-react'

import { useBackups, useBackupDetail, useBackupMutations } from '../hooks/useBackups'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { Pagination } from '@/components/common/Pagination'

import type { Backup } from '@/types/backup'

const PAGE_SIZE = 10

// ---------- types ----------
type BackupChange = {
  type: 'added' | 'removed' | 'modified'
  path: string
  oldValue?: unknown
  newValue?: unknown
}
type BackupMetric = {
  key: string
  label: string
  current: number
  backup: number
  unit?: string
}
type BackupCompare = {
  metrics: BackupMetric[]
  changes: BackupChange[]
}

// ---------- helpers ----------
const formatSize = (bytes: number) => {
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(1)} KB`
}

const formatTime = (iso: string) => (iso ? new Date(iso).toLocaleString() : '')

const timeAgo = (iso: string) => {
  if (!iso) return ''
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ---------- main ----------
export default function BackupsView() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const { data, isLoading } = useBackups({ page, limit })
  const { restoreBackup } = useBackupMutations()

  const backups = data?.backups ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const { data: compareData, isLoading: isComparing } =
    useBackupDetail(selectedBackup?.id ?? '')

  // snap back if filters / count changes shrink the total pages
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const handleLimitChange = (l: number) => {
    setLimit(l)
    setPage(1)
  }

  const handleRestore = async (id: string) => {
    setRestoringId(id)
    try {
      await restoreBackup.mutateAsync(id)
    } catch {
      // toast handled by mutation
    } finally {
      setRestoringId(null)
    }
  }

  const handleOpenDiff = (backup: Backup) => {
    setSelectedBackup(backup)
    setDiffModalOpen(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        Manage system snapshots and restore points
      </p>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Snapshot List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Database className="h-4 w-4" />
            Available Snapshots
          </h3>

          {isLoading ? (
            <BackupListSkeleton />
          ) : backups.length === 0 ? (
            <EmptyState title="No backups" description="No snapshots available." />
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <BackupListItem
                  key={backup.id}
                  backup={backup}
                  selected={selectedBackup?.id === backup.id}
                  restoring={restoringId === backup.id}
                  onSelect={setSelectedBackup}
                  onRestore={handleRestore}
                  onViewChanges={handleOpenDiff}
                />
              ))}
            </div>
          )}

          {!isLoading && total > 0 && (
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
              showLimitSelect
            />
          )}
        </div>

        {/* Comparison Viewer */}
        <div className="lg:col-span-3">
          {selectedBackup ? (
            <ComparisonPanel
              backup={selectedBackup}
              compareData={compareData}
              isLoading={isComparing}
            />
          ) : (
            <Card className="border-[var(--color-border-light)]">
              <CardContent className="py-16">
                <EmptyState
                  title="Select a snapshot"
                  description="Click on a backup from the list to view comparison details."
                  icon={<Database className="h-8 w-8 text-[var(--color-text-muted)]" />}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <DiffModal
        open={diffModalOpen && !!selectedBackup}
        backup={selectedBackup}
        compareData={compareData}
        isLoading={isComparing}
        onClose={() => setDiffModalOpen(false)}
      />
    </motion.div>
  )
}

// ---------- sub-components ----------

function BackupListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-[var(--color-border-light)]">
          <CardContent className="p-4">
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function BackupListItem({
  backup, selected, restoring,
  onSelect, onRestore, onViewChanges,
}: {
  backup: Backup
  selected: boolean
  restoring: boolean
  onSelect: (b: Backup) => void
  onRestore: (id: string) => void
  onViewChanges: (b: Backup) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`cursor-pointer rounded-xl border transition-all ${
        selected
          ? 'border-[var(--color-accent-blue)] bg-blue-50/50 shadow-sm'
          : 'border-[var(--color-border-light)] bg-[var(--color-bg-surface)] hover:shadow-sm'
      }`}
      onClick={() => onSelect(backup)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {backup.name}
              </h4>
              <Badge
                variant="outline"
                className="h-5 text-[10px] bg-green-50 text-green-700 border-green-200 flex-shrink-0"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {backup.description}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(backup.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatSize(backup.size)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs rounded-full"
            disabled={restoring}
            onClick={(e) => { e.stopPropagation(); onRestore(backup.id) }}
          >
            {restoring ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Restore
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs rounded-full"
            onClick={(e) => { e.stopPropagation(); onViewChanges(backup) }}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            View Changes
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function ComparisonPanel({
  backup, compareData, isLoading,
}: {
  backup: Backup
  compareData: BackupCompare | undefined
  isLoading: boolean
}) {
  return (
    <Card className="border-[var(--color-border-light)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="h-4 w-4 text-[var(--color-text-muted)]" />
          Comparison: Current vs {backup.name}
        </CardTitle>
        <p className="text-xs text-[var(--color-text-muted)]">
          Created {formatTime(backup.createdAt)}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics">
          <TabsList className="rounded-lg border border-[var(--color-border-light)] p-0.5">
            <TabsTrigger
              value="metrics"
              className="text-xs data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-white"
            >
              Metrics
            </TabsTrigger>
            <TabsTrigger
              value="changes"
              className="text-xs data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-white"
            >
              Changes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-4">
            {isLoading ? (
              <CenterSpinner />
            ) : compareData ? (
              <div className="grid grid-cols-2 gap-3">
                {compareData.metrics.map((metric) => {
                  const unit = metric.unit ?? ''
                  const diff = metric.current - metric.backup
                  return (
                    <div
                      key={metric.key}
                      className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] p-3"
                    >
                      <p className="text-xs text-[var(--color-text-muted)]">{metric.label}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-[var(--color-text-primary)]">
                          {metric.current}{unit}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                          <span className="text-[var(--color-text-muted)]">{metric.backup}{unit}</span>
                          {diff > 0 ? (
                            <span className="text-green-600">+{diff}</span>
                          ) : diff < 0 ? (
                            <span className="text-red-500">{diff}</span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">No comparison data available.</p>
            )}
          </TabsContent>

          <TabsContent value="changes" className="mt-4">
            {isLoading ? (
              <CenterSpinner />
            ) : compareData && compareData.changes.length > 0 ? (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {compareData.changes.map((change, i) => (
                  <ChangeRow key={i} change={change} compact />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">
                No action configuration changes detected.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function DiffModal({
  open, backup, compareData, isLoading, onClose,
}: {
  open: boolean
  backup: Backup | null
  compareData: BackupCompare | undefined
  isLoading: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && backup && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-[5%] z-50 w-full max-w-3xl -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Changes in {backup.name}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
              >
                <span className="text-lg">&times;</span>
              </button>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="py-24 flex items-center justify-center">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : compareData ? (
                <DiffSummary compareData={compareData} />
              ) : (
                <p className="text-center py-12 text-[var(--color-text-muted)]">
                  No comparison data available.
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function DiffSummary({ compareData }: { compareData: BackupCompare }) {
  const added = compareData.changes.filter((c) => c.type === 'added').length
  const modified = compareData.changes.filter((c) => c.type === 'modified').length
  const removed = compareData.changes.filter((c) => c.type === 'removed').length

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <StatCard color="green" label="Added" value={added} />
        <StatCard color="amber" label="Modified" value={modified} />
        <StatCard color="red" label="Removed" value={removed} />
      </div>

      <div className="mt-6 space-y-2">
        {compareData.changes.map((change, i) => (
          <ChangeRow key={i} change={change} />
        ))}
      </div>
    </>
  )
}

// ---------- atoms ----------

function ChangeRow({ change, compact }: { change: BackupChange; compact?: boolean }) {
  const styles =
    change.type === 'added'
      ? 'border-green-200 bg-green-50/50'
      : change.type === 'removed'
      ? 'border-red-200 bg-red-50/50'
      : 'border-amber-200 bg-amber-50/50'
  const badgeStyles =
    change.type === 'added'
      ? 'bg-green-100 text-green-700'
      : change.type === 'removed'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'
  const marker = change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'

  return (
    <div className={`rounded-lg border p-3 ${styles}`}>
      <div className="flex items-center gap-2">
        {compact ? (
          <Badge className={`h-5 text-[10px] hover:${badgeStyles.split(' ')[0]} ${badgeStyles}`}>{marker}</Badge>
        ) : (
          <Badge className={badgeStyles}>{change.type}</Badge>
        )}
        <code className={`${compact ? 'text-xs' : 'text-sm'} font-mono text-[var(--color-text-primary)] break-all`}>
          {change.path}
        </code>
      </div>

      {change.oldValue !== undefined && (
        compact ? (
          <p className="mt-1 text-xs text-red-600 line-through">{String(change.oldValue)}</p>
        ) : (
          <div className="mt-2 rounded bg-red-100/50 p-2">
            <p className="text-[10px] font-medium text-red-600 uppercase">Before</p>
            <p className="text-sm font-mono text-red-700">{String(change.oldValue)}</p>
          </div>
        )
      )}

      {change.newValue !== undefined && (
        compact ? (
          <p className="mt-0.5 text-xs text-green-600">{String(change.newValue)}</p>
        ) : (
          <div className="mt-1 rounded bg-green-100/50 p-2">
            <p className="text-[10px] font-medium text-green-600 uppercase">After</p>
            <p className="text-sm font-mono text-green-700">{String(change.newValue)}</p>
          </div>
        )
      )}
    </div>
  )
}

function StatCard({
  color, label, value,
}: {
  color: 'green' | 'amber' | 'red'
  label: string
  value: number
}) {
  const styles = {
    green: 'border-green-200 bg-green-50/50 text-green-700',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-700',
    red:   'border-red-200 bg-red-50/50 text-red-700',
  }[color]

  return (
    <div className={`rounded-lg border p-4 ${styles}`}>
      <p className="text-xs font-medium uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  )
}

function CenterSpinner() {
  return (
    <div className="py-12 flex items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  )
}