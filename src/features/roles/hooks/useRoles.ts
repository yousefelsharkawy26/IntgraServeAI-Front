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

export function useRoleMembers(roleId: string | null) {
  return useQuery({
    queryKey: ['roles', roleId, 'members'],
    queryFn: () => roleService.getRoleMembers(roleId as string) as Promise<any>,
    enabled: !!roleId,
  })
}

// NOTE: useCreateRole / useUpdateRole / useDeleteRole were previously defined
// here but referenced `roleService.createRole / updateRole / deleteRole`,
// which do not exist on the service. They were also never imported anywhere.
// They have been removed to fix the build. When role CRUD is needed, add the
// corresponding methods to `role.service.ts` first, then re-introduce the
// hooks here.
