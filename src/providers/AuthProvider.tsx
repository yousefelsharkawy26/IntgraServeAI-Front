import React, { createContext, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import { mapBackendUserToFrontend } from '@/mappers/user.mapper'

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, logout, setLoading } = useAuthStore()

  useEffect(() => {
    const restoreSession = async () => {
      // If the user was marked as authenticated but we don't have an access token in memory (e.g. page refresh)
      if (isAuthenticated && !accessToken) {
        setLoading(true)
        try {
          // 1. Silent Refresh Call with Cookie
          const refreshResponse = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`,
            {},
            { withCredentials: true, timeout: 10000 }
          )

          const newAccessToken = refreshResponse.data.token

          // 2. Fetch User Profile
          const userResponse = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.users.me}`,
            {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
              timeout: 10000,
            }
          )

          const user = mapBackendUserToFrontend(userResponse.data)

          // 3. Update Zustand Store State
          useAuthStore.setState({
            accessToken: newAccessToken,
            user,
            isAuthenticated: true,
          })
        } catch (error) {
          console.error('Failed to restore session:', error)
          logout()
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    restoreSession()
  }, [isAuthenticated, accessToken, logout, setLoading])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}
