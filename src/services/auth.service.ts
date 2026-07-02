import api from './api'
import { API_ENDPOINTS } from '@/constants/api'
import { useAuthStore } from '@/store/authStore'
import { mapBackendUserToFrontend } from '@/mappers/user.mapper'
import type { LoginCredentials, LoginResponse, RefreshResponse, ForgotPasswordData, ResetPasswordData } from '@/types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // 1. Submit credentials to login endpoint
    const { data } = await api.post<{ token: string }>(API_ENDPOINTS.auth.login, credentials)

    // 2. Set accessToken in memory store so subsequent api call has it in headers
    useAuthStore.getState().updateTokens(data.token, '')

    // 3. Fetch user profile from /users/me
    const { data: userBackend } = await api.get(API_ENDPOINTS.users.me)

    // 4. Map backend user info to frontend model
    const user = mapBackendUserToFrontend(userBackend)

    return {
      accessToken: data.token,
      refreshToken: '',
      user,
    }
  },

  async refresh(): Promise<RefreshResponse> {
    const { data } = await api.post<{ token: string }>(API_ENDPOINTS.auth.refresh)
    return {
      accessToken: data.token,
      refreshToken: '',
    }
  },

  async logout(): Promise<void> {
    await api.get(API_ENDPOINTS.auth.logout)
  },

  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const { data: response } = await api.post<{ message: string }>(API_ENDPOINTS.auth.forgotPassword, data)
    return response
  },

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const { data: response } = await api.post<{ message: string }>(
      `${API_ENDPOINTS.auth.resetPassword}?token=${encodeURIComponent(data.token)}`,
      { new_password: data.password }
    )

    console.log(data)

    return response
  },
}
