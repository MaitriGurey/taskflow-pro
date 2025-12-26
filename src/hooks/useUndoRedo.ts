import { useEffect } from 'react'
import { useTaskStore } from '../stores/taskStore'

export function useUndoRedo() {
  const undo = useTaskStore((state) => state.undo)
  const redo = useTaskStore((state) => state.redo)
  // Select the lengths directly so React can detect changes
  const pastLength = useTaskStore((state) => state.past.length)
  const futureLength = useTaskStore((state) => state.future.length)

  const canUndo = pastLength > 0
  const canRedo = futureLength > 0

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (!modifier || e.key.toLowerCase() !== 'z') return

      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return { undo, redo, canUndo, canRedo }
}
