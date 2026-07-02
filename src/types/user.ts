import type { User } from './auth'

export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface UserFilters {
  search?: string
  status?: UserStatus | 'all'
  role?: string
  page: number
  limit: number
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  totalPages: number
}

export interface UserActivityLog {
  id: string
  userId: string
  action: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface UpdateProfileData {
  name?: string
  email?: string
  department?: string
  avatar?: string
}
