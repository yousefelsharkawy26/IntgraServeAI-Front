import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  setUser: (user: User | null) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  setLoading: (loading: boolean) => void
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          ...initialState,
          isLoading: false,
        }),

      setUser: (user) => set({ user }),

      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'integra-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // tokens kept in memory only — never persisted
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false)
      },
    }
  )
)