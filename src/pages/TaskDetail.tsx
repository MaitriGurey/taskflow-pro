import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import type { Priority } from '../types'

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const task = useTaskStore((state) => state.tasks.find((t) => t.id === id))
  const { updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } = useTaskStore()

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  )
  const [newSubtask, setNewSubtask] = useState('')

  if (!task) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Task not found</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">This task may have been deleted</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </main>
    )
  }

  const handleSave = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      description: description.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id)
      navigate('/dashboard')
    }
  }

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtask.trim()) return
    addSubtask(task.id, newSubtask.trim())
    setNewSubtask('')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 
                         hover:text-slate-700 dark:hover:text-slate-200
                         focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          {isEditing ? (
            /* Edit mode */
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 
                             rounded-lg text-slate-900 dark:text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Add a description..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 
                             rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 
                               rounded-lg text-slate-900 dark:text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="task-due" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Due Date
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 
                               rounded-lg text-slate-900 dark:text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                             dark:focus:ring-offset-slate-900 transition-colors"
                >
                  Save changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div>
              {/* Task header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className={`text-xl font-semibold mb-3 ${
                      task.completed 
                        ? 'text-slate-400 dark:text-slate-500 line-through' 
                        : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {task.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                        task.priority === 'high' 
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                          : task.priority === 'medium' 
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {task.priority} priority
                      </span>
                      
                      {task.dueDate && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                          task.dueDate < Date.now() && !task.completed
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                        task.completed 
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {task.completed ? '✓ Completed' : 'Active'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 
                                 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 
                                 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className="mt-4 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Subtasks section */}
              <div className="border-t border-slate-100 dark:border-slate-800 p-6">
                <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">
                  Subtasks
                  {task.subtasks.length > 0 && (
                    <span className="ml-2 text-slate-400 dark:text-slate-500 font-normal">
                      {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                    </span>
                  )}
                </h2>

                <form onSubmit={handleAddSubtask} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg
                               text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  >
                    Add
                  </button>
                </form>

                {task.subtasks.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                    No subtasks yet
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {task.subtasks.map((subtask) => (
                      <li 
                        key={subtask.id} 
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtask(task.id, subtask.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 
                                     focus:ring-primary-500 cursor-pointer"
                        />
                        <span className={`flex-1 ${
                          subtask.completed 
                            ? 'text-slate-400 dark:text-slate-500 line-through' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => deleteSubtask(task.id, subtask.id)}
                          className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 
                                     focus:outline-none focus:ring-2 focus:ring-red-500 rounded
                                     opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          aria-label={`Delete subtask "${subtask.title}"`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Activity section */}
              {task.activityLog.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-6">
                  <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">
                    Recent Activity
                  </h2>
                  <ul className="space-y-3">
                    {task.activityLog.slice(-5).reverse().map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 mt-1.5 bg-slate-300 dark:bg-slate-600 rounded-full flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">{entry.action}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-2">
                            {new Date(entry.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
