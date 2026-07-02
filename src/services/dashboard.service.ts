import api from './api'
import { mapDashboardData } from '@/mappers/dashboard.mapper'
import type { DashboardData } from '@/types/dashboard'

export const dashboardService = {
  async getOverview(): Promise<DashboardData> {
    const [
      ticketStatsResponse,
      userStatsResponse,
      actionsResponse,
      recentTicketsResponse
    ] = await Promise.all([
      api.get<any>('/tickets/admin/statistics').catch(() => ({ data: {} })),
      api.get<any>('/users/statistics').catch(() => ({ data: {} })),
      api.get<any>('/actions').catch(() => ({ data: [] })),
      api.get<any>('/tickets/admin/all?limit=5').catch(() => 
        api.get<any>('/tickets/my-tickets?limit=5').catch(() => ({ data: { tickets: [] } }))
      )
    ])

    const actionsData = Array.isArray(actionsResponse.data)
      ? actionsResponse.data
      : (actionsResponse.data?.actions || [])

    return mapDashboardData(
      ticketStatsResponse.data,
      userStatsResponse.data,
      actionsData,
      recentTicketsResponse.data?.tickets || []
    )
  },
}
