export interface Permission {
  id: string
  name: string
  key: string
  description: string
  module: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface RoleFilters {
  search?: string
}
