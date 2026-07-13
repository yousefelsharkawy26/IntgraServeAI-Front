import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import type { AgentConfigBackupDetail, AgentConfigBackupSummary } from '@/types/configuration'

export const agentConfigBackupService = {
  async list(): Promise<AgentConfigBackupSummary[]> {
    const { data } = await api.get<AgentConfigBackupSummary[]>(API_ENDPOINTS.agentConfig.backups.list)
    return data
  },

  async create(name?: string): Promise<AgentConfigBackupDetail> {
    const { data } = await api.post<AgentConfigBackupDetail>(
      API_ENDPOINTS.agentConfig.backups.list,
      { name: name?.trim() || null }
    )
    return data
  },

  async get(id: string): Promise<AgentConfigBackupDetail> {
    const { data } = await api.get<AgentConfigBackupDetail>(API_ENDPOINTS.agentConfig.backups.detail(id))
    return data
  },

  async restore(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.agentConfig.backups.restore(id))
  },

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.agentConfig.backups.detail(id))
  },
}
