import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  hasHydrated: boolean
  login: (email: string) => Promise<void>
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,

      login: async (email: string) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        const user: User = {
          id: crypto.randomUUID(),
          email,
        }
        set({ user, token: `fake-jwt-${Date.now()}` })
      },

      logout: () => {
        set({ user: null, token: null })
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
