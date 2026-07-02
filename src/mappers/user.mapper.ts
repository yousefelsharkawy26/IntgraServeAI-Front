import type { User } from '@/types/auth'
import type { UserActivityLog } from '@/types/user'

export const mapBackendUserToFrontend = (u: any): User => {
  if (!u) return {} as User
  
  // Backend returns roles as list of role strings (e.g. ['Admin', 'Support User'])
  // Frontend expects role as a single string (e.g. 'Administrator', 'Manager', 'Support Agent')
  // We'll map backend role names to frontend role names
  let role = 'Viewer'
  if (u.roles && u.roles.length > 0) {
    const primaryRole = u.roles[0]
    if (primaryRole === 'Admin') role = 'Administrator'
    else if (primaryRole === 'Tech User') role = 'Manager' // maps to Manager or similar
    else if (primaryRole === 'Support User') role = 'Support Agent'
    else role = primaryRole
  } else if (u.role) {
    if (u.role === 'Admin') role = 'Administrator'
    else if (u.role === 'Tech User') role = 'Manager'
    else if (u.role === 'Support User') role = 'Support Agent'
    else role = u.role
  }

  return {
    id: String(u.id || ''),
    email: u.email || '',
    name: u.full_name || '',
    avatar: u.avatar || undefined,
    role,
    department: u.department || (role === 'Administrator' ? 'Engineering' : 'Support'),
    status: u.is_active ? 'active' : 'inactive',
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
