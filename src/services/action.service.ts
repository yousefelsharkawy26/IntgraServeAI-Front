import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import { mapBackendActionToFrontend } from '@/mappers/action.mapper'
import type { Action, CreateActionData, ActionFilters } from '@/types/action'

export const actionService = {
  async getActions(filters?: ActionFilters): Promise<Action[]> {
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type)
    if (filters?.search) params.append('search', filters.search)

    const query = params.toString()
    const { data } = await api.get<any>(`${API_ENDPOINTS.actions.list}${query ? `?${query}` : ''}`)
    const actionsList = Array.isArray(data) ? data : (data?.actions || [])
    return actionsList.map(mapBackendActionToFrontend)
  },

  async getAction(id: string): Promise<Action> {
    const { data } = await api.get<any>(API_ENDPOINTS.actions.detail(id))
    return mapBackendActionToFrontend(data)
  },

  async createAction(action: CreateActionData): Promise<Action> {
    // buildCreatePayload already transforms form data into the backend-aligned
    // CreateActionData shape (snake_case, execution_config, etc.), so we send
    // it directly — no second mapping pass needed.
    const { data } = await api.post<any>(API_ENDPOINTS.actions.list, action)
    return mapBackendActionToFrontend(data)
  },

  async updateAction(id: string, action: Partial<CreateActionData>): Promise<Action> {
    const { data } = await api.patch<any>(API_ENDPOINTS.actions.detail(id), action)
    return mapBackendActionToFrontend(data)
  },

  async deleteAction(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.actions.detail(id))
  },

  async toggleAction(id: string): Promise<Action> {
    await api.post<any>(API_ENDPOINTS.actions.toggle(id))
    // Fetch and return the updated action detailed model
    return this.getAction(id)
  },

  async validateAction(action: CreateActionData): Promise<{ valid: boolean; message?: string; warnings?: string[] }> {
    const { data } = await api.post<any>('/actions/validate', action)
    return {
      valid: data.valid,
      message: data.message,
      warnings: data.warnings,
    }
  },
}
