import { useState } from 'react'
import { Check, Edit3, KeyRound, Loader2, Plus, Server, Trash2 } from 'lucide-react'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { LLMConfiguration, LLMConfigurationPayload, ProviderInfo } from '@/types/configuration'
import { LLMConfigurationDialog } from './LLMConfigurationDialog'

interface Props {
  configs: LLMConfiguration[]
  providers: ProviderInfo[]
  selectedId?: string
  loading: boolean
  saving: boolean
  onCreate: (payload: LLMConfigurationPayload) => Promise<void>
  onUpdate: (id: string, payload: LLMConfigurationPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSelect: (id: string) => Promise<void>
}

export function LLMConfigurationsSection(props: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LLMConfiguration | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LLMConfiguration | null>(null)
  const [selectingId, setSelectingId] = useState<string | null>(null)

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (config: LLMConfiguration) => { setEditing(config); setDialogOpen(true) }

  const save = async (payload: LLMConfigurationPayload) => {
    if (editing) await props.onUpdate(editing.id, payload)
    else await props.onCreate(payload)
    setDialogOpen(false)
  }

  const select = async (id: string) => {
    setSelectingId(id)
    try { await props.onSelect(id) } finally { setSelectingId(null) }
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-semibold">Saved configurations</h3><p className="text-xs text-muted-foreground">Reusable provider and model settings.</p></div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New configuration</Button>
      </div>

      {props.loading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-36 w-full" />)}</div>
      ) : props.configs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center"><Server className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">No LLM configurations</p><p className="text-sm text-muted-foreground">Create one to connect the agent to a model.</p></div>
      ) : (
        <div className="space-y-3">
          {props.configs.map((config) => {
            const selected = config.id === props.selectedId
            return (
              <Card key={config.id} className={selected ? 'border-primary/60 bg-primary/5 py-0' : 'py-0'}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{config.name}</h4>{selected && <Badge><Check className="h-3 w-3" />Selected</Badge>}{!config.active && <Badge variant="outline">Inactive</Badge>}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{config.provider} · {config.model_name} · {config.location}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" aria-label={`Edit ${config.name}`} onClick={() => openEdit(config)}><Edit3 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" aria-label={`Delete ${config.name}`} disabled={selected} onClick={() => setDeleteTarget(config)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">Temperature {config.temperature}</Badge>
                    <Badge variant="secondary">{config.max_tokens.toLocaleString()} tokens</Badge>
                    <Badge variant="outline"><KeyRound className="h-3 w-3" />{config.has_api_key ? 'Key configured' : 'No saved key'}</Badge>
                  </div>
                  {!selected && config.active && <Button variant="outline" size="sm" className="mt-3" disabled={selectingId === config.id} onClick={() => select(config.id)}>{selectingId === config.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Use this configuration</Button>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <LLMConfigurationDialog open={dialogOpen} config={editing} providers={props.providers} saving={props.saving} onOpenChange={setDialogOpen} onSave={save} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete LLM configuration?</AlertDialogTitle><AlertDialogDescription>This permanently removes “{deleteTarget?.name}”. Configurations selected by an agent cannot be deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={async () => { if (deleteTarget) await props.onDelete(deleteTarget.id); setDeleteTarget(null) }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
