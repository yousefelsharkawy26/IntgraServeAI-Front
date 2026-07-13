import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '@/constants/queryKeys'
import { getApiErrorMessage } from '@/lib/apiError'
import { agentConfigService } from '@/services/agent-config.service'
import { agentConfigBackupService } from '@/services/agent-config-backup.service'
import { llmConfigService } from '@/services/llm-config.service'
import { useNotificationStore } from '@/store/notificationStore'
import type { AgentConfigurationUpdate, LLMConfigurationPayload } from '@/types/configuration'

export function useAgentConfigBackupDetail(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.agentConfigBackup(id || ''),
    queryFn: () => agentConfigBackupService.get(id!),
    enabled: Boolean(id),
  })
}

export function useConfigurationSettings(enabled: boolean) {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)

  const agentConfig = useQuery({
    queryKey: QUERY_KEYS.agentConfig,
    queryFn: agentConfigService.get,
    enabled,
  })
  const llmConfigs = useQuery({
    queryKey: QUERY_KEYS.llmConfigs,
    queryFn: llmConfigService.list,
    enabled,
  })
  const providers = useQuery({
    queryKey: QUERY_KEYS.llmConfigProviders,
    queryFn: llmConfigService.providers,
    enabled,
    staleTime: 30 * 60_000,
  })
  const backups = useQuery({
    queryKey: QUERY_KEYS.agentConfigBackups,
    queryFn: agentConfigBackupService.list,
    enabled,
  })

  const updateAgent = useMutation({
    mutationFn: (payload: AgentConfigurationUpdate) => agentConfigService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentConfig })
      addToast({ type: 'success', title: 'Configuration saved', message: 'The agent will use these settings for new conversations.' })
    },
    onError: (error) => addToast({ type: 'error', title: 'Unable to save configuration', message: getApiErrorMessage(error) }),
  })

  const createLLM = useMutation({
    mutationFn: (payload: LLMConfigurationPayload) => llmConfigService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.llmConfigs })
      addToast({ type: 'success', title: 'LLM configuration created', message: 'The configuration is ready to select.' })
    },
    onError: (error) => addToast({ type: 'error', title: 'Unable to create LLM configuration', message: getApiErrorMessage(error) }),
  })

  const updateLLM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LLMConfigurationPayload }) => llmConfigService.replace(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.llmConfigs })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentConfig })
      addToast({ type: 'success', title: 'LLM configuration updated', message: 'Saved changes are now available.' })
    },
    onError: (error) => addToast({ type: 'error', title: 'Unable to update LLM configuration', message: getApiErrorMessage(error) }),
  })

  const deleteLLM = useMutation({
    mutationFn: llmConfigService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.llmConfigs })
      addToast({ type: 'success', title: 'LLM configuration deleted' })
    },
    onError: (error) => addToast({
      type: 'error',
      title: 'Unable to delete LLM configuration',
      message: getApiErrorMessage(error, 'Selected configurations cannot be deleted.'),
    }),
  })

  const createBackup = useMutation({
    mutationFn: agentConfigBackupService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentConfigBackups })
      addToast({ type: 'success', title: 'Backup created', message: 'A complete configuration snapshot was saved.' })
    },
    onError: (error) => addToast({ type: 'error', title: 'Unable to create backup', message: getApiErrorMessage(error) }),
  })

  const restoreBackup = useMutation({
    mutationFn: agentConfigBackupService.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentConfig })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.llmConfigs })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentConfigBackups })
      addToast({ type: 'success', title: 'Backup restored', message: 'The restored configuration is active.' })
    },
    onError: (error) => addToast({ type: 'error', title: 'Restore failed', message: getApiErrorMessage(error) }),
  })

  const deleteBackup = useMutation({
    mutationFn: agentConfigBackupService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentConfigBackups })
      addToast({ type: 'success', title: 'Backup deleted' })
    },
    onError: (error) => addToast({ type: 'error', title: 'Unable to delete backup', message: getApiErrorMessage(error) }),
  })

  return {
    agentConfig,
    llmConfigs,
    providers,
    backups,
    updateAgent,
    createLLM,
    updateLLM,
    deleteLLM,
    createBackup,
    restoreBackup,
    deleteBackup,
  }
}
