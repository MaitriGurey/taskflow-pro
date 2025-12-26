import { useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const authLogin = useAuthStore((state) => state.login)
  const authLogout = useAuthStore((state) => state.logout)
  const clearTasks = useTaskStore((state) => state.clearTasks)

  // Wrap logout to also clear task state
  const logout = useCallback(() => {
    clearTasks()
    authLogout()
  }, [clearTasks, authLogout])

  return {
    user,
    isAuthenticated: token !== null,
    isLoading: !hasHydrated,
    hasHydrated,
    login: authLogin,
    logout,
  }
}
