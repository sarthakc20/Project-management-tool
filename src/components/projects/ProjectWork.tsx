import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addDays, differenceInCalendarDays, format, isWeekend, startOfWeek } from 'date-fns'
import { Bug as BugIcon, CalendarDays, ChevronLeft, ChevronRight, Kanban, ListChecks, Plus, Table2 } from 'lucide-react'
import type { Bug, Task } from '@/types'
import { useDb } from '@/services/store'
import { useSession } from '@/services/session'
import { useUI } from '@/services/ui'
import { useAllTasks, useCan, useUserMap } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { Button } from '@/components/ui/button'
import { Badge, EmptyState } from '@/components/ui/display'
import { Segmented, Select } from '@/components/ui/form'
import { Tooltip } from '@/components/ui/tooltip'
import { MetaBadge, TaskStatusBadge } from '@/components/common/badges'
import { UserAvatar, UserChip } from '@/components/common/people'
import { TaskTable, type TaskColumn } from '@/components/tasks/TaskTable'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { TASK_HEALTH, taskHealth } from '@/lib/calculations'
import { formatShortDate, parseDate, today } from '@/lib/dates'
import { BUG_SEVERITIES, BUG_STATUSES, isTaskClosed, taskStatusDef, taskTypeDef } from '@/lib/workflow'
import { cn, formatHours } from '@/lib/utils'
import { paths } from '@/lib/routes'

type View = 'tasks' | 'bugs' | 'all'

const CARD_TASK_COLUMNS: TaskColumn[] = ['health', 'status', 'due', 'assignee', 'estimate', 'actual']

/**
 * The card's task database views (Notion "Project Task All"): tasks only, bugs only, or both,
 * with a calculated Task Health flag and summed durations.
 */
export function ProjectWork({ projectId }: { projectId: string }) {
  const all = useAllTasks()
  const bugs = useDb((s) => s.bugs)
  const layout = useSession((s) => s.taskView)
  const setLayout = useSession((s) => s.setTaskView)
  const openCreate = useUI((s) => s.openCreateTask)
  const canCreate = useCan('task.create')
  const [params, setParams] = useSearchParams()
  const view = (['tasks', 'bugs', 'all'].includes(params.get('view') ?? '') ? params.get('view') : 'tasks') as View
  const show = params.get('show') ?? 'all'
  const setParam = (k: string, v: string, fallback: string) =>
    setParams((p) => { const n = new URLSearchParams(p); if (v === fallback) n.delete(k); else n.set(k, v); return n }, { replace: true, preventScrollReset: true })

  const projectTasks = useMemo(() => all.filter((t) => t.projectId === projectId), [all, projectId])
  const projectBugs = useMemo(() => bugs.filter((b) => b.projectId === projectId), [bugs, projectId])
  const top = projectTasks.filter((t) => !t.parentTaskId).sort((a, b) => a.order - b.order)
  const filtered = top.filter((t) => (show === 'all' ? true : show === 'open' ? !isTaskClosed(t.status) : t.status === show))
  const leaves = projectTasks.filter((t) => !projectTasks.some((k) => k.parentTaskId === t.id) && t.status !== 'cancelled')
  const est = leaves.reduce((a, t) => a + (t.estimatedHours ?? 0), 0)
  const act = leaves.reduce((a, t) => a + (t.actualHours ?? 0), 0)
  const missing = top.filter((t) => taskHealth(t) === 'missing_date').length

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented
          label="Project task views"
          value={view}
          onChange={(v) => setParam('view', v, 'tasks')}
          options={[
            { value: 'tasks', label: `Tasks only (${top.length})`, icon: <ListChecks /> },
            { value: 'bugs', label: `Bugs only (${projectBugs.length})`, icon: <BugIcon /> },
            { value: 'all', label: 'Tasks & bugs' },
          ]}
        />
        <span className="flex-1" />
        {view === 'tasks' && layout === 'table' && (
          <Select aria-label="Show tasks" value={show} onChange={(e) => setParam('show', e.target.value, 'all')} className="w-32">
            <option value="all">All tasks</option>
            <option value="open">Open only</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </Select>
        )}
        {view === 'tasks' && <Segmented label="Task layout" value={layout} onChange={setLayout} options={[{ value: 'table', label: 'Table', icon: <Table2 /> }, { value: 'board', label: 'Board', icon: <Kanban /> }]} />}
        {canCreate.allowed && <Button variant="primary" onClick={() => openCreate({ projectId })}><Plus /> New task</Button>}
      </div>

      {view === 'tasks' &&
        (!top.length ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet"
            description="Break this project into tasks, buffer and QI so hours and progress can be tracked."
            action={canCreate.allowed ? <Button variant="primary" onClick={() => openCreate({ projectId })}><Plus /> Create first task</Button> : <span className="text-xs text-muted-foreground">{canCreate.reason}</span>}
          />
        ) : layout === 'table' ? (
          <TaskTable tasks={filtered} columns={CARD_TASK_COLUMNS} wrapTitles emptyState={<EmptyState compact icon={ListChecks} title="No tasks match this filter" />} />
        ) : (
          <TaskBoard tasks={projectTasks} showProject={false} projectId={projectId} />
        ))}
      {view === 'bugs' && <BugRows bugs={projectBugs} />}
      {view === 'all' && <CombinedRows tasks={top} bugs={projectBugs} />}

      {view !== 'bugs' && top.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {missing > 0 && <span className="text-tone-red-fg">{missing} task{missing === 1 ? '' : 's'} missing a due date</span>}
          <span>{top.filter((t) => t.status === 'done').length}/{top.length} done</span>
          <span className="tabular"><span className="tracking-wide uppercase">Sum</span> <strong className="text-foreground">{formatHours(est, '0h')}</strong> estimated · <strong className="text-foreground">{formatHours(act, '0h')}</strong> actual</span>
        </div>
      )}
    </div>
  )
}

function BugRows({ bugs }: { bugs: Bug[] }) {
  if (!bugs.length) return <EmptyState compact icon={BugIcon} title="No bugs logged" description="Bugs created from QI or the card's QI section show up here." />
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
            {['Bug', 'Status', 'Severity', 'Assignee', 'Reported'].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {bugs.map((b) => (
            <tr key={b.id} className="border-b border-border last:border-0 hover:bg-surface-2">
              <td className="max-w-[380px] px-3 py-2">
                <Link to={paths.bug(b.id)} className="flex min-w-0 items-center gap-1.5 hover:underline">
                  <BugIcon className="size-3.5 shrink-0 text-tone-red-fg" aria-hidden />
                  <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">{b.key}</span>
                  <span className="truncate text-[13px] font-medium">{b.title}</span>
                </Link>
              </td>
              <td className="px-3 py-2"><MetaBadge list={BUG_STATUSES} id={b.status} /></td>
              <td className="px-3 py-2"><MetaBadge list={BUG_SEVERITIES} id={b.severity} /></td>
              <td className="px-3 py-2"><UserChip userId={b.assigneeId} /></td>
              <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">{formatShortDate(b.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Tasks and bugs in one list, ordered by due date (bugs by report date). */
function CombinedRows({ tasks, bugs }: { tasks: Task[]; bugs: Bug[] }) {
  const { open } = useTaskPanel()
  const rows = [
    ...tasks.map((t) => ({ kind: 'task' as const, at: t.dueDate ?? '9999', task: t })),
    ...bugs.map((b) => ({ kind: 'bug' as const, at: b.createdAt.slice(0, 10), bug: b })),
  ].sort((a, b) => a.at.localeCompare(b.at))
  if (!rows.length) return <EmptyState compact icon={ListChecks} title="No tasks or bugs yet" />
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
            {['Title', 'Health', 'Status', 'Date', 'Person', 'Duration'].map((h) => <th key={h} scope="col" className={cn('px-3 py-2 font-medium', h === 'Duration' && 'text-right')}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            if (r.kind === 'bug') {
              const b = r.bug
              return (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="max-w-[360px] px-3 py-2">
                    <Link to={paths.bug(b.id)} className="flex min-w-0 items-center gap-1.5 hover:underline">
                      <BugIcon className="size-3.5 shrink-0 text-tone-red-fg" aria-label="Bug" />
                      <span className="truncate text-[13px] font-medium">{b.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2"><MetaBadge list={BUG_SEVERITIES} id={b.severity} /></td>
                  <td className="px-3 py-2"><MetaBadge list={BUG_STATUSES} id={b.status} /></td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">Reported {formatShortDate(b.createdAt)}</td>
                  <td className="px-3 py-2"><UserChip userId={b.assigneeId} /></td>
                  <td className="px-3 py-2 text-right text-xs text-subtle-foreground">—</td>
                </tr>
              )
            }
            const t = r.task
            const h = TASK_HEALTH[taskHealth(t)]
            const TypeIcon = taskTypeDef(t.type).icon
            return (
              <tr key={t.id} onClick={() => open(t.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2">
                <td className="max-w-[360px] px-3 py-2">
                  <button type="button" onClick={(e) => { e.stopPropagation(); open(t.id) }} className="flex min-w-0 items-center gap-1.5 text-left hover:underline">
                    <TypeIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label={taskTypeDef(t.type).label} />
                    <span className="truncate text-[13px] font-medium">{t.title}</span>
                  </button>
                </td>
                <td className="px-3 py-2"><Badge tone={h.tone} dot>{h.label}</Badge></td>
                <td className="px-3 py-2"><TaskStatusBadge status={t.status} /></td>
                <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">{t.dueDate ? formatShortDate(t.dueDate) : '—'}</td>
                <td className="px-3 py-2"><UserChip userId={t.assigneeId} /></td>
                <td className="px-3 py-2 text-right text-[13px] tabular">{formatHours(t.estimatedHours, '—')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ───────────────────────────── Calendar strip ─────────────────────────────

const DAYS = 35
const COL = 44

/**
 * Day-by-day calendar of the project's tasks (the Notion calendar view under the task table).
 * Each task spans start → due; undated tasks are counted in the "No date" chip.
 */
export function ProjectTaskCalendar({ projectId }: { projectId: string }) {
  const all = useAllTasks()
  const users = useUserMap()
  const { open } = useTaskPanel()
  const tasks = useMemo(() => all.filter((t) => t.projectId === projectId && !t.parentTaskId).sort((a, b) => a.order - b.order), [all, projectId])
  const dated = tasks.filter((t) => t.startDate || t.dueDate)
  const undated = tasks.filter((t) => !t.startDate && !t.dueDate)

  const focus = useMemo(() => {
    const openDated = dated.find((t) => !isTaskClosed(t.status))
    const d = openDated ? (openDated.startDate ?? openDated.dueDate) : dated.length ? (dated[0].startDate ?? dated[0].dueDate) : undefined
    return parseDate(d) ?? today()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])
  const [start, setStart] = useState(() => addDays(startOfWeek(focus, { weekStartsOn: 1 }), -7))
  const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i))
  const todayIdx = differenceInCalendarDays(today(), start)
  const idx = (d?: string) => {
    const p = parseDate(d)
    return p ? differenceInCalendarDays(p, start) : null
  }
  const visible = dated.filter((t) => {
    const a = idx(t.startDate ?? t.dueDate)!
    const b = idx(t.dueDate ?? t.startDate)!
    return b >= 0 && a < DAYS
  })
  const outside = dated.length - visible.length

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="mr-1 text-[15px] font-semibold tabular">{format(start, 'MMM d')} – {format(addDays(start, DAYS - 1), 'MMM d, yyyy')}</h3>
        <Button size="icon-sm" aria-label="Previous weeks" onClick={() => setStart((s) => addDays(s, -14))}><ChevronLeft /></Button>
        <Button size="sm" onClick={() => setStart(addDays(startOfWeek(today(), { weekStartsOn: 1 }), -7))}>Today</Button>
        <Button size="icon-sm" aria-label="Next weeks" onClick={() => setStart((s) => addDays(s, 14))}><ChevronRight /></Button>
        <span className="flex-1" />
        {outside > 0 && <span className="text-xs text-muted-foreground">{outside} outside this range</span>}
        <Tooltip content={undated.length ? undated.map((t) => t.title).join(' · ') : 'Every task has a date'}>
          <span className={cn('rounded-md px-2 py-0.5 text-xs', undated.length ? 'bg-tone-red-bg text-tone-red-fg' : 'bg-muted text-muted-foreground')}>No date ({undated.length})</span>
        </Tooltip>
      </div>
      <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="relative" style={{ width: DAYS * COL, minWidth: '100%' }}>
          {/* weekend shading + today line */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {days.map((d, i) => isWeekend(d) && <span key={i} className="absolute inset-y-0 bg-surface-2" style={{ left: i * COL, width: COL }} />)}
            {todayIdx >= 0 && todayIdx < DAYS && <span className="absolute top-0 bottom-0 z-10 w-0.5 bg-tone-red-dot" style={{ left: todayIdx * COL + COL / 2 }} />}
          </div>
          <div className="relative flex border-b border-border">
            {days.map((d, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center py-1.5 text-[11px] text-muted-foreground" style={{ width: COL }}>
                <span className="leading-none">{format(d, 'EEEEE')}</span>
                <span className={cn('mt-1 flex size-6 items-center justify-center rounded-full text-[12px] tabular', i === todayIdx && 'bg-tone-red-dot font-semibold text-white', d.getDate() === 1 && i !== todayIdx && 'font-semibold text-foreground')}>{d.getDate()}</span>
              </div>
            ))}
          </div>
          <div className="relative space-y-1.5 py-2" style={{ minHeight: 96 }}>
            {visible.length === 0 && <p className="sticky left-0 px-3 py-6 text-[13px] text-muted-foreground">No tasks scheduled in these weeks.</p>}
            {visible.map((t) => {
              const a = Math.max(0, idx(t.startDate ?? t.dueDate)!)
              const b = Math.min(DAYS - 1, idx(t.dueDate ?? t.startDate)!)
              const assignee = users.get(t.assigneeId ?? '')
              const status = taskStatusDef(t.status)
              return (
                <div key={t.id} className="relative h-8">
                  <button
                    type="button"
                    onClick={() => open(t.id)}
                    className={cn('absolute inset-y-0 flex items-center gap-1.5 overflow-hidden rounded-md border border-border bg-surface px-2 text-left text-xs shadow-xs hover:border-border-strong', isTaskClosed(t.status) && 'opacity-75')}
                    style={{ left: a * COL + 2, minWidth: (b - a + 1) * COL - 4, width: 'max-content', maxWidth: (DAYS - a) * COL - 4 }}
                    aria-label={`${t.title} · ${formatShortDate(t.startDate ?? t.dueDate)} → ${formatShortDate(t.dueDate ?? t.startDate)} · ${status.label}`}
                  >
                    <CalendarDays className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate font-medium">{t.title}</span>
                    {assignee && <UserAvatar user={assignee} size="xs" tooltip={false} />}
                    <span className="hidden shrink-0 sm:inline"><TaskStatusBadge status={t.status} /></span>
                    {t.estimatedHours !== undefined && <span className="shrink-0 text-muted-foreground tabular">{t.estimatedHours}</span>}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
