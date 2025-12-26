import type { ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'

function Providers({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options })
}

export function resetStores() {
  useAuthStore.setState({ user: null, token: null, hasHydrated: true })
  useTaskStore.setState({
    tasks: [],
    past: [],
    future: [],
    isLoaded: false,
    currentUserId: null,
  })
}

export * from '@testing-library/react'
export { customRender as render }
