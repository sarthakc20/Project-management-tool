import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, CalendarCheck, CalendarDays, CircleCheckBig, Inbox, type LucideIcon } from 'lucide-react'
import type { Task } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useAllTasks, useCurrentUser, useProjectMap } from '@/hooks/useData'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { EmptyState } from '@/components/ui/display'
import { Segmented } from '@/components/ui/form'
import { DatePicker, PriorityPicker, TaskStatusPicker } from '@/components/common/pickers'
import { TaskTypeLabel } from '@/components/common/badges'
import { isTaskOverdue } from '@/lib/calculations'
import { compareDates, daysUntil } from '@/lib/dates'
import { isTaskClosed } from '@/lib/workflow'
import { cn, formatHours } from '@/lib/utils'
import { paths } from '@/lib/routes'

type Group = 'overdue' | 'today' | 'upcoming' | 'completed'
const GROUPS: { id: Group; label: string; icon: LucideIcon; empty: string }[] = [
  { id: 'overdue', label: 'Overdue', icon: AlarmClock, empty: 'Nothing overdue.' },
  { id: 'today', label: 'Today', icon: CalendarCheck, empty: 'Nothing due today.' },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, empty: 'No upcoming tasks.' },
  { id: 'completed', label: 'Completed', icon: CircleCheckBig, empty: 'No completed tasks yet.' },
]

export function groupOf(t: Task): Group {
  if (isTaskClosed(t.status)) return 'completed'
  if (isTaskOverdue(t)) return 'overdue'
  if (daysUntil(t.dueDate) === 0) return 'today'
  return 'upcoming'
}

export function TaskListRow({ task }: { task: Task }) {
  const projects = useProjectMap()
  const { open } = useTaskPanel()
  const { update, setStatus, can } = useTaskActions()
  const project = projects.get(task.projectId)
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 hover:bg-surface-2">
      <TaskStatusPicker value={task.status} onChange={(s) => setStatus(task, s)} disabled={!can.status.allowed} disabledReason={can.status.reason} />
      <button type="button" onClick={() => open(task.id)} className="min-w-0 flex-1 text-left">
        <span className={cn('block truncate text-[13px] font-medium hover:underline', task.status === 'done' && 'text-muted-foreground line-through')}>{task.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {task.key}
          {task.parentTaskId && ' · subtask'}
        </span>
      </button>
      {project && (
        <Link to={paths.project(project.id)} className="hidden max-w-[240px] truncate text-xs text-muted-foreground hover:text-foreground hover:underline md:block">
          {project.title}
        </Link>
      )}
      <span className="hidden lg:block"><TaskTypeLabel type={task.type} /></span>
      <PriorityPicker compact value={task.priority} onChange={(p) => void update(task, { priority: p })} disabled={!can.edit.allowed} disabledReason={can.edit.reason} />
      <span className="w-12 text-right text-xs text-muted-foreground tabular">{formatHours(task.estimatedHours, '')}</span>
      <span className="w-32"><DatePicker value={task.dueDate} showRelative closed={isTaskClosed(task.status)} onChange={(d) => void update(task, { dueDate: d })} placeholder="No date" disabled={!can.edit.allowed} disabledReason={can.edit.reason} /></span>
    </li>
  )
}

export function MyTasksPage() {
  useDocumentTitle('My Tasks')
  useBreadcrumbs([{ label: 'My Tasks' }])
  const me = useCurrentUser()
  const tasks = useAllTasks()
  const projects = useProjectMap()
  const [filter, setFilter] = useState<'all' | Group>('all')

  const mine = useMemo(
    () => tasks.filter((t) => t.assigneeId === me.id && projects.get(t.projectId) && !projects.get(t.projectId)!.archived).sort((a, b) => compareDates(a.dueDate, b.dueDate)),
    [tasks, me.id, projects],
  )
  const grouped = useMemo(() => {
    const g: Record<Group, Task[]> = { overdue: [], today: [], upcoming: [], completed: [] }
    for (const t of mine) g[groupOf(t)].push(t)
    g.completed.sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt))
    return g
  }, [mine])

  return (
    <div>
      <PageHeader title="My Tasks" description={`Assigned to ${me.name}`} />
      <PageBody className="space-y-5">
        <Segmented
          label="Group"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: `All (${mine.length})` }, ...GROUPS.map((g) => ({ value: g.id, label: `${g.label} (${grouped[g.id].length})` }))]}
        />
        {!mine.length ? (
          <EmptyState icon={Inbox} title="No tasks assigned to you" description="Use “Preview as role…” in the user menu to see another team member's tasks." />
        ) : (
          GROUPS.filter((g) => filter === 'all' || filter === g.id).map((g) => (
            <section key={g.id} aria-labelledby={`g-${g.id}`}>
              <h2 id={`g-${g.id}`} className={cn('mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold', g.id === 'overdue' && grouped.overdue.length && 'text-tone-red-fg')}>
                <g.icon className="size-4" /> {g.label} <span className="font-normal text-muted-foreground tabular">{grouped[g.id].length}</span>
              </h2>
              {grouped[g.id].length ? (
                <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                  {(g.id === 'completed' && filter === 'all' ? grouped[g.id].slice(0, 5) : grouped[g.id]).map((t) => <TaskListRow key={t.id} task={t} />)}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-3 py-3 text-[13px] text-muted-foreground">{g.empty}</p>
              )}
              {g.id === 'completed' && filter === 'all' && grouped.completed.length > 5 && (
                <button type="button" onClick={() => setFilter('completed')} className="mt-1 text-xs text-primary hover:underline">Show all {grouped.completed.length} completed</button>
              )}
            </section>
          ))
        )}
      </PageBody>
    </div>
  )
}
