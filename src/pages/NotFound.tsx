import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4"
      aria-labelledby="error-heading"
    >
      <div className="text-center">
        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">404</p>
        <h1 
          id="error-heading" 
          className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2"
        >
          Page not found
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 
                     text-white font-medium rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     dark:focus:ring-offset-slate-950 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </main>
  )
}
