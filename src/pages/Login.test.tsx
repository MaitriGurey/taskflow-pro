import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, resetStores } from '../test/utils'
import userEvent from '@testing-library/user-event'
import Login from './Login'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login', () => {
  beforeEach(() => {
    resetStores()
    mockNavigate.mockClear()
  })

  it('renders login form with email input', () => {
    render(<Login />)

    expect(screen.getByRole('heading', { name: /sign in to taskflow/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('allows user to type email', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'test@example.com')

    expect(emailInput).toHaveValue('test@example.com')
  })

  it('submits form and redirects to dashboard', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // Button should show loading text (the login has a 500ms delay)
    expect(screen.getByRole('button')).toHaveTextContent(/signing in/i)
  })

  it('submits form on Enter key', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'test@example.com{enter}')

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('does not submit with empty email', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

