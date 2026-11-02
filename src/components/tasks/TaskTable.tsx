import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CornerDownRight, Plus } from 'lucide-react'
import type { Task } from '@/types'
import { useAllTasks, useProjectMap } from '@/hooks/useData'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { useUI } from '@/services/ui'
import { Badge, ProgressBar } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/tooltip'
import { DatePicker, InlineNumber, PriorityPicker, TaskStatusPicker, UserPicker } from '@/components/common/pickers'
import { TaskTypeLabel } from '@/components/common/badges'
import { ClientChip } from '@/components/common/people'
import { TASK_HEALTH, childrenOf, taskHealth, taskProgress } from '@/lib/calculations'
import { isTaskClosed, taskTypeDef } from '@/lib/workflow'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/routes'
import { useCan } from '@/hooks/useData'

export type TaskColumn = 'health' | 'project' | 'client' | 'status' | 'assignee' | 'priority' | 'start' | 'due' | 'estimate' | 'actual' | 'progress' | 'type'

const COLUMN_LABEL: Record<TaskColumn, string> = {
  health: 'Task health', project: 'Project', client: 'Client', status: 'Status', assignee: 'Assignee', priority: 'Priority', start: 'Start',
  due: 'Due', estimate: 'Est.', actual: 'Actual', progress: 'Progress', type: 'Type',
}

export const PROJECT_TASK_COLUMNS: TaskColumn[] = ['status', 'assignee', 'priority', 'start', 'due', 'estimate', 'actual', 'progress', 'type']
export const ALL_TASK_COLUMNS: TaskColumn[] = ['project', 'status', 'assignee', 'priority', 'due', 'estimate', 'actual', 'progress']

/**
 * Hierarchical task table. Top-level rows expand to show subtasks; inline cells edit
 * through permission-aware pickers.
 */
export function TaskTable({
  tasks,
  columns = PROJECT_TASK_COLUMNS,
  nested = true,
  defaultExpanded = true,
  emptyState,
  wrapTitles = false,
}: {
  tasks: Task[]
  columns?: TaskColumn[]
  /** When true, `tasks` should contain only top-level tasks; subtasks are looked up and nested. */
  nested?: boolean
  defaultExpanded?: boolean
  emptyState?: React.ReactNode
  /** Cap the Task column width and wrap long titles instead of widening the table. */
  wrapTitles?: boolean
}) {
  const allTasks = useAllTasks()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => (defaultExpanded ? new Set() : new Set(tasks.map((t) => t.id))))
  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  if (!tasks.length) return <>{emptyState}</>

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
      <table className={cn('w-full border-collapse text-left', wrapTitles ? 'min-w-[680px]' : 'min-w-[880px]')}>
        <thead>
          <tr className="border-b border-border text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            <th scope="col" className="sticky left-0 z-10 bg-surface py-2 pr-2 pl-3 font-medium">Task</th>
            {columns.map((c) => (
              <th key={c} scope="col" className={cn('px-2 py-2 font-medium whitespace-nowrap', (c === 'estimate' || c === 'actual') && 'text-right')}>
                {COLUMN_LABEL[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const kids = nested ? childrenOf(t.id, allTasks) : []
            const open = !collapsed.has(t.id)
            return (
              <Fragment key={t.id}>
                <TaskRow task={t} columns={columns} depth={0} subtaskCount={kids.length} expanded={open} onToggle={() => toggle(t.id)} wrap={wrapTitles} />
                {open && kids.map((k) => <TaskRow key={k.id} task={k} columns={columns} depth={1} wrap={wrapTitles} />)}
                {open && kids.length > 0 && <AddSubtaskRow parent={t} colSpan={columns.length + 1} />}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AddSubtaskRow({ parent, colSpan }: { parent: Task; colSpan: number }) {
  const open = useUI((s) => s.openCreateTask)
  const can = useCan('subtask.create')
  if (!can.allowed) return null
  return (
    <tr className="border-b border-border last:border-0">
      <td colSpan={colSpan} className="py-1 pl-12">
        <button type="button" onClick={() => open({ projectId: parent.projectId, parentTaskId: parent.id })} className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
          <Plus className="size-3" /> Add subtask
        </button>
      </td>
    </tr>
  )
}

function TaskRow({
  task,
  columns,
  depth,
  subtaskCount = 0,
  expanded,
  onToggle,
  wrap,
}: {
  task: Task
  columns: TaskColumn[]
  depth: number
  subtaskCount?: number
  expanded?: boolean
  onToggle?: () => void
  wrap?: boolean
}) {
  const allTasks = useAllTasks()
  const projects = useProjectMap()
  const { open } = useTaskPanel()
  const { update, setStatus, can } = useTaskActions()
  const progress = useMemo(() => taskProgress(task, allTasks), [task, allTasks])
  const project = projects.get(task.projectId)
  const closed = isTaskClosed(task.status)
  const TypeIcon = taskTypeDef(task.type).icon

  const cell = (c: TaskColumn) => {
    switch (c) {
      case 'health': {
        const h = TASK_HEALTH[taskHealth(task)]
        return <Badge tone={h.tone} dot>{h.label}</Badge>
      }
      case 'project':
        return project ? (
          <Link to={paths.project(project.id)} onClick={(e) => e.stopPropagation()} className="block max-w-[220px] truncate text-[13px] text-muted-foreground hover:text-foreground hover:underline">
            {project.title}
          </Link>
        ) : null
      case 'client':
        return project ? <ClientChip clientId={project.clientId} /> : null
      case 'status':
        return <TaskStatusPicker value={task.status} onChange={(s) => setStatus(task, s)} disabled={!can.status.allowed} disabledReason={can.status.reason} />
      case 'assignee':
        return (
          <UserPicker
            value={task.assigneeId}
            onChange={(v) => void update(task, { assigneeId: v }, v ? 'Assignee updated' : 'Task unassigned')}
            disabled={!can.assign.allowed}
            disabledReason={can.assign.reason}
          />
        )
      case 'priority':
        return <PriorityPicker value={task.priority} onChange={(p) => void update(task, { priority: p })} disabled={!can.edit.allowed} disabledReason={can.edit.reason} />
      case 'start':
        return <DatePicker value={task.startDate} onChange={(d) => void update(task, { startDate: d })} closed placeholder="—" disabled={!can.edit.allowed} disabledReason={can.edit.reason} />
      case 'due':
        return <DatePicker value={task.dueDate} onChange={(d) => void update(task, { dueDate: d }, 'Due date updated')} closed={closed} showRelative placeholder="—" disabled={!can.edit.allowed} disabledReason={can.edit.reason} />
      case 'estimate':
        return subtaskCount > 0 ? (
          <Tooltip content="Sum of subtask estimates">
            <span className="px-1 text-[13px] text-muted-foreground tabular">{sumKids(task, allTasks, 'estimatedHours')}h</span>
          </Tooltip>
        ) : (
          <InlineNumber label="Estimated hours" value={task.estimatedHours} onChange={(v) => void update(task, { estimatedHours: v })} disabled={!can.hours.allowed} disabledReason={can.hours.reason} />
        )
      case 'actual':
        return subtaskCount > 0 ? (
          <Tooltip content="Sum of subtask actual hours">
            <span className="px-1 text-[13px] text-muted-foreground tabular">{sumKids(task, allTasks, 'actualHours')}h</span>
          </Tooltip>
        ) : (
          <InlineNumber label="Actual hours" value={task.actualHours} onChange={(v) => void update(task, { actualHours: v }, 'Hours logged')} disabled={!can.hours.allowed} disabledReason={can.hours.reason} />
        )
      case 'progress':
        return (
          <div className="flex w-24 items-center gap-2">
            <ProgressBar value={progress} />
            <span className="w-8 text-right text-xs text-muted-foreground tabular">{progress}%</span>
          </div>
        )
      case 'type':
        return <TaskTypeLabel type={task.type} />
    }
  }

  return (
    <tr
      onClick={() => open(task.id)}
      className={cn('group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2', depth > 0 && 'bg-surface-2/40')}
    >
      <td className={cn('sticky left-0 z-10 bg-inherit py-1.5 pr-2 pl-3', wrap && 'w-[38%] max-w-[380px]')}>
        <div className={cn('flex gap-1.5', wrap ? 'min-w-[200px] items-start' : 'min-w-[260px] items-center')} style={{ paddingLeft: depth * 22 }}>
          {depth === 0 ? (
            subtaskCount > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle?.()
                }}
                aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
                aria-expanded={expanded}
                className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent"
              >
                <ChevronRight className={cn('size-3.5 transition-transform', expanded && 'rotate-90')} />
              </button>
            ) : (
              <span className="size-5" />
            )
          ) : (
            <CornerDownRight className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
          )}
          <TypeIcon className={cn('size-3.5 shrink-0 text-muted-foreground', wrap && 'mt-[3px]')} aria-label={taskTypeDef(task.type).label} />
          <span className={cn('shrink-0 font-mono text-[11px] text-subtle-foreground', wrap && 'mt-px')}>{task.key}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); open(task.id) }} className={cn('text-left text-[13px] font-medium hover:underline', wrap ? 'min-w-0 leading-snug break-words' : 'truncate', closed && task.status === 'cancelled' && 'text-muted-foreground line-through')}>
            {task.title}
          </button>
          {subtaskCount > 0 && <span className="shrink-0 rounded bg-muted px-1 text-[11px] text-muted-foreground tabular">{subtaskCount}</span>}
        </div>
      </td>
      {columns.map((c) => (
        <td key={c} className={cn('px-2 py-1.5 whitespace-nowrap', (c === 'estimate' || c === 'actual') && 'text-right')}>
          {cell(c)}
        </td>
      ))}
    </tr>
  )
}

function sumKids(task: Task, all: Task[], field: 'estimatedHours' | 'actualHours') {
  const total = childrenOf(task.id, all).reduce((acc, k) => acc + (k[field] ?? 0), 0)
  return Math.round(total * 10) / 10
}
