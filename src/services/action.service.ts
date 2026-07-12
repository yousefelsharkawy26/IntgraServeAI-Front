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
    // Log the exact payload being sent for debugging 422 errors
    const payloadJson = JSON.stringify(action, null, 2)
    console.log('[actionService] Creating action with payload:', payloadJson)

    try {
      const { data } = await api.post<any>(API_ENDPOINTS.actions.list, action)
      return mapBackendActionToFrontend(data)
    } catch (error: any) {
      const status = error?.response?.status
      const errorData = error?.response?.data
      console.error('[actionService] Create failed:', {
        status,
        errorData: JSON.stringify(errorData, null, 2),
        sentPayload: payloadJson,
      })
      throw error
    }
  },

  async updateAction(id: string, action: Partial<CreateActionData>): Promise<Action> {
    const payloadJson = JSON.stringify(action, null, 2)
    console.log('[actionService] Updating action with payload:', payloadJson)

    try {
      const { data } = await api.put<any>(API_ENDPOINTS.actions.detail(id), action)
      return mapBackendActionToFrontend(data)
    } catch (error: any) {
      const status = error?.response?.status
      // Some deployments may still expose PATCH for updates. Only retry when
      // PUT is explicitly unsupported/not found; do not retry validation or
      // business-logic failures because that could hide the real backend error.
      if (status === 404 || status === 405) {
        const { data } = await api.patch<any>(API_ENDPOINTS.actions.detail(id), action)
        return mapBackendActionToFrontend(data)
      }

      console.error('[actionService] Update failed:', {
        status,
        errorData: JSON.stringify(error?.response?.data, null, 2),
        sentPayload: payloadJson,
      })
      throw error
    }
  },

  async deleteAction(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.actions.detail(id))
  },

  async toggleAction(id: string): Promise<Action> {
    await api.post<any>(API_ENDPOINTS.actions.toggle(id))
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
