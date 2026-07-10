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

const DISPLAY_TO_BACKEND_ROLE: Record<string, string> = {
  Administrator: 'Admin',
  Manager: 'Tech User',
  'Support Agent': 'Support User',
}

const migrateUserRoles = (user: User | null): User | null => {
  if (!user) return user
  if (Array.isArray(user.roles) && user.roles.length > 0) return user

  const fallbackRole = DISPLAY_TO_BACKEND_ROLE[user.role] || user.role || 'Viewer'
  return {
    ...user,
    roles: [fallbackRole],
  }
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,

      login: (user, accessToken, refreshToken) =>
        set({
          user: migrateUserRoles(user),
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

      setUser: (user) => set({ user: migrateUserRoles(user) }),

      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'integra-auth',
      partialize: (state) => ({
        user: migrateUserRoles(state.user),
        isAuthenticated: state.isAuthenticated,
        // tokens kept in memory only — never persisted
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.setUser(state.user)
        }
        state?.setLoading(false)
      },
    }
  )
)
