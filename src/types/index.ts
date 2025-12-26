export interface User {
  id: string
  email: string
}

export type Priority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface ActivityLogEntry {
  id: string
  action: string
  timestamp: number
}

export interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  tags: string[]
  dueDate: number | null
  subtasks: Subtask[]
  createdAt: number
  activityLog: ActivityLogEntry[]
}
