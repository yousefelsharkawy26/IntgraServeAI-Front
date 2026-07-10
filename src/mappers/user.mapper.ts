import type { User } from '@/types/auth'
import type { UserActivityLog } from '@/types/user'

const ROLE_DISPLAY_NAME: Record<string, string> = {
  Admin: 'Administrator',
  'Tech User': 'Manager',
  'Support User': 'Support Agent',
}

export const mapBackendRoleToDisplayRole = (role: string): string => ROLE_DISPLAY_NAME[role] || role

const normalizeRoles = (u: any): string[] => {
  if (Array.isArray(u?.roles)) {
    return u.roles.filter((role: unknown): role is string => typeof role === 'string' && role.trim().length > 0)
  }

  if (typeof u?.role === 'string' && u.role.trim().length > 0) {
    return [u.role]
  }

  return []
}

export const mapBackendUserToFrontend = (u: any): User => {
  if (!u) return {} as User

  const roles = normalizeRoles(u)
  const primaryRole = roles[0] || 'Viewer'
  const role = mapBackendRoleToDisplayRole(primaryRole)

  return {
    id: String(u.id || ''),
    email: u.email || '',
    name: u.full_name || u.name || '',
    avatar: u.avatar || undefined,
    role,
    roles,
    department: u.department || (role === 'Administrator' ? 'Engineering' : 'Support'),
    status: u.is_active === false ? 'inactive' : 'active',
    createdAt: u.created_at || '',
    updatedAt: u.updated_at || '',
  }
}

export const mapBackendLogToFrontend = (log: any): UserActivityLog => {
  if (!log) return {} as UserActivityLog
  
  // Flatten / stringify changed values
  let details = ''
  if (log.changed_values) {
    try {
      details = typeof log.changed_values === 'string' 
        ? log.changed_values 
        : JSON.stringify(log.changed_values)
    } catch {
      details = String(log.changed_values)
    }
  }

  return {
    id: String(log.id || ''),
    userId: String(log.user_id || ''),
    action: log.action_type || 'UPDATE',
    details: details || undefined,
    ipAddress: log.ip_address || undefined,
    userAgent: log.user_agent || undefined,
    createdAt: log.created_at || '',
  }
}
