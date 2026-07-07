import api from './api'

import { API_ENDPOINTS } from '@/constants/api'

import type { Role } from '@/types/role'

type RolePermission = Role['permissions'][number]

const ROLE_LABEL_MAP: Record<string, string> = {
  Admin: 'Administrator',
  'Tech User': 'Manager',
  'Support User': 'Support Agent',
}

function toFrontendName(name: string): string {
  return ROLE_LABEL_MAP[name] || name
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

function derivePermissionMeta(key: string): { module: string; name: string } {
  const [moduleKey = '', ...rest] = (key || '').split('.')
  const action = rest.join('.')
  if (!action)
    return { module: moduleKey || 'general', name: capitalize(moduleKey) }
  return {
    module: moduleKey,
    name: `${capitalize(action)} ${capitalize(moduleKey)}`,
  }
}

/**
 * Permission keys recognised by the frontend. The form (`RoleFormModal`)
 * reads from this exact list, so anything granted here will appear as
 * "✓ granted" in the card.
 *
 * Keep in sync with `ALL_PERMISSION_KEYS` in RoleCard.tsx.
 */
const ALL_PERMISSION_KEYS = [
  'tickets.view',
  'tickets.edit',
  'tickets.delete',
  'users.manage',
  'roles.manage',
  'ai.configure',
  'backups.view',
  'system.settings',
] as const

/**
 * TEMPORARY fallback for the current backend, which does NOT embed
 * permissions in the role response. As soon as the backend fixes the
 * response to include `permissions` (or adds a dedicated endpoint),
 * this map is bypassed automatically — `extractPermissions` only falls
 * back here when the API returns none.
 *
 * Keys are the BACKEND role names (`Admin`, `Tech User`, `Support User`),
 * not the frontend display labels.
 *
 * Adjust this map to match your actual access policy.
 */
const FALLBACK_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  Admin: ALL_PERMISSION_KEYS, // full access
  'Tech User': [
    // Manager — technical/system focus
    'tickets.view',
    'tickets.edit',
    'tickets.delete',
    'users.manage',
    'roles.manage',
    'ai.configure',
    'backups.view',
  ],
  'Support User': [
    // Support Agent — customer interaction focus
    'tickets.view',
    'tickets.edit',
  ],
  Administrator: ALL_PERMISSION_KEYS,
  Manager: [
    'tickets.view',
    'tickets.edit',
    'tickets.delete',
    'users.manage',
    'roles.manage',
    'ai.configure',
    'backups.view',
  ],
  'Support Agent': ['tickets.view', 'tickets.edit'],
}

function fallbackForRole(backendRoleName: string): RolePermission[] {
  const keys = FALLBACK_ROLE_PERMISSIONS[backendRoleName]
  if (!keys || keys.length === 0) return []
  return keys.map((key, i) => {
    const meta = derivePermissionMeta(key)
    return { id: `fallback-${key}-${i}`, key, ...meta } as RolePermission
  })
}

function extractPermissions(raw: any, backendRoleName?: string): RolePermission[] {
  if (!raw) return []

  const wrap = (input: any): RolePermission[] => {
    const sources: any[] = [
      input,
      input?.permissions,
      input?.permission_keys,
      input?.permissionKeys,
      input?.granted_permissions,
      input?.grantedPermissions,
      input?.assigned_permissions,
      input?.assignedPermissions,
      input?.rights,
      input?.capabilities,
      input?.data?.permissions,
      input?.data?.permission_keys,
      input?.response?.permissions,
    ]
    for (const source of sources) {
      if (Array.isArray(source)) {
        return source
          .map((p: any, i: number): RolePermission | null => {
            if (p == null) return null
            if (typeof p === 'string') {
              const meta = derivePermissionMeta(p)
              return { id: `${p}-${i}`, key: p, ...meta } as RolePermission
            }
            const key = String(
              p.key ?? p.permission_key ?? p.permissionKey ?? '',
            )
            if (!key) return null
            const meta = derivePermissionMeta(key)
            return {
              id: String(p.id ?? `${key}-${i}`),
              key,
              module: p.module ?? meta.module,
              name: p.name ?? meta.name,
            } as RolePermission
          })
          .filter((p): p is RolePermission => p !== null)
      }
    }
    return []
  }

  const parsed = wrap(raw)
  if (parsed.length > 0) return parsed

  // Backend returned no permissions — fall back to the static map.
  if (backendRoleName) {
    const fb = fallbackForRole(backendRoleName)
    if (fb.length > 0) {
      console.info(
        `[roleService] backend didn't return permissions for "${backendRoleName}" — using frontend fallback (${fb.length} perms). Fix the backend response to remove this fallback.`,
      )
      return fb
    }
  }
  return []
}

function unwrapRoles(data: any): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.roles)) return data.roles
  if (Array.isArray(data.response?.roles)) return data.response.roles
  if (Array.isArray(data.data?.roles)) return data.data.roles
  return []
}

function unwrapStatsMap(data: any): Map<string, number> {
  const map = new Map<string, number>()
  if (!data) return map
  const list =
    data.roles ??
    data.response?.roles ??
    data.data?.roles ??
    (Array.isArray(data) ? data : [])
  if (Array.isArray(list)) {
    list.forEach((r: any) => {
      if (r?.id != null) {
        map.set(String(r.id), Number(r.user_count || 0))
      }
    })
  }
  return map
}

function toFrontendRole(
  r: any,
  userCount = 0,
  backendNameHint?: string,
): Role {
  return {
    id: String(r.id),
    name: toFrontendName(r.name),
    description: r.description || '',
    permissions: extractPermissions(r, backendNameHint ?? r.name),
    userCount,
    createdAt: r.created_at || '',
    updatedAt: r.updated_at ?? r.created_at ?? '',
  }
}

export type CreateRolePayload = {
  name: string
  description?: string
  permissions?: string[]
}

export type UpdateRolePayload = Partial<CreateRolePayload>

export const roleService = {
  async createRole(payload: CreateRolePayload): Promise<Role> {
    const { data } = await api.post<Role>(API_ENDPOINTS.roles.list, payload)
    return toFrontendRole(data, 0, data?.name)
  },

  async updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
    const { data } = await api.put<Role>(API_ENDPOINTS.roles.detail(id), payload)
    return toFrontendRole(data, 0, data?.name)
  },

  async deleteRole(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.roles.detail(id))
  },

  async getMyRoles(): Promise<Role[]> {
    const { data } = await api.get<any>(API_ENDPOINTS.roles.me)
    return unwrapRoles(data).map((r: any) => toFrontendRole(r, 0, r.name))
  },

  async getRoles(): Promise<Role[]> {
    let statsMap = new Map<string, number>()
    try {
      const { data: statsData } = await api.get<any>('/roles/statistics')
      statsMap = unwrapStatsMap(statsData)
    } catch (err) {
      console.warn('[roleService.getRoles] stats unavailable', err)
    }

    const { data: listData } = await api.get<any>(API_ENDPOINTS.roles.list)
    const roles = unwrapRoles(listData).map((r: any) =>
      toFrontendRole(r, statsMap.get(String(r.id)) || 0, r.name),
    )

    // Skip the N detail fetches when fallback already populated the list —
    // we only fetch per-role details when the response MIGHT have richer
    // permission data than the list.
    const allHaveRealPermissions = roles.every(
      (r) =>
        r.permissions.length > 0 &&
        !r.permissions.some((p) => p.id.startsWith('fallback-')),
    )
    if (allHaveRealPermissions) return roles

    return Promise.all(
      roles.map(async (role) => {
        // Already populated by the fallback — skip the extra HTTP call.
        if (role.permissions.length > 0) return role
        try {
          const { data: detailData } = await api.get<any>(
            API_ENDPOINTS.roles.detail(role.id),
          )
          const detail = toFrontendRole(detailData, role.userCount)
          return { ...role, permissions: detail.permissions }
        } catch (err) {
          console.warn(
            `[roleService.getRoles] detail fetch failed for ${role.id}`,
            err,
          )
          return role
        }
      }),
    )
  },

  async getRole(id: string): Promise<Role> {
    const { data } = await api.get<any>(API_ENDPOINTS.roles.detail(id))
    return toFrontendRole(data, 0, data?.name)
  },

  async getRoleMembers(roleId: string): Promise<{ users: any[] }> {
    try {
      const { data } = await api.get<any>(
        API_ENDPOINTS.roles.detail(roleId) + '/users',
      )
      return { users: Array.isArray(data) ? data : data?.users || [] }
    } catch (err) {
      console.warn(
        '[roleService.getRoleMembers] /users endpoint failed, falling back',
        err,
      )
      const { data } = await api.get<any>(
        `${API_ENDPOINTS.roles.detail(roleId)}/members`,
      )
      return { users: Array.isArray(data) ? data : data?.users || [] }
    }
  },

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    try {
      const { data } = await api.get<any>(API_ENDPOINTS.roles.detail(roleId))
      return extractPermissions(data, data?.name)
    } catch (err) {
      console.warn(
        `[roleService.getRolePermissions] /roles/${roleId} failed`,
        err,
      )
      return []
    }
  },
}