import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, Task } from '@/types'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { isTaskOverdue, isProjectOverdue, projectDueDate } from '@/lib/calculations'
import { isProjectClosed, isTaskClosed, projectStatusDef, taskStatusDef } from '@/lib/workflow'
import { paths } from '@/lib/routes'
import type { CalendarEvent } from './MonthCalendar'

/** Maps projects (by effective due date) and tasks (by due date) to calendar events. */
export function useCalendarEvents(projects: Project[], tasks: Task[]) {
  const navigate = useNavigate()
  const { open } = useTaskPanel()
  return useMemo<CalendarEvent[]>(() => {
    const keys = new Map(projects.map((p) => [p.id, p.key]))
    return [
      ...projects
        .filter((p) => projectDueDate(p))
        .map((p) => ({
          id: p.id,
          date: projectDueDate(p)!,
          title: p.title,
          subtitle: p.key,
          kind: 'project' as const,
          tone: projectStatusDef(p.status).tone,
          done: isProjectClosed(p.status),
          overdue: isProjectOverdue(p),
          onOpen: () => navigate(paths.project(p.id)),
        })),
      ...tasks
        .filter((t) => t.dueDate)
        .map((t) => ({
          id: t.id,
          date: t.dueDate!,
          title: t.title,
          subtitle: keys.get(t.projectId) ?? t.key,
          kind: 'task' as const,
          tone: taskStatusDef(t.status).tone,
          done: isTaskClosed(t.status),
          overdue: isTaskOverdue(t),
          onOpen: () => open(t.id),
        })),
    ]
  }, [projects, tasks, navigate, open])
}
