import { useEffect, useState, useMemo, useId, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../hooks/useAuth'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useTaskStore } from '../stores/taskStore'
import type { Task, Priority, Subtask } from '../types'

type StatusFilter = 'all' | 'active' | 'completed'
type DueDateFilter = 'all' | 'overdue' | 'today' | 'week' | 'later' | 'none'
type SortBy = 'createdAt' | 'dueDate' | 'priority'
type SortOrder = 'asc' | 'desc'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { undo, redo, canUndo, canRedo } = useUndoRedo()

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])
  const {
    tasks,
    isLoaded,
    loadTasks,
    addTask,
    deleteTask,
    toggleComplete,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTasks,
    reorderSubtasks,
  } = useTaskStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all')

  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [filterTimestamp, setFilterTimestamp] = useState(() => Date.now())

  useEffect(() => {
    if (user && !isLoaded) {
      loadTasks(user.id)
    }
  }, [user, isLoaded, loadTasks])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    tasks.forEach((task) => task.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const matchesDueDateFilter = (dueDate: number | null): boolean => {
      if (dueDateFilter === 'all') return true
      if (dueDateFilter === 'none') return dueDate === null
      if (dueDate === null) return false

      const now = filterTimestamp
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const startOfToday = todayStart.getTime()
      const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1
      const endOfWeek = startOfToday + 7 * 24 * 60 * 60 * 1000

      switch (dueDateFilter) {
        case 'overdue':
          return dueDate < now
        case 'today':
          return dueDate >= startOfToday && dueDate <= endOfToday
        case 'week':
          return dueDate >= now && dueDate <= endOfWeek
        case 'later':
          return dueDate > endOfWeek
        default:
          return true
      }
    }

    return tasks.filter((task) => {
      if (search) {
        const query = search.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(query)
        const matchesDesc = task.description.toLowerCase().includes(query)
        if (!matchesTitle && !matchesDesc) return false
      }

      if (statusFilter === 'active' && task.completed) return false
      if (statusFilter === 'completed' && !task.completed) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      if (tagFilter !== 'all' && !task.tags.includes(tagFilter)) return false
      if (!matchesDueDateFilter(task.dueDate)) return false

      return true
    })
  }, [tasks, search, statusFilter, priorityFilter, tagFilter, dueDateFilter, filterTimestamp])

  const sortedTasks = useMemo(() => {
    const priorityWeight: Record<Priority, number> = { low: 1, medium: 2, high: 3 }

    return [...filteredTasks].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'priority':
          comparison = priorityWeight[a.priority] - priorityWeight[b.priority]
          break
        case 'dueDate': {
          const aDate = a.dueDate ?? Infinity
          const bDate = b.dueDate ?? Infinity
          comparison = aDate - bDate
          break
        }
        case 'createdAt':
        default:
          comparison = a.createdAt - b.createdAt
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }, [filteredTasks, sortBy, sortOrder])

  const hasActiveFilters =
    search !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    tagFilter !== 'all' ||
    dueDateFilter !== 'all'

  const canReorder = !hasActiveFilters && sortBy === 'createdAt' && sortOrder === 'desc'

  const clearFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setTagFilter('all')
    setDueDateFilter('all')
  }, [])

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    addTask({
      title: newTaskTitle.trim(),
      description: '',
      completed: false,
      priority: newTaskPriority,
      tags: [],
      dueDate: newTaskDueDate ? new Date(newTaskDueDate).getTime() : null,
      subtasks: [],
    })
    setNewTaskTitle('')
    setNewTaskPriority('medium')
    setNewTaskDueDate('')
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    reorderTasks(String(active.id), String(over.id))
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-700 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <a
        href="#task-list"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:z-50"
      >
        Skip to task list
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">TaskFlow</h1>
            </div>

            <nav aria-label="Actions" className="flex items-center gap-2">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden" role="group" aria-label="History">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                  title="Undo (Ctrl+Z)"
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 
                             hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed
                             focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                  title="Redo (Ctrl+Shift+Z)"
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 
                             hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed
                             focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
              
              <span className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                {user?.email}
              </span>
              
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                           px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Sign out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Create task form */}
        <form onSubmit={handleCreateTask} className="mb-6" aria-label="Create new task">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex gap-3">
              <label htmlFor="new-task" className="sr-only">New task title</label>
              <input
                id="new-task"
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg
                           text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                           dark:focus:ring-offset-slate-900 transition-colors"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <label htmlFor="new-task-priority" className="text-sm text-slate-500 dark:text-slate-400">
                  Priority
                </label>
                <select
                  id="new-task-priority"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-sm
                             text-slate-700 dark:text-slate-300
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="new-task-due" className="text-sm text-slate-500 dark:text-slate-400">
                  Due
                </label>
                <input
                  id="new-task-due"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-sm
                             text-slate-700 dark:text-slate-300
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Filters */}
        <section
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm"
          aria-label="Filter and sort tasks"
        >
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <label htmlFor="search-tasks" className="sr-only">Search tasks</label>
              <input
                id="search-tasks"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg
                           text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 
                           hover:text-slate-900 dark:hover:text-slate-200
                           hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Done' },
              ]}
            />

            <FilterSelect
              label="Priority"
              value={priorityFilter}
              onChange={(v) => setPriorityFilter(v as Priority | 'all')}
              options={[
                { value: 'all', label: 'All' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />

            <FilterSelect
              label="Due"
              value={dueDateFilter}
              onChange={(v) => {
                setDueDateFilter(v as DueDateFilter)
                setFilterTimestamp(Date.now())
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This week' },
                { value: 'later', label: 'Later' },
                { value: 'none', label: 'No date' },
              ]}
            />

            {allTags.length > 0 && (
              <FilterSelect
                label="Tag"
                value={tagFilter}
                onChange={setTagFilter}
                options={[
                  { value: 'all', label: 'All' },
                  ...allTags.map((tag) => ({ value: tag, label: tag })),
                ]}
              />
            )}

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <FilterSelect
                label="Sort"
                value={sortBy}
                onChange={(v) => setSortBy(v as SortBy)}
                options={[
                  { value: 'createdAt', label: 'Created' },
                  { value: 'dueDate', label: 'Due date' },
                  { value: 'priority', label: 'Priority' },
                ]}
              />
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                           hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Task list */}
        <section id="task-list" aria-label="Task list" aria-live="polite">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-16" role="status">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">
                {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {tasks.length === 0 ? 'Create your first task to get started' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2" role="list" aria-label={`${sortedTasks.length} tasks`}>
                  {sortedTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      canReorder={canReorder}
                      onToggle={() => toggleComplete(task.id)}
                      onDelete={() => deleteTask(task.id)}
                      onAddSubtask={(title) => addSubtask(task.id, title)}
                      onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                      onDeleteSubtask={(subtaskId) => deleteSubtask(task.id, subtaskId)}
                      onReorderSubtasks={(activeId, overId) =>
                        reorderSubtasks(task.id, activeId, overId)
                      }
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>

        {tasks.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 text-center" aria-live="polite">
            {sortedTasks.length} of {tasks.length} tasks
          </p>
        )}
      </main>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const selectId = useId()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-sm
                   text-slate-700 dark:text-slate-300
                   focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function SortableTaskItem({
  task,
  canReorder,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
}: {
  task: Task
  canReorder: boolean
  onToggle: () => void
  onDelete: () => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (subtaskId: string) => void
  onDeleteSubtask: (subtaskId: string) => void
  onReorderSubtasks: (activeId: string, overId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const hasSubtasks = task.subtasks.length > 0

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    onAddSubtask(newSubtaskTitle.trim())
    setNewSubtaskTitle('')
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorderSubtasks(String(active.id), String(over.id))
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm
                  ${task.completed 
                    ? 'border-slate-200 dark:border-slate-800' 
                    : 'border-slate-200 dark:border-slate-800'}`}
    >
      <div className="p-4 flex items-start gap-3">
        {canReorder && (
          <button
            {...attributes}
            {...listeners}
            type="button"
            className="mt-0.5 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500 
                       focus:outline-none focus:text-slate-500 rounded"
            aria-label="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
            </svg>
          </button>
        )}
        
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggle}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          className="mt-1 w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 
                     text-primary-600 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer
                     checked:bg-primary-600 checked:border-primary-600"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/tasks/${task.id}`}
              className={`font-medium hover:text-primary-600 dark:hover:text-primary-400 
                         focus:outline-none focus:text-primary-600 ${
                task.completed 
                  ? 'text-slate-400 dark:text-slate-500 line-through' 
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </Link>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.dueDate && <DueDateBadge dueDate={task.dueDate} completed={task.completed} />}
              <PriorityBadge priority={task.priority} />
              <button
                onClick={onDelete}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded
                           focus:outline-none focus:ring-2 focus:ring-red-500 opacity-0 group-hover:opacity-100
                           hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label={`Delete task "${task.title}"`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={`subtasks-${task.id}`}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 
                         focus:outline-none focus:text-primary-600 flex items-center gap-1"
            >
              {hasSubtasks ? (
                <>
                  <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add subtask
                </>
              )}
            </button>
            
            {task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">+{task.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div
          id={`subtasks-${task.id}`}
          className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3"
          role="region"
          aria-label={`Subtasks for ${task.title}`}
        >
          {hasSubtasks && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSubtaskDragEnd}
            >
              <SortableContext
                items={task.subtasks.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1 mb-3" role="list" aria-label="Subtasks">
                  {task.subtasks.map((subtask) => (
                    <SortableSubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={() => onToggleSubtask(subtask.id)}
                      onDelete={() => onDeleteSubtask(subtask.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
          
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a subtask..."
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                         rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </li>
  )
}

function SortableSubtaskItem({
  subtask,
  onToggle,
  onDelete,
}: {
  subtask: Subtask
  onToggle: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 py-1 group">
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-400 
                   focus:outline-none rounded"
        aria-label="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>
      
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={onToggle}
        aria-label={`Mark subtask "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 
                   focus:ring-primary-500 cursor-pointer"
      />
      
      <span className={`flex-1 text-sm ${
        subtask.completed 
          ? 'text-slate-400 dark:text-slate-500 line-through' 
          : 'text-slate-700 dark:text-slate-300'
      }`}>
        {subtask.title}
      </span>
      
      <button
        onClick={onDelete}
        className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 
                   focus:outline-none focus:ring-2 focus:ring-red-500 rounded
                   opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label={`Delete subtask "${subtask.title}"`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const config = {
    low: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    medium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    high: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config[priority]}`}>
      {priority}
    </span>
  )
}

function DueDateBadge({ dueDate, completed }: { dueDate: number; completed: boolean }) {
  const date = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isOverdue = !completed && dueDate < today.getTime()

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
      isOverdue 
        ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
    }`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {formatted}
    </span>
  )
}
