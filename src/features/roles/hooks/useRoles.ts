import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: roleService.createRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roles })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myRoles })
    },
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Parameters<typeof roleService.updateRole>[1]
    }) => roleService.updateRole(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roles })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myRoles })
      qc.invalidateQueries({ queryKey: ['roles', vars.id, 'members'] })
    },
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roles })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myRoles })
    },
  })
}