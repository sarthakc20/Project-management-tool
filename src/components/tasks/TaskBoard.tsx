import { useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import type { Task, TaskStatus } from '@/types'
import { useDb } from '@/services/store'
import { useUI } from '@/services/ui'
import { useProjectMap, useUserMap, useCan } from '@/hooks/useData'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { PriorityIcon, StatusIcon } from '@/components/common/badges'
import { UserAvatar } from '@/components/common/people'
import { DatePicker } from '@/components/common/pickers'
import { TASK_LIFECYCLE, taskStatusDef, isTaskClosed } from '@/lib/workflow'
import { cn } from '@/lib/utils'

const COLUMNS: TaskStatus[] = [...TASK_LIFECYCLE, 'blocked']

/**
 * Kanban board with native drag-and-drop. Moving a card updates status through the same
 * mutation used by tables, so every view stays in sync.
 */
export function TaskBoard({ tasks, showProject = true, projectId }: { tasks: Task[]; showProject?: boolean; projectId?: string }) {
  const { setStatus, can } = useTaskActions()
  const canCreate = useCan('task.create')
  const openCreate = useUI((s) => s.openCreateTask)
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<TaskStatus | null>(null)
  const hidden = tasks.filter((t) => t.status === 'on_hold' || t.status === 'cancelled').length

  return (
    <div>
      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-3">
        {COLUMNS.map((status) => {
          const def = taskStatusDef(status)
          const items = tasks.filter((t) => t.status === status)
          return (
            <section
              key={status}
              aria-label={`${def.label} column`}
              onDragOver={(e) => {
                if (!can.status.allowed) return
                e.preventDefault()
                setOver(status)
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                setOver(null)
                const id = e.dataTransfer.getData('text/task')
                const task = tasks.find((t) => t.id === id)
                if (task) setStatus(task, status)
              }}
              className={cn(
                'flex w-[264px] shrink-0 flex-col rounded-xl border border-transparent bg-surface-2 transition-colors',
                over === status && 'border-ring bg-primary-soft/40',
              )}
            >
              <header className="flex items-center gap-2 px-3 pt-2.5 pb-2">
                <StatusIcon status={status} kind="task" />
                <h3 className="text-[13px] font-semibold">{def.label}</h3>
                <span className="text-xs text-muted-foreground tabular">{items.length}</span>
                {canCreate.allowed && projectId && (
                  <button
                    type="button"
                    onClick={() => openCreate({ projectId, status })}
                    className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Add task to ${def.label}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                )}
              </header>
              <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                {items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    showProject={showProject}
                    draggable={can.status.allowed}
                    dragging={dragging === t.id}
                    onDragStart={() => setDragging(t.id)}
                    onDragEnd={() => setDragging(null)}
                  />
                ))}
                {!items.length && <p className="py-6 text-center text-xs text-subtle-foreground">{can.status.allowed ? 'Drop tasks here' : 'No tasks'}</p>}
              </div>
            </section>
          )
        })}
      </div>
      {hidden > 0 && <p className="text-xs text-muted-foreground">{hidden} on-hold or cancelled task{hidden > 1 ? 's' : ''} not shown on the board.</p>}
      {!can.status.allowed && (
        <p className="mt-1 text-xs text-muted-foreground" role="note">
          Drag and drop is disabled: {can.status.reason}.
        </p>
      )}
    </div>
  )
}

function TaskCard({
  task,
  showProject,
  draggable,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: Task
  showProject: boolean
  draggable: boolean
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const projects = useProjectMap()
  const users = useUserMap()
  const comments = useDb((s) => s.comments)
  const allTasks = useDb((s) => s.tasks)
  const { open } = useTaskPanel()
  const { update, can } = useTaskActions()
  const project = projects.get(task.projectId)
  const commentCount = comments.filter((c) => c.taskId === task.id).length
  const subtasks = allTasks.filter((t) => t.parentTaskId === task.id)
  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task', task.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={() => open(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open(task.id)
      }}
      tabIndex={0}
      aria-label={`${task.key} ${task.title}`}
      className={cn(
        'cursor-pointer rounded-lg border border-border bg-surface p-2.5 shadow-xs transition-shadow hover:border-border-strong hover:shadow-sm',
        dragging && 'opacity-50',
        draggable && 'active:cursor-grabbing',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] text-subtle-foreground">{task.key}</span>
        <PriorityIcon priority={task.priority} className="ml-auto size-3.5" />
      </div>
      <p className="mt-1 text-[13px] leading-snug font-medium">{task.title}</p>
      {showProject && project && <p className="mt-1 truncate text-xs text-muted-foreground">{project.title}</p>}
      <div className="mt-2 flex items-center gap-2">
        <DatePicker
          value={task.dueDate}
          onChange={(d) => void update(task, { dueDate: d })}
          closed={isTaskClosed(task.status)}
          showRelative
          placeholder="No date"
          disabled={!can.edit.allowed}
          disabledReason={can.edit.reason}
        />
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {subtasks.length > 0 && (
            <span className="tabular" title="Subtasks done">
              {subtasks.filter((s) => s.status === 'done').length}/{subtasks.length}
            </span>
          )}
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 tabular">
              <MessageSquare className="size-3" /> {commentCount}
            </span>
          )}
          <UserAvatar user={task.assigneeId ? users.get(task.assigneeId) : undefined} size="xs" />
        </span>
      </div>
    </article>
  )
}
