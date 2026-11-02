import {
  Archive,
  ArrowRightLeft,
  Bug,
  CalendarClock,
  CheckCircle2,
  CircleCheck,
  Clock,
  FilePlus2,
  Flag,
  Link2,
  ListPlus,
  MessageSquare,
  Pencil,
  Search,
  Trash2,
  Unlink,
  UserRoundCog,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityEvent, ActivityType, Database, ProjectStatus, TaskStatus } from '@/types'
import { formatDate } from './dates'
import { findMeta, priorityDef, projectStatusDef, QI_STATUSES, taskStatusDef } from './workflow'
import type { Priority } from '@/types'

/**
 * Shared activity formatting so every screen renders events the same way.
 * Writing events lives in services/api.ts (`logActivity`).
 */

export const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  project_created: FilePlus2,
  project_updated: Pencil,
  project_archived: Archive,
  status_changed: ArrowRightLeft,
  priority_changed: Flag,
  assignee_changed: UserRoundCog,
  due_date_changed: CalendarClock,
  task_created: ListPlus,
  task_completed: CheckCircle2,
  task_deleted: Trash2,
  comment_added: MessageSquare,
  link_added: Link2,
  link_removed: Unlink,
  qi_started: Search,
  qi_result: CircleCheck,
  bug_created: Bug,
  hours_logged: Clock,
}

type Lookup = Pick<Database, 'users' | 'tasks' | 'projects'>

function userName(id: unknown, ctx: Lookup) {
  if (!id) return 'nobody'
  return ctx.users.find((u) => u.id === id)?.name ?? 'a former member'
}

function statusLabel(v: unknown, kind: unknown) {
  if (!v) return '—'
  return kind === 'task' ? taskStatusDef(v as TaskStatus).label : projectStatusDef(v as ProjectStatus).label
}

/** Returns a sentence fragment that follows the actor's name, e.g. "changed status from A to B". */
export function describeActivity(e: ActivityEvent, ctx: Lookup): string {
  const task = e.taskId ? ctx.tasks.find((t) => t.id === e.taskId) : undefined
  const taskName = task ? `“${task.title}”` : e.meta.title ? `“${e.meta.title}”` : 'a task'
  const m = e.meta
  switch (e.type) {
    case 'project_created':
      return 'created the project'
    case 'project_updated':
      return m.field ? `updated ${m.field}` : 'updated project details'
    case 'project_archived':
      return m.to === 'restored' ? 'restored the project' : 'archived the project'
    case 'status_changed':
      return e.taskId
        ? `moved ${taskName} from ${statusLabel(m.from, 'task')} to ${statusLabel(m.to, 'task')}`
        : `changed project status from ${statusLabel(m.from, 'project')} to ${statusLabel(m.to, 'project')}`
    case 'priority_changed':
      return `changed ${e.taskId ? `${taskName} ` : ''}priority to ${priorityDef(m.to as Priority).label}`
    case 'assignee_changed':
      if (m.role) return `set ${m.role} to ${userName(m.to, ctx)}`
      return `assigned ${taskName} to ${userName(m.to, ctx)}`
    case 'due_date_changed':
      return `changed ${e.taskId ? `${taskName} ` : ''}${m.field === 'revisedDueDate' ? 'revised due date' : 'due date'} ${m.from ? `from ${formatDate(String(m.from), 'MMM d')} ` : ''}to ${m.to ? formatDate(String(m.to), 'MMM d') : 'none'}`
    case 'task_created':
      return `created ${m.parent ? 'subtask' : 'task'} ${taskName}`
    case 'task_completed':
      return `completed ${taskName}`
    case 'task_deleted':
      return `deleted ${m.title ? `“${m.title}”` : 'a task'}`
    case 'comment_added':
      return e.taskId ? `commented on ${taskName}` : 'commented'
    case 'link_added':
      return `added link “${m.title}”`
    case 'link_removed':
      return `removed link “${m.title}”`
    case 'qi_started':
      if (m.timer) return 'started the QI timer'
      return `started QI round ${m.round ?? 1} on ${taskName}`
    case 'qi_result':
      return `recorded QI ${findMeta(QI_STATUSES, String(m.result)).label.toLowerCase()} on ${taskName}${m.round ? ` (round ${m.round})` : ''}`
    case 'bug_created':
      return `logged bug “${m.title}”`
    case 'hours_logged':
      if (m.timer) return `stopped the QI timer (${m.duration})`
      return `updated hours on ${taskName} to ${m.to}h`
  }
}
