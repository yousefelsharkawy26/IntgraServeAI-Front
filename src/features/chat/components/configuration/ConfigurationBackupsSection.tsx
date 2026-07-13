import { useState } from 'react'
import { CalendarClock, Eye, Loader2, Plus, RotateCcw, Trash2, UserRound } from 'lucide-react'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgentConfigBackupSummary } from '@/types/configuration'
import { useAgentConfigBackupDetail } from '../../hooks/useConfigurationSettings'

interface Props {
  backups: AgentConfigBackupSummary[]
  loading: boolean
  creating: boolean
  restoring: boolean
  deleting: boolean
  onCreate: (name?: string) => Promise<void>
  onRestore: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

type Confirmation = { type: 'restore' | 'delete'; backup: AgentConfigBackupSummary } | null

export function ConfigurationBackupsSection(props: Props) {
  const [name, setName] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const detail = useAgentConfigBackupDetail(detailId)

  const create = async () => {
    await props.onCreate(name || undefined)
    setName('')
  }

  const confirm = async () => {
    if (!confirmation) return
    if (confirmation.type === 'restore') await props.onRestore(confirmation.backup.id)
    else await props.onDelete(confirmation.backup.id)
    setConfirmation(null)
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="rounded-xl border bg-muted/30 p-4">
        <h3 className="font-semibold">Create a restore point</h3>
        <p className="mt-1 text-xs text-muted-foreground">Captures the agent, active prompt, selected LLM, credentials, and action defaults.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Description, for example: Before provider change" maxLength={255} />
          <Button onClick={create} disabled={props.creating} className="sm:shrink-0">{props.creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create backup</Button>
        </div>
      </div>

      <div className="space-y-3">
        <div><h3 className="font-semibold">Saved backups</h3><p className="text-xs text-muted-foreground">Restoring replaces the complete active runtime configuration.</p></div>
        {props.loading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-28 w-full" />) : props.backups.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No configuration backups yet.</div>
        ) : props.backups.map((backup) => (
          <div key={backup.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h4 className="font-medium">{backup.name}</h4><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{new Date(backup.created_at).toLocaleString()}</span><span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{backup.created_by_id || 'System'}</span></div></div>
              <div className="flex items-center gap-1"><Button size="icon-sm" variant="ghost" aria-label="View backup" onClick={() => setDetailId(backup.id)}><Eye className="h-4 w-4" /></Button><Button size="icon-sm" variant="ghost" aria-label="Restore backup" onClick={() => setConfirmation({ type: 'restore', backup })}><RotateCcw className="h-4 w-4" /></Button><Button size="icon-sm" variant="ghost" className="text-destructive" aria-label="Delete backup" onClick={() => setConfirmation({ type: 'delete', backup })}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Backup details</DialogTitle><DialogDescription>{detail.data?.name || 'Complete runtime configuration snapshot'}</DialogDescription></DialogHeader>
          {detail.isLoading ? <Skeleton className="h-72 w-full" /> : detail.isError ? <p className="text-sm text-destructive">Unable to load backup details.</p> : <pre className="max-h-[60vh] overflow-auto rounded-lg bg-muted p-4 text-xs">{JSON.stringify(detail.data?.snapshot, null, 2)}</pre>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmation)} onOpenChange={(open) => !open && setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirmation?.type === 'restore' ? 'Restore this configuration?' : 'Delete this backup?'}</AlertDialogTitle><AlertDialogDescription>{confirmation?.type === 'restore' ? 'The active agent, prompt, LLM configuration, and action defaults will be replaced. This takes effect immediately.' : 'This snapshot will be permanently deleted.'}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className={confirmation?.type === 'delete' ? 'bg-destructive text-white hover:bg-destructive/90' : ''} disabled={props.restoring || props.deleting} onClick={confirm}>{(props.restoring || props.deleting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{confirmation?.type === 'restore' ? 'Restore backup' : 'Delete backup'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
