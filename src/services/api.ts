import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api'

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true, // Crucial: enables passing/receiving HTTP-only cookies cross-origin
})

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          resolve(api(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      // Direct call to refresh endpoint. Axios automatically carries the refresh_token cookie
      // when withCredentials is set to true.
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`, {}, {
        withCredentials: true,
      })

      const { token: accessToken } = response.data
      useAuthStore.getState().updateTokens(accessToken, '')

      onTokenRefreshed(accessToken)

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
      }
      return api(originalRequest)
    } catch (refreshError) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
