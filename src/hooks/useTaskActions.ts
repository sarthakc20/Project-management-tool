import { useCallback } from 'react'
import { toast } from 'sonner'
import type { Task } from '@/types'
import { updateTask } from '@/services/api'
import { useCan } from './useData'
import { taskStatusDef } from '@/lib/workflow'

/** Permission-aware task mutations with consistent feedback. */
export function useTaskActions() {
  const status = useCan('task.changeStatus')
  const edit = useCan('task.edit')
  const assign = useCan('task.assign')
  const hours = useCan('task.logHours')

  const update = useCallback(async (task: Task, updates: Partial<Task>, message?: string) => {
    try {
      await updateTask(task.id, updates)
      if (message) toast.success(message)
    } catch (e) {
      // TODO(API-ERRORS): Map API errors (validation, conflicts, permission) to user-facing messages.
      toast.error('Could not update task', { description: (e as Error).message })
    }
  }, [])

  const setStatus = useCallback(
    (task: Task, s: Task['status']) => {
      if (s === task.status) return
      void update(task, { status: s }, `${task.key} → ${taskStatusDef(s).label}`)
      if (s === 'ready_for_qi') toast('Sent to QI', { description: 'A QI record was created for the project QI owner.' })
    },
    [update],
  )

  return { update, setStatus, can: { status, edit, assign, hours } }
}
