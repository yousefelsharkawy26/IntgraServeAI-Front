import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Clock, HardDrive, RefreshCw, ArrowRightLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useBackups, useBackupDetail, useBackupMutations } from '../hooks/useBackups'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import type { Backup } from '@/types/backup'

export default function BackupsView() {
  const { data, isLoading } = useBackups()
  const { restoreBackup } = useBackupMutations()
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const backups = data?.backups || []

  // Load detailed comparison data when a backup is selected
  const { data: compareData, isLoading: isComparing } = useBackupDetail(selectedBackup?.id || '')

  const handleRestore = async (id: string) => {
    setRestoringId(id)
    try {
      await restoreBackup.mutateAsync(id)
    } catch {
      // toast shown by mutation
    } finally {
      setRestoringId(null)
    }
  }

  const formatSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`
    }
    const kb = bytes / 1024
    return `${kb.toFixed(1)} KB`
  }

  const formatTime = (iso: string) => {
    if (!iso) return ''
    const date = new Date(iso)
    return date.toLocaleString()
  }

  const timeAgo = (iso: string) => {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">Manage system snapshots and restore points</p>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Snapshot List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Database className="h-4 w-4" />
            Available Snapshots
          </h3>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-[var(--color-border-light)]">
                <CardContent className="p-4">
                  <div className="h-16 bg-gray-100 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : backups.length === 0 ? (
            <EmptyState title="No backups" description="No snapshots available." />
          ) : (
            backups.map((backup) => (
              <motion.div
                key={backup.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`cursor-pointer rounded-xl border transition-all ${
                  selectedBackup?.id === backup.id
                    ? 'border-[var(--color-accent-blue)] bg-blue-50/50 shadow-sm'
                    : 'border-[var(--color-border-light)] bg-[var(--color-bg-surface)] hover:shadow-sm'
                }`}
                onClick={() => setSelectedBackup(backup)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{backup.name}</h4>
                        <Badge variant="outline" className="h-5 text-[10px] bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{backup.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(backup.createdAt)}</span>
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{formatSize(backup.size)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs rounded-full"
                      disabled={restoringId === backup.id}
                      onClick={(e) => { e.stopPropagation(); handleRestore(backup.id) }}
                    >
                      {restoringId === backup.id ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs rounded-full"
                      onClick={(e) => { e.stopPropagation(); setSelectedBackup(backup); setDiffModalOpen(true) }}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      View Changes
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Comparison Viewer */}
        <div className="lg:col-span-3">
          {selectedBackup ? (
            <Card className="border-[var(--color-border-light)]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowRightLeft className="h-4 w-4 text-[var(--color-text-muted)]" />
                  Comparison: Current vs {selectedBackup.name}
                </CardTitle>
                <p className="text-xs text-[var(--color-text-muted)]">Created {formatTime(selectedBackup.createdAt)}</p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="metrics">
                  <TabsList className="rounded-lg border border-[var(--color-border-light)] p-0.5">
                    <TabsTrigger value="metrics" className="text-xs data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-white">Metrics</TabsTrigger>
                    <TabsTrigger value="changes" className="text-xs data-[state=active]:bg-[var(--color-text-primary)] data-[state=active]:text-white">Changes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="metrics" className="mt-4">
                    {isComparing ? (
                      <div className="py-12 flex items-center justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-6 w-6 rounded-full border-2 border-[var(--color-accent-blue)] border-t-transparent" />
                      </div>
                    ) : compareData ? (
                      <div className="grid grid-cols-2 gap-3">
                        {compareData.metrics.map((metric) => (
                          <div key={metric.key} className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] p-3">
                            <p className="text-xs text-[var(--color-text-muted)]">{metric.label}</p>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-2xl font-semibold text-[var(--color-text-primary)]">
                                {metric.current}{metric.unit || ''}
                              </span>
                              <span className="flex items-center gap-1 text-xs">
                                <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                                <span className="text-[var(--color-text-muted)]">{metric.backup}{metric.unit || ''}</span>
                                {metric.current > metric.backup ? (
                                  <span className="text-green-600">+{metric.current - metric.backup}</span>
                                ) : metric.current < metric.backup ? (
                                  <span className="text-red-500">{metric.current - metric.backup}</span>
                                ) : null}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--color-text-muted)]">No comparison data available.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="changes" className="mt-4">
                    {isComparing ? (
                      <div className="py-12 flex items-center justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-6 w-6 rounded-full border-2 border-[var(--color-accent-blue)] border-t-transparent" />
                      </div>
                    ) : compareData && compareData.changes.length > 0 ? (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {compareData.changes.map((change, i) => (
                          <div key={i} className={`rounded-lg border p-3 ${
                            change.type === 'added' ? 'border-green-200 bg-green-50/50' :
                            change.type === 'removed' ? 'border-red-200 bg-red-50/50' :
                            'border-amber-200 bg-amber-50/50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Badge className={`h-5 text-[10px] ${
                                change.type === 'added' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                change.type === 'removed' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                'bg-amber-100 text-amber-700 hover:bg-amber-100'
                              }`}>
                                {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
                              </Badge>
                              <code className="text-xs font-mono text-[var(--color-text-primary)] break-all">{change.path}</code>
                            </div>
                            {change.oldValue !== undefined && (
                              <p className="mt-1 text-xs text-red-600 line-through">{String(change.oldValue)}</p>
                            )}
                            {change.newValue !== undefined && (
                              <p className="mt-0.5 text-xs text-green-600">{String(change.newValue)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No action configuration changes detected.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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

      {/* Diff Modal */}
      <AnimatePresence>
        {diffModalOpen && selectedBackup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setDiffModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed left-1/2 top-[5%] z-50 w-full max-w-3xl -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Changes in {selectedBackup.name}</h2>
                <button onClick={() => setDiffModalOpen(false)} className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]">
                  <span className="text-lg">&times;</span>
                </button>
              </div>
              <div className="p-6">
                {isComparing ? (
                  <div className="py-24 flex items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-8 w-8 rounded-full border-2 border-[var(--color-accent-blue)] border-t-transparent" />
                  </div>
                ) : compareData ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                        <p className="text-xs font-medium text-green-700 uppercase">Added</p>
                        <p className="mt-1 text-2xl font-semibold text-green-700">
                          {compareData.changes.filter((c) => c.type === 'added').length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                        <p className="text-xs font-medium text-amber-700 uppercase">Modified</p>
                        <p className="mt-1 text-2xl font-semibold text-amber-700">
                          {compareData.changes.filter((c) => c.type === 'modified').length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                        <p className="text-xs font-medium text-red-700 uppercase">Removed</p>
                        <p className="mt-1 text-2xl font-semibold text-red-700">
                          {compareData.changes.filter((c) => c.type === 'removed').length}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      {compareData.changes.map((change, i) => (
                        <div key={i} className={`rounded-lg border p-4 ${
                          change.type === 'added' ? 'border-green-200 bg-green-50/30' :
                          change.type === 'removed' ? 'border-red-200 bg-red-50/30' :
                          'border-amber-200 bg-amber-50/30'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Badge className={`${
                              change.type === 'added' ? 'bg-green-100 text-green-700' :
                              change.type === 'removed' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {change.type}
                            </Badge>
                            <code className="text-sm font-mono text-[var(--color-text-primary)] break-all">{change.path}</code>
                          </div>
                          {change.oldValue !== undefined && (
                            <div className="mt-2 rounded bg-red-100/50 p-2">
                              <p className="text-[10px] font-medium text-red-600 uppercase">Before</p>
                              <p className="text-sm font-mono text-red-700">{String(change.oldValue)}</p>
                            </div>
                          )}
                          {change.newValue !== undefined && (
                            <div className={`rounded p-2 ${change.oldValue !== undefined ? 'mt-1 bg-green-100/50' : 'mt-2 bg-green-100/50'}`}>
                              <p className="text-[10px] font-medium text-green-600 uppercase">After</p>
                              <p className="text-sm font-mono text-green-700">{String(change.newValue)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center py-12 text-[var(--color-text-muted)]">No comparison data available.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
