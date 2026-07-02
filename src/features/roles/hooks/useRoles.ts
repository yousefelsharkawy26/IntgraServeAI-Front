import { useQuery } from '@tanstack/react-query'
import { roleService } from '@/services/role.service'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function useRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.roles,
    queryFn: () => roleService.getRoles(),
  })
}

export function useMyRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.myRoles,
    queryFn: () => roleService.getMyRoles(),
  })
}
