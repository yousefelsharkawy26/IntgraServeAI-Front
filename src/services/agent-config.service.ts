import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import type { AgentConfiguration, AgentConfigurationUpdate } from '@/types/configuration'

export const agentConfigService = {
  async get(): Promise<AgentConfiguration> {
    const { data } = await api.get<AgentConfiguration>(API_ENDPOINTS.agentConfig.root)
    return data
  },

  async update(payload: AgentConfigurationUpdate): Promise<void> {
    await api.put(API_ENDPOINTS.agentConfig.root, payload)
  },
}
