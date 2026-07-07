import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import { mapBackendUserToFrontend, mapBackendLogToFrontend } from '@/mappers/user.mapper'
import type { User, UserListResponse, UserFilters, UpdateProfileData, ChangePasswordData, UserActivityLog } from '@/types'

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  roles_id: string[]
}

export interface UpdateUserBasicInfo {
  email?: string
  full_name?: string
}

export interface UpdateUserPasswordData {
  new_password: string
}

export interface UpdateUserRolesData {
  roles_id: string[]
}

export interface BulkUserOperationData {
  user_ids: string[]
}

export interface BulkOperationResult {
  message: string
  total_requested: number
  successful: number
  failed: number
  errors?: Array<{ user_id: string; error: string }>
}

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<any>(API_ENDPOINTS.users.me)
    return mapBackendUserToFrontend(data)
  },

  async updateMe(data: UpdateProfileData): Promise<User> {
    const backendData: Record<string, unknown> = {}
    if (data.name !== undefined) backendData.full_name = data.name
    if (data.email !== undefined) backendData.email = data.email
    if (data.avatar !== undefined) backendData.avatar = data.avatar
    // Previously dropped — EditProfileModal sends department but the service
    // never forwarded it. Always send when present.
    if (data.department !== undefined) backendData.department = data.department
    const { data: response } = await api.patch<any>(API_ENDPOINTS.users.me, backendData)
    return mapBackendUserToFrontend(response)
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const { data: response } = await api.patch<{ message: string }>(API_ENDPOINTS.users.mePassword, data)
    return response
  },

  async getMyLogs(page = 1, limit = 10): Promise<{ logs: UserActivityLog[]; total: number }> {
    const { data } = await api.get<{ logs: any[]; total: number }>(
      `${API_ENDPOINTS.users.meLogs}?page=${page}&limit=${limit}`
    )
    return {
      logs: (data.logs || []).map(mapBackendLogToFrontend),
      total: data.total || 0,
    }
  },

  async getUsers(filters: UserFilters): Promise<UserListResponse> {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.role) params.append('role', filters.role)
    params.append('page', String(filters.page))
    params.append('limit', String(filters.limit))

    const { data } = await api.get<any>(`${API_ENDPOINTS.users.list}?${params.toString()}`)
    return {
      users: (data.users || []).map(mapBackendUserToFrontend),
      total: data.total || 0,
      page: data.page || filters.page,
      totalPages: data.total_pages || Math.ceil((data.total || 0) / filters.limit),
    }
  },

  async getUser(id: string): Promise<User> {
    const { data } = await api.get<any>(API_ENDPOINTS.users.detail(id))
    return mapBackendUserToFrontend(data)
  },

  async createUser(data: CreateUserData): Promise<{ message: string }> {
    const { data: response } = await api.post<{ message: string }>(API_ENDPOINTS.users.list, data)
    return response
  },

  async updateUserBasicInfo(id: string, data: UpdateUserBasicInfo): Promise<{ message: string }> {
    const { data: response } = await api.patch<{ message: string }>(API_ENDPOINTS.users.detail(id), data)
    return response
  },

  async updateUserPassword(id: string, data: UpdateUserPasswordData): Promise<{ message: string }> {
    const { data: response } = await api.patch<{ message: string }>(
      `${API_ENDPOINTS.users.detail(id)}/password`,
      data
    )
    return response
  },

  async updateUserRoles(id: string, data: UpdateUserRolesData): Promise<{ message: string }> {
    const { data: response } = await api.patch<{ message: string }>(
      `${API_ENDPOINTS.users.detail(id)}/roles`,
      data
    )
    return response
  },

  async bulkActivateUsers(data: BulkUserOperationData): Promise<BulkOperationResult> {
    const { data: response } = await api.patch<BulkOperationResult>('/users/bulk/activate', data)
    return response
  },

  async bulkDeactivateUsers(data: BulkUserOperationData): Promise<BulkOperationResult> {
    const { data: response } = await api.patch<BulkOperationResult>('/users/bulk/deactivate', data)
    return response
  },

  async getUserLogs(userId: string, page = 1, limit = 10): Promise<{ logs: UserActivityLog[]; total: number }> {
    const { data } = await api.get<{ logs: any[]; total: number }>(
      `${API_ENDPOINTS.users.detail(userId)}/logs?page=${page}&limit=${limit}`
    )
    return {
      logs: (data.logs || []).map(mapBackendLogToFrontend),
      total: data.total || 0,
    }
  },
}