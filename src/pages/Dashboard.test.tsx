import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, resetStores } from '../test/utils'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'

vi.mock('../lib/db', () => ({
  initDB: vi.fn().mockResolvedValue(true),
  getTasksForUser: vi.fn().mockResolvedValue([]),
  saveTasks: vi.fn().mockResolvedValue(true),
}))

describe('Dashboard', () => {
  beforeEach(() => {
    resetStores()
    useAuthStore.setState({
      user: { id: 'user-1', email: 'test@example.com' },
      token: 'fake-token',
      hasHydrated: true,
    })
    useTaskStore.setState({ isLoaded: true, currentUserId: 'user-1' })
  })

  describe('Creating tasks', () => {
    it('renders empty state when no tasks exist', () => {
      render(<Dashboard />)
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
    })

    it('allows user to create a task', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      const input = screen.getByLabelText(/new task title/i)
      await user.type(input, 'Buy groceries')
      await user.click(screen.getByRole('button', { name: /add task/i }))

      expect(screen.getByText('Buy groceries')).toBeInTheDocument()
      expect(input).toHaveValue('')
    })

    it('creates task on Enter key', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      const input = screen.getByLabelText(/new task title/i)
      await user.type(input, 'Call mom{enter}')

      expect(screen.getByText('Call mom')).toBeInTheDocument()
    })

    it('does not create empty tasks', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      await user.click(screen.getByRole('button', { name: /add task/i }))

      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
    })
  })

  describe('Filtering tasks', () => {
    beforeEach(() => {
      useTaskStore.setState({
        isLoaded: true,
        currentUserId: 'user-1',
        tasks: [
          {
            id: '1',
            title: 'Active task',
            description: '',
            completed: false,
            priority: 'high',
            tags: ['work'],
            dueDate: null,
            subtasks: [],
            createdAt: Date.now(),
            activityLog: [],
          },
          {
            id: '2',
            title: 'Completed task',
            description: 'With description',
            completed: true,
            priority: 'low',
            tags: [],
            dueDate: null,
            subtasks: [],
            createdAt: Date.now() - 1000,
            activityLog: [],
          },
        ],
      })
    })

    it('shows all tasks by default', () => {
      render(<Dashboard />)

      expect(screen.getByText('Active task')).toBeInTheDocument()
      expect(screen.getByText('Completed task')).toBeInTheDocument()
    })

    it('filters by status', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      await user.selectOptions(screen.getByLabelText(/filter by status/i), 'completed')

      expect(screen.queryByText('Active task')).not.toBeInTheDocument()
      expect(screen.getByText('Completed task')).toBeInTheDocument()
    })

    it('searches by title', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      await user.type(screen.getByLabelText(/search tasks/i), 'active')

      expect(screen.getByText('Active task')).toBeInTheDocument()
      expect(screen.queryByText('Completed task')).not.toBeInTheDocument()
    })
  })

  describe('Task interactions', () => {
    beforeEach(() => {
      useTaskStore.setState({
        isLoaded: true,
        currentUserId: 'user-1',
        tasks: [
          {
            id: '1',
            title: 'Test task',
            description: '',
            completed: false,
            priority: 'medium',
            tags: [],
            dueDate: null,
            subtasks: [],
            createdAt: Date.now(),
            activityLog: [],
          },
        ],
      })
    })

    it('can toggle task completion', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      const checkbox = screen.getByRole('checkbox', { name: /mark "test task"/i })
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()
    })
  })

  describe('Undo/Redo', () => {
    it('undoes task creation', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      await user.type(screen.getByLabelText(/new task title/i), 'New task{enter}')
      expect(screen.getByText('New task')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /undo/i }))
      expect(screen.queryByText('New task')).not.toBeInTheDocument()
    })

    it('redoes after undo', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      await user.type(screen.getByLabelText(/new task title/i), 'New task{enter}')
      await user.click(screen.getByRole('button', { name: /undo/i }))
      await user.click(screen.getByRole('button', { name: /redo/i }))

      expect(screen.getByText('New task')).toBeInTheDocument()
    })
  })
})

