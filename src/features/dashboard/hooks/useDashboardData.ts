import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { DashboardData } from '@/types/dashboard'

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => dashboardService.getOverview(),
    refetchInterval: 30000,
  })
}
