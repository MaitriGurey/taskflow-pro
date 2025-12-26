import { useState, useId, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const emailId = useId()
  const statusId = useId()

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthLoading, isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || isLoading) return

    setIsLoading(true)
    try {
      await login(email)
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm" role="region" aria-labelledby="login-heading">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 id="login-heading" className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Sign in to TaskFlow
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage your tasks with ease
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5" aria-describedby={statusId}>
            <div>
              <label
                htmlFor={emailId}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 
                           rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
                           transition-shadow"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                         dark:focus:ring-offset-slate-900
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>

            <div id={statusId} aria-live="polite" className="sr-only">
              {isLoading ? 'Signing in, please wait...' : ''}
            </div>
          </form>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Demo app — enter any email to continue
        </p>
      </div>
    </main>
  )
}
