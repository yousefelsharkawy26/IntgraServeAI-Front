import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import type { Role } from '@/types/role'

export const roleService = {
  async getMyRoles(): Promise<Role[]> {
    const { data } = await api.get<any>(API_ENDPOINTS.roles.me)
    const roles = (data.roles || []).map((r: any) => ({
      id: String(r.id),
      name: r.name === 'Admin' ? 'Administrator' : r.name === 'Tech User' ? 'Manager' : r.name === 'Support User' ? 'Support Agent' : r.name,
      description: '',
      permissions: [],
      userCount: 0,
      createdAt: '',
      updatedAt: '',
    }))
    return roles
  },

  async getRoles(): Promise<Role[]> {
    try {
      const { data: statsData } = await api.get<any>('/roles/statistics')
      const statsMap = new Map<string, number>()
      if (statsData.roles) {
        statsData.roles.forEach((r: any) => {
          statsMap.set(String(r.id), r.user_count || 0)
        })
      }

      const { data } = await api.get<any>(API_ENDPOINTS.roles.list)
      const rolesList = Array.isArray(data) ? data : (data?.roles || [])
      const roles = rolesList.map((r: any) => {
        let frontendName = r.name
        let description = r.description || ''
        let permissions: any[] = []

        if (r.name === 'Admin') {
          frontendName = 'Administrator'
          description = description || 'Full access to all features and settings. Can manage users, roles, system configuration, and view all data.'
          permissions = [
            { id: '1', name: 'View Tickets', key: 'tickets.view', description: 'View all tickets', module: 'tickets' },
            { id: '2', name: 'Edit Tickets', key: 'tickets.edit', description: 'Edit and manage tickets', module: 'tickets' },
            { id: '3', name: 'Delete Tickets', key: 'tickets.delete', description: 'Delete tickets', module: 'tickets' },
            { id: '4', name: 'Manage Users', key: 'users.manage', description: 'Create, edit, delete users', module: 'users' },
            { id: '5', name: 'Manage Roles', key: 'roles.manage', description: 'Create and assign roles', module: 'roles' },
            { id: '6', name: 'Configure AI', key: 'ai.configure', description: 'Manage AI actions and settings', module: 'ai' },
            { id: '7', name: 'View Backups', key: 'backups.view', description: 'View and restore backups', module: 'backups' },
            { id: '8', name: 'System Settings', key: 'system.settings', description: 'Modify system configuration', module: 'system' },
          ]
        } else if (r.name === 'Tech User') {
          frontendName = 'Manager'
          description = description || 'Can view and manage tickets, users, and actions. Cannot modify system settings or roles.'
          permissions = [
            { id: '1', name: 'View Tickets', key: 'tickets.view', description: 'View all tickets', module: 'tickets' },
            { id: '2', name: 'Edit Tickets', key: 'tickets.edit', description: 'Edit and manage tickets', module: 'tickets' },
            { id: '4', name: 'Manage Users', key: 'users.manage', description: 'Create, edit users', module: 'users' },
            { id: '6', name: 'Configure AI', key: 'ai.configure', description: 'Manage AI actions', module: 'ai' },
            { id: '7', name: 'View Backups', key: 'backups.view', description: 'View backups', module: 'backups' },
          ]
        } else if (r.name === 'Support User') {
          frontendName = 'Support Agent'
          description = description || 'Can view and edit assigned tickets. Can view actions but cannot modify them.'
          permissions = [
            { id: '1', name: 'View Tickets', key: 'tickets.view', description: 'View assigned tickets', module: 'tickets' },
            { id: '2', name: 'Edit Tickets', key: 'tickets.edit', description: 'Edit assigned tickets', module: 'tickets' },
          ]
        } else if (r.name === 'Viewer') {
          description = description || 'Read-only access to tickets and basic dashboard metrics.'
          permissions = [
            { id: '1', name: 'View Tickets', key: 'tickets.view', description: 'View tickets', module: 'tickets' },
          ]
        }

        const roleId = String(r.id)
        return {
          id: roleId,
          name: frontendName,
          description,
          permissions,
          userCount: statsMap.get(roleId) || 0,
          createdAt: r.created_at || '',
          updatedAt: r.created_at || '',
        }
      })
      return roles
    } catch {
      const { data } = await api.get<any>(API_ENDPOINTS.roles.list)
      const rolesList = Array.isArray(data) ? data : (data?.roles || [])
      return rolesList.map((r: any) => ({
        id: String(r.id),
        name: r.name === 'Admin' ? 'Administrator' : r.name === 'Tech User' ? 'Manager' : r.name === 'Support User' ? 'Support Agent' : r.name,
        description: r.description || '',
        permissions: [],
        userCount: 0,
        createdAt: r.created_at || '',
        updatedAt: r.created_at || '',
      }))
    }
  },

  async getRole(id: string): Promise<Role> {
    const { data } = await api.get<any>(API_ENDPOINTS.roles.detail(id))
    return {
      id: String(data.id),
      name: data.name === 'Admin' ? 'Administrator' : data.name === 'Tech User' ? 'Manager' : data.name === 'Support User' ? 'Support Agent' : data.name,
      description: data.description || '',
      permissions: [],
      userCount: 0,
      createdAt: data.created_at || '',
      updatedAt: data.created_at || '',
    }
  },
}
