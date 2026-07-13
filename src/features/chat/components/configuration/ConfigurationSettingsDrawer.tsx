import { AlertCircle, Bot, DatabaseBackup, Settings2, Sparkles } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AgentConfigurationUpdate, LLMConfigurationPayload } from '@/types/configuration'
import { useConfigurationSettings } from '../../hooks/useConfigurationSettings'
import { AgentConfigurationSection } from './AgentConfigurationSection'
import { ConfigurationBackupsSection } from './ConfigurationBackupsSection'
import { LLMConfigurationsSection } from './LLMConfigurationsSection'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigurationSettingsDrawer({ open, onOpenChange }: Props) {
  const settings = useConfigurationSettings(open)
  const agent = settings.agentConfig.data
  const llms = settings.llmConfigs.data || []
  const providers = settings.providers.data || []
  const backups = settings.backups.data || []
  const hasError = settings.agentConfig.isError || settings.llmConfigs.isError || settings.providers.isError || settings.backups.isError

  const saveAgent = (payload: AgentConfigurationUpdate) => settings.updateAgent.mutateAsync(payload)
  const selectLLM = async (id: string) => {
    if (!agent) return
    await saveAgent({
      system_context: { ...agent.system_context },
      global_defaults: agent.global_defaults || {},
      llm_config_id: id,
    })
  }
  const createLLM = async (payload: LLMConfigurationPayload) => { await settings.createLLM.mutateAsync(payload) }
  const updateLLM = async (id: string, payload: LLMConfigurationPayload) => { await settings.updateLLM.mutateAsync({ id, payload }) }
  const deleteLLM = async (id: string) => { await settings.deleteLLM.mutateAsync(id) }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl">
        <SheetHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2"><Settings2 className="h-5 w-5 text-primary" /></div><div><SheetTitle>Configuration Settings</SheetTitle><SheetDescription>Manage the active agent, reusable models, and restore points.</SheetDescription></div></div>
        </SheetHeader>
        <Tabs defaultValue="agent" className="min-h-0 flex-1 gap-0">
          <div className="border-b px-4 py-3">
            <TabsList className="grid h-auto w-full grid-cols-3">
              <TabsTrigger value="agent" className="py-2"><Bot className="h-4 w-4" /><span className="hidden sm:inline">Agent</span></TabsTrigger>
              <TabsTrigger value="llms" className="py-2"><Sparkles className="h-4 w-4" /><span className="hidden sm:inline">LLM Configs</span></TabsTrigger>
              <TabsTrigger value="backups" className="py-2"><DatabaseBackup className="h-4 w-4" /><span className="hidden sm:inline">Backups</span></TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {hasError && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Some settings could not be loaded</AlertTitle><AlertDescription>Check your connection and administrator permissions, then reopen the panel.</AlertDescription></Alert>}
            <TabsContent value="agent"><AgentConfigurationSection config={agent} llmConfigs={llms} loading={settings.agentConfig.isLoading || settings.llmConfigs.isLoading} saving={settings.updateAgent.isPending} onSave={saveAgent} /></TabsContent>
            <TabsContent value="llms"><LLMConfigurationsSection configs={llms} providers={providers} selectedId={agent?.llm_config_id} loading={settings.llmConfigs.isLoading || settings.providers.isLoading} saving={settings.createLLM.isPending || settings.updateLLM.isPending} onCreate={createLLM} onUpdate={updateLLM} onDelete={deleteLLM} onSelect={selectLLM} /></TabsContent>
            <TabsContent value="backups"><ConfigurationBackupsSection backups={backups} loading={settings.backups.isLoading} creating={settings.createBackup.isPending} restoring={settings.restoreBackup.isPending} deleting={settings.deleteBackup.isPending} onCreate={async (name) => { await settings.createBackup.mutateAsync(name) }} onRestore={async (id) => { await settings.restoreBackup.mutateAsync(id) }} onDelete={async (id) => { await settings.deleteBackup.mutateAsync(id) }} /></TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
