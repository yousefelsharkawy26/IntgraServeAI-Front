export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  department?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
