import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  LLMConfiguration,
  LLMConfigurationPayload,
  ProviderInfo,
} from '@/types/configuration'

export const llmConfigService = {
  async providers(): Promise<ProviderInfo[]> {
    const { data } = await api.get<ProviderInfo[]>(API_ENDPOINTS.llmConfigs.providers)
    return data
  },

  async list(): Promise<LLMConfiguration[]> {
    const { data } = await api.get<LLMConfiguration[]>(API_ENDPOINTS.llmConfigs.list)
    return data
  },

  async get(id: string): Promise<LLMConfiguration> {
    const { data } = await api.get<LLMConfiguration>(API_ENDPOINTS.llmConfigs.detail(id))
    return data
  },

  async create(payload: LLMConfigurationPayload): Promise<LLMConfiguration> {
    const { data } = await api.post<LLMConfiguration>(API_ENDPOINTS.llmConfigs.list, payload)
    return data
  },

  async replace(id: string, payload: LLMConfigurationPayload): Promise<LLMConfiguration> {
    const { data } = await api.put<LLMConfiguration>(API_ENDPOINTS.llmConfigs.detail(id), payload)
    return data
  },

  async patch(id: string, payload: Partial<LLMConfigurationPayload>): Promise<LLMConfiguration> {
    const { data } = await api.patch<LLMConfiguration>(API_ENDPOINTS.llmConfigs.detail(id), payload)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.llmConfigs.detail(id))
  },
}
