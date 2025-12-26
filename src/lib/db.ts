import { openDB, type IDBPDatabase } from 'idb'
import type { Task } from '../types'

const DB_NAME = 'taskflow'
const DB_VERSION = 1
const TASKS_STORE = 'tasks'

interface TaskFlowDB {
  tasks: {
    key: string
    value: Task & { userId: string }
    indexes: { userId: string }
  }
}

let db: IDBPDatabase<TaskFlowDB> | null = null
let initPromise: Promise<boolean> | null = null

export async function initDB(): Promise<boolean> {
  // Return existing promise if already initializing
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      db = await openDB<TaskFlowDB>(DB_NAME, DB_VERSION, {
        upgrade(database) {
          if (!database.objectStoreNames.contains(TASKS_STORE)) {
            const store = database.createObjectStore(TASKS_STORE, { keyPath: 'id' })
            store.createIndex('userId', 'userId')
          }
        },
      })
      return true
    } catch (error) {
      console.error('Failed to initialize database:', error)
      return false
    }
  })()

  return initPromise
}

export async function getTasksForUser(userId: string): Promise<Task[]> {
  // Ensure DB is initialized before querying
  if (!db) {
    const success = await initDB()
    if (!success || !db) return []
  }

  try {
    const tasks = await db.getAllFromIndex(TASKS_STORE, 'userId', userId)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return tasks.map(({ userId: _userId, ...task }) => task)
  } catch (error) {
    console.error('Failed to get tasks:', error)
    return []
  }
}

export async function saveTasks(userId: string, tasks: Task[]): Promise<boolean> {
  // Ensure DB is initialized before saving
  if (!db) {
    const success = await initDB()
    if (!success || !db) return false
  }

  try {
    // First, get existing tasks outside the write transaction
    const existingTasks = await db.getAllFromIndex(TASKS_STORE, 'userId', userId)
    const existingIds = new Set(existingTasks.map((t) => t.id))
    const newIds = new Set(tasks.map((t) => t.id))

    // Identify tasks to delete
    const deletedIds = [...existingIds].filter((id) => !newIds.has(id))

    // Now perform the write transaction
    const tx = db.transaction(TASKS_STORE, 'readwrite')
    const store = tx.store

    // Delete tasks that no longer exist
    for (const id of deletedIds) {
      store.delete(id)
    }

    // Put all current tasks
    for (const task of tasks) {
      store.put({ ...task, userId })
    }

    await tx.done
    return true
  } catch (error) {
    console.error('Failed to save tasks:', error)
    return false
  }
}
