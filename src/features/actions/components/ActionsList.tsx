import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, Zap, AlertTriangle } from 'lucide-react'
import { useActions, useActionMutations } from '../hooks/useActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTION_TYPE_CONFIG, ACTION_TYPES } from '@/constants/actions'
import type { Action, ActionType, ActionStatus } from '@/types/action'
import { ActionModal } from './ActionModal'
import { EmptyState } from '@/components/common/EmptyState'

export default function ActionsList() {
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ActionType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: actions, isLoading } = useActions({ status: statusFilter, type: typeFilter, search: search || undefined })
  const { toggleAction, deleteAction } = useActionMutations()

  const handleEdit = (action: Action) => {
    setEditingAction(action)
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingAction(null)
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deleteAction.mutate(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">Manage automated workflows and AI actions</p>
        <Button onClick={handleCreate} className="h-9 gap-2 rounded-lg bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90">
          <Plus className="h-4 w-4" />
          Create Action
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input placeholder="Search actions..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] pl-9 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ActionStatus | 'all')}>
          <SelectTrigger className="h-9 w-36 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ActionType | 'all')}>
          <SelectTrigger className="h-9 w-36 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{ACTION_TYPE_CONFIG[t].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-[var(--color-border-light)]"><CardContent className="p-5"><div className="h-16 bg-gray-100 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      ) : actions && actions.length > 0 ? (
        <AnimatePresence>
          <div className="space-y-3">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-[var(--color-border-light)] transition-shadow hover:shadow-sm">
                  <CardContent className="p-5">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{action.name}</h3>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${ACTION_TYPE_CONFIG[action.type].bgColor} ${ACTION_TYPE_CONFIG[action.type].color}`}>
                            {ACTION_TYPE_CONFIG[action.type].label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">{action.description}</p>
                      </div>
                      <Switch
                        checked={action.status === 'active'}
                        onCheckedChange={() => toggleAction.mutate(action.id)}
                      />
                    </div>

                    {/* Bottom Row - Pills */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                        Type: {ACTION_TYPE_CONFIG[action.type].label}
                      </span>
                      <span className="rounded-full border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                        Confirmation: {action.requiresConfirmation ? 'Required' : 'Not Required'}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={() => handleEdit(action)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(action.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Type-specific details preview */}
                    {action.apiConfig && (
                      <div className="mt-3 rounded-md bg-[var(--color-bg-base)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                        <span className="font-medium">{action.apiConfig.method}</span> {action.apiConfig.protocol}://{action.apiConfig.url}
                      </div>
                    )}
                    {action.rpcConfig && (
                      <div className="mt-3 rounded-md bg-[var(--color-bg-base)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                        RPC: {action.rpcConfig.service}.{action.rpcConfig.method} @ {action.rpcConfig.host}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <Card className="border-[var(--color-border-light)]">
          <CardContent>
            <EmptyState title="No actions found" description="Create your first action to automate workflows." icon={<Zap className="h-8 w-8 text-[var(--color-text-muted)]" />} />
          </CardContent>
        </Card>
      )}

      <ActionModal open={modalOpen} onClose={() => setModalOpen(false)} action={editingAction} />

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {confirmDeleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setConfirmDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Delete Action</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Are you sure you want to delete this action? It will be removed from the automation catalog.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-full px-4"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="h-9 rounded-full px-6 bg-red-600 text-white hover:bg-red-700"
                    onClick={confirmDelete}
                    disabled={deleteAction.isPending}
                  >
                    {deleteAction.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
