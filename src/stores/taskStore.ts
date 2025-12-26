import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Task, Subtask, ActivityLogEntry } from '../types'
import { getTasksForUser, saveTasks } from '../lib/db'

interface TaskState {
  tasks: Task[]
  past: Task[][]
  future: Task[][]
  isLoaded: boolean
  currentUserId: string | null
}

interface TaskActions {
  loadTasks: (userId: string) => Promise<void>
  clearTasks: () => void
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'activityLog'>) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  reorderTasks: (activeId: string, overId: string) => void
  reorderSubtasks: (taskId: string, activeId: string, overId: string) => void
  undo: () => void
  redo: () => void
}

type TaskStore = TaskState & TaskActions

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector((set, get) => {
    const saveToHistory = () => {
      const { tasks, past } = get()
      set({ past: [...past, tasks], future: [] })
    }

    const logActivity = (task: Task, action: string): Task => {
      const entry: ActivityLogEntry = {
        id: crypto.randomUUID(),
        action,
        timestamp: Date.now(),
      }
      return { ...task, activityLog: [...task.activityLog, entry] }
    }

    return {
      tasks: [],
      past: [],
      future: [],
      isLoaded: false,
      currentUserId: null,

      loadTasks: async (userId: string) => {
        set({ currentUserId: userId })
        const tasks = await getTasksForUser(userId)
        set({ tasks, isLoaded: true, past: [], future: [] })
      },

      clearTasks: () => {
        set({
          tasks: [],
          past: [],
          future: [],
          isLoaded: false,
          currentUserId: null,
        })
      },

      addTask: (taskData) => {
        saveToHistory()
        const task: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          activityLog: [
            {
              id: crypto.randomUUID(),
              action: 'Task created',
              timestamp: Date.now(),
            },
          ],
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
      },

      updateTask: (id, updates) => {
        saveToHistory()
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? logActivity({ ...task, ...updates }, 'Task updated') : task
          ),
        }))
      },

      deleteTask: (id) => {
        saveToHistory()
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
      },

      toggleComplete: (id) => {
        saveToHistory()
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) return task
            const completed = !task.completed
            return logActivity(
              { ...task, completed },
              completed ? 'Marked complete' : 'Marked incomplete'
            )
          }),
        }))
      },

      addSubtask: (taskId, title) => {
        saveToHistory()
        const subtask: Subtask = {
          id: crypto.randomUUID(),
          title,
          completed: false,
        }
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? logActivity(
                  { ...task, subtasks: [...task.subtasks, subtask] },
                  `Added subtask: ${title}`
                )
              : task
          ),
        }))
      },

      toggleSubtask: (taskId, subtaskId) => {
        saveToHistory()
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task
            return logActivity(
              {
                ...task,
                subtasks: task.subtasks.map((st) =>
                  st.id === subtaskId ? { ...st, completed: !st.completed } : st
                ),
              },
              'Subtask toggled'
            )
          }),
        }))
      },

      deleteSubtask: (taskId, subtaskId) => {
        saveToHistory()
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? logActivity(
                  { ...task, subtasks: task.subtasks.filter((st) => st.id !== subtaskId) },
                  'Subtask deleted'
                )
              : task
          ),
        }))
      },

      reorderTasks: (activeId, overId) => {
        if (activeId === overId) return
        saveToHistory()
        set((state) => {
          const oldIndex = state.tasks.findIndex((t) => t.id === activeId)
          const newIndex = state.tasks.findIndex((t) => t.id === overId)
          if (oldIndex === -1 || newIndex === -1) return state

          const newTasks = [...state.tasks]
          const [removed] = newTasks.splice(oldIndex, 1)
          newTasks.splice(newIndex, 0, removed)
          return { tasks: newTasks }
        })
      },

      reorderSubtasks: (taskId, activeId, overId) => {
        if (activeId === overId) return
        saveToHistory()
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task

            const oldIndex = task.subtasks.findIndex((s) => s.id === activeId)
            const newIndex = task.subtasks.findIndex((s) => s.id === overId)
            if (oldIndex === -1 || newIndex === -1) return task

            const newSubtasks = [...task.subtasks]
            const [removed] = newSubtasks.splice(oldIndex, 1)
            newSubtasks.splice(newIndex, 0, removed)
            return { ...task, subtasks: newSubtasks }
          }),
        }))
      },

      undo: () => {
        const { past, tasks, future } = get()
        if (past.length === 0) return

        const previous = past[past.length - 1]
        set({
          tasks: previous,
          past: past.slice(0, -1),
          future: [tasks, ...future],
        })
      },

      redo: () => {
        const { past, tasks, future } = get()
        if (future.length === 0) return

        const next = future[0]
        set({
          tasks: next,
          past: [...past, tasks],
          future: future.slice(1),
        })
      },
    }
  })
)

// Persist to IndexedDB on changes (debounced)
let persistTimeout: ReturnType<typeof setTimeout> | null = null

useTaskStore.subscribe(
  (state) => state.tasks,
  (tasks, prevTasks) => {
    const { currentUserId, isLoaded } = useTaskStore.getState()
    
    // Only persist if we have a user, tasks are loaded, and tasks actually changed
    if (!currentUserId || !isLoaded || tasks === prevTasks) return

    if (persistTimeout) clearTimeout(persistTimeout)
    persistTimeout = setTimeout(() => {
      // Double-check user is still logged in before persisting
      const currentState = useTaskStore.getState()
      if (currentState.currentUserId) {
        saveTasks(currentState.currentUserId, currentState.tasks)
      }
    }, 300)
  }
)
