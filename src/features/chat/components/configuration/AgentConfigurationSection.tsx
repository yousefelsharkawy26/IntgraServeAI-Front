import { useEffect, useState } from 'react'
import { Bot, Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type { AgentConfiguration, AgentConfigurationUpdate, LLMConfiguration } from '@/types/configuration'

interface Props {
  config?: AgentConfiguration
  llmConfigs: LLMConfiguration[]
  loading: boolean
  saving: boolean
  onSave: (payload: AgentConfigurationUpdate) => Promise<void>
}

export function AgentConfigurationSection({ config, llmConfigs, loading, saving, onSave }: Props) {
  const [form, setForm] = useState<AgentConfigurationUpdate | null>(null)

  useEffect(() => {
    if (!config) return
    setForm({
      system_context: { ...config.system_context },
      global_defaults: config.global_defaults || {},
      llm_config_id: config.llm_config_id,
    })
  }, [config])

  if (loading || !form) return <SectionSkeleton />

  const setContext = (key: keyof AgentConfigurationUpdate['system_context'], value: string) =>
    setForm((current) => current ? { ...current, system_context: { ...current.system_context, [key]: value } } : current)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onSave(form)
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-6">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Bot className="h-5 w-5 text-primary" /></div>
          <div><h3 className="font-semibold">Agent identity</h3><p className="text-xs text-muted-foreground">Controls the system context used by new conversations.</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agent title"><Input value={form.system_context.title} onChange={(e) => setContext('title', e.target.value)} required /></Field>
          <Field label="Version"><Input value={form.system_context.version} onChange={(e) => setContext('version', e.target.value)} required /></Field>
          <div className="sm:col-span-2"><Field label="Tone"><Input value={form.system_context.tone} onChange={(e) => setContext('tone', e.target.value)} required /></Field></div>
          <div className="sm:col-span-2"><Field label="Description / system prompt"><Textarea rows={10} value={form.system_context.description} onChange={(e) => setContext('description', e.target.value)} required /></Field></div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border p-4">
        <Label>Selected LLM configuration</Label>
        <Select value={form.llm_config_id} onValueChange={(value) => setForm((current) => current ? { ...current, llm_config_id: value } : current)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select a saved LLM configuration" /></SelectTrigger>
          <SelectContent>
            {llmConfigs.filter((item) => item.active).map((item) => (
              <SelectItem key={item.id} value={item.id}>{item.name} · {item.provider} / {item.model_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Changing this selection reloads the backend Action Engine immediately.</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !form.llm_config_id}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save agent configuration
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}

function SectionSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-44 w-full" /><Skeleton className="h-20 w-full" /></div>
}
