import { useEffect, useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { LLMConfiguration, LLMConfigurationPayload, ProviderInfo } from '@/types/configuration'

interface Props {
  open: boolean
  config: LLMConfiguration | null
  providers: ProviderInfo[]
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: LLMConfigurationPayload) => Promise<void>
}

const emptyForm = (provider = ''): LLMConfigurationPayload => ({
  name: '',
  provider,
  location: 'remote',
  model_name: '',
  api_key: '',
  temperature: 0.7,
  max_tokens: 2048,
  system_prompt_template: '',
  active: true,
  config_json: {},
})

export function LLMConfigurationDialog({ open, config, providers, saving, onOpenChange, onSave }: Props) {
  const [form, setForm] = useState<LLMConfigurationPayload>(emptyForm())

  useEffect(() => {
    if (!open) return
    setForm(config ? {
      name: config.name,
      provider: config.provider,
      location: config.location,
      model_name: config.model_name,
      api_key: '',
      api_key_reference: config.api_key_reference,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      system_prompt_template: config.system_prompt_template,
      active: config.active,
      config_json: config.config_json || {},
    } : emptyForm(providers[0]?.id || ''))
  }, [config, open, providers])

  const set = <K extends keyof LLMConfigurationPayload>(key: K, value: LLMConfigurationPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = { ...form }
    if (!payload.api_key) delete payload.api_key
    await onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{config ? 'Edit LLM configuration' : 'Create LLM configuration'}</DialogTitle>
          <DialogDescription>Provider options come directly from the backend ModelFactory registry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={150} />
            </Field>
            <Field label="Provider">
              <Select value={form.provider} onValueChange={(value) => set('provider', value)} required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>{providers.map((provider) => <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Location">
              <Select value={form.location} onValueChange={(value: 'local' | 'remote') => set('location', value)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="remote">Remote</SelectItem><SelectItem value="local">Local</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Model name">
              <Input value={form.model_name} onChange={(e) => set('model_name', e.target.value)} required />
            </Field>
            <Field label="Temperature">
              <Input type="number" min={0} max={2} step={0.1} value={form.temperature} onChange={(e) => set('temperature', Number(e.target.value))} required />
            </Field>
            <Field label="Max tokens">
              <Input type="number" min={1} step={1} value={form.max_tokens} onChange={(e) => set('max_tokens', Number(e.target.value))} required />
            </Field>
          </div>
          <Field label="API key" hint={config?.has_api_key ? 'Leave blank to keep the saved key.' : 'Stored encrypted by the backend.'}>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" type="password" autoComplete="new-password" value={form.api_key || ''} onChange={(e) => set('api_key', e.target.value)} placeholder={config?.has_api_key ? 'Key configured' : 'Optional for local providers'} />
            </div>
          </Field>
          <Field label="System prompt template">
            <Textarea rows={4} value={form.system_prompt_template} onChange={(e) => set('system_prompt_template', e.target.value)} placeholder="Identity: {{title}}\nRole: {{description}}\nTone: {{tone}}" />
          </Field>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><p className="text-sm font-medium">Available for selection</p><p className="text-xs text-muted-foreground">Selected configurations cannot be disabled.</p></div>
            <div className="flex items-center gap-2">{config?.has_api_key && <Badge variant="secondary">Key configured</Badge>}<Switch checked={form.active} onCheckedChange={(value) => set('active', value)} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.provider}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{config ? 'Save changes' : 'Create configuration'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
}
