import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Dialog as D } from 'radix-ui'
import { toast } from 'sonner'
import { Check, CheckCircle2, ClipboardCheck, Ellipsis, Link2, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Task, TaskType } from '@/types'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge, ProgressBar, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/display'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { Select, Textarea, Input } from '@/components/ui/form'
import { Tooltip } from '@/components/ui/tooltip'
import { DatePicker, InlineNumber, PriorityPicker, TaskStatusPicker, UserPicker } from '@/components/common/pickers'
import { ClientChip, UserChip } from '@/components/common/people'
import { MetaBadge, StatusIcon, TaskStatusBadge } from '@/components/common/badges'
import { ConfirmDialog } from '@/components/common/confirm'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { CommentComposer, CommentItem } from '@/components/activity/Comments'
import { useDb } from '@/services/store'
import { useUI } from '@/services/ui'
import { createTask, deleteTask } from '@/services/api'
import { useCan, useProject, useSubtasks, useTask, useAllTasks } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { useTaskActions } from '@/hooks/useTaskActions'
import { taskProgress } from '@/lib/calculations'
import { formatDateTime, relativeTime } from '@/lib/dates'
import { paths } from '@/lib/routes'
import { QI_STATUSES, TASK_TYPES, isTaskClosed } from '@/lib/workflow'
import { cn, formatHours } from '@/lib/utils'

/** Global task panel, opened via `?task=<id>` from any view. */
export function TaskDetailSheet() {
  const { taskId, close } = useTaskPanel()
  const task = useTask(taskId)
  const open = Boolean(taskId)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      {open && (
        <SheetContent title={task ? task.title : 'Task not found'}>
          {task ? (
            <TaskDetail key={task.id} task={task} onClose={close} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-medium">This task no longer exists</p>
              <p className="mt-1 text-[13px] text-muted-foreground">It may have been deleted in this session.</p>
              <Button className="mt-4" onClick={close}>Close</Button>
            </div>
          )}
        </SheetContent>
      )}
    </Dialog>
  )
}

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const project = useProject(task.projectId)
  const parent = useTask(task.parentTaskId)
  const subtasks = useSubtasks(task)
  const allTasks = useAllTasks()
  const comments = useDb((s) => s.comments)
  const activity = useDb((s) => s.activity)
  const qiRecords = useDb((s) => s.qiRecords)
  const bugs = useDb((s) => s.bugs)
  const { update, setStatus, can } = useTaskActions()
  const canDelete = useCan('task.delete')
  const canSubtask = useCan('subtask.create')
  const { open: openTask } = useTaskPanel()
  const openCreate = useUI((s) => s.openCreateTask)

  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [editingDesc, setEditingDesc] = useState(false)
  const [desc, setDesc] = useState(task.description)
  const [newSub, setNewSub] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const taskComments = useMemo(() => comments.filter((c) => c.taskId === task.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [comments, task.id])
  const taskActivity = useMemo(
    () => activity.filter((a) => a.taskId === task.id || subtasks.some((s) => s.id === a.taskId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activity, task.id, subtasks],
  )
  const qi = qiRecords.filter((q) => q.taskId === task.id).sort((a, b) => b.round - a.round)
  const taskBugs = bugs.filter((b) => b.taskId === task.id)
  const progress = taskProgress(task, allTasks)
  const done = task.status === 'done'

  const saveTitle = () => {
    setEditingTitle(false)
    if (title.trim() && title.trim() !== task.title) void update(task, { title: title.trim() }, 'Title updated')
    else setTitle(task.title)
  }

  const addSubtask = async () => {
    if (!newSub.trim()) return
    await createTask({ projectId: task.projectId, parentTaskId: task.id, title: newSub.trim(), type: task.type, priority: task.priority, assigneeId: task.assigneeId, dueDate: task.dueDate })
    setNewSub('')
    toast.success('Subtask added')
  }

  const copyLink = async () => {
    const url = `${window.location.origin}${paths.task(task.projectId, task.id)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Clipboard unavailable', { description: url })
    }
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <nav aria-label="Task location" className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground">
          {project && <ClientChip clientId={project.clientId} className="text-xs" />}
          <span>/</span>
          {project && (
            <Link to={paths.project(project.id)} onClick={onClose} className="truncate hover:text-foreground hover:underline">
              {project.key}
            </Link>
          )}
          {parent && (
            <>
              <span>/</span>
              <button type="button" onClick={() => openTask(parent.id)} className="truncate hover:text-foreground hover:underline">
                {parent.key}
              </button>
            </>
          )}
          <span>/</span>
          <span className="font-mono text-foreground">{task.key}</span>
        </nav>
        <Menu>
          <MenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Task actions">
              <Ellipsis />
            </Button>
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem onSelect={() => void copyLink()}>
              <Link2 /> Copy link
            </MenuItem>
            <MenuItem disabled={!can.edit.allowed} onSelect={() => setEditingTitle(true)}>
              <Pencil /> Rename
            </MenuItem>
            <MenuSeparator />
            <MenuItem destructive disabled={!canDelete.allowed} onSelect={() => setConfirmDelete(true)}>
              <Trash2 /> Delete task{!canDelete.allowed && <span className="ml-auto text-[11px] text-muted-foreground">Restricted</span>}
            </MenuItem>
          </MenuContent>
        </Menu>
        <D.Close asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Close panel">
            <X />
          </Button>
        </D.Close>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-2">
          {editingTitle ? (
            <Input
              autoFocus
              value={title}
              aria-label="Task title"
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') {
                  e.stopPropagation()
                  setTitle(task.title)
                  setEditingTitle(false)
                }
              }}
              className="h-9 text-base font-semibold"
            />
          ) : (
            <h2
              className={cn('text-lg leading-snug font-semibold', can.edit.allowed && 'cursor-text rounded hover:bg-accent/60')}
              onClick={() => can.edit.allowed && setEditingTitle(true)}
            >
              {task.title}
            </h2>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tooltip content={can.status.allowed ? undefined : can.status.reason}>
              <span>
                <Button
                  variant={done ? 'subtle' : 'secondary'}
                  size="sm"
                  disabled={!can.status.allowed}
                  onClick={() => setStatus(task, done ? 'in_progress' : 'done')}
                >
                  <CheckCircle2 className={cn(done && 'text-tone-green-fg')} />
                  {done ? 'Completed — reopen' : 'Mark complete'}
                </Button>
              </span>
            </Tooltip>
            {!done && task.status !== 'ready_for_qi' && task.type !== 'quality_inspection' && can.status.allowed && (
              <Button variant="ghost" size="sm" onClick={() => setStatus(task, 'ready_for_qi')}>
                <ClipboardCheck /> Send to QI
              </Button>
            )}
            <div className="ml-auto flex w-32 items-center gap-2">
              <ProgressBar value={progress} />
              <span className="text-xs text-muted-foreground tabular">{progress}%</span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 border-y border-border px-5 py-3 sm:grid-cols-2">
          <Prop label="Status">
            <TaskStatusPicker value={task.status} onChange={(s) => setStatus(task, s)} disabled={!can.status.allowed} disabledReason={can.status.reason} />
          </Prop>
          <Prop label="Assignee">
            <UserPicker value={task.assigneeId} onChange={(v) => void update(task, { assigneeId: v }, 'Assignee updated')} disabled={!can.assign.allowed} disabledReason={can.assign.reason} />
          </Prop>
          <Prop label="Priority">
            <PriorityPicker value={task.priority} onChange={(p) => void update(task, { priority: p })} disabled={!can.edit.allowed} disabledReason={can.edit.reason} />
          </Prop>
          <Prop label="Type">
            {can.edit.allowed ? (
              <Select aria-label="Task type" value={task.type} onChange={(e) => void update(task, { type: e.target.value as TaskType })} className="w-44 [&_select]:h-7">
                {TASK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            ) : (
              <span className="text-[13px]">{TASK_TYPES.find((t) => t.id === task.type)?.label}</span>
            )}
          </Prop>
          <Prop label="Start date">
            <DatePicker value={task.startDate} onChange={(d) => void update(task, { startDate: d })} closed disabled={!can.edit.allowed} disabledReason={can.edit.reason} />
          </Prop>
          <Prop label="Due date">
            <DatePicker value={task.dueDate} onChange={(d) => void update(task, { dueDate: d }, 'Due date updated')} showRelative closed={isTaskClosed(task.status)} disabled={!can.edit.allowed} disabledReason={can.edit.reason} />
          </Prop>
          <Prop label="Estimated">
            {subtasks.length ? (
              <span className="text-[13px] tabular">{formatHours(subtasks.reduce((a, s) => a + (s.estimatedHours ?? 0), 0))} <span className="text-xs text-muted-foreground">from subtasks</span></span>
            ) : (
              <InlineNumber label="Estimated hours" value={task.estimatedHours} onChange={(v) => void update(task, { estimatedHours: v }, 'Estimate updated')} disabled={!can.hours.allowed} disabledReason={can.hours.reason} />
            )}
          </Prop>
          <Prop label="Actual">
            {subtasks.length ? (
              <span className="text-[13px] tabular">{formatHours(subtasks.reduce((a, s) => a + (s.actualHours ?? 0), 0))} <span className="text-xs text-muted-foreground">from subtasks</span></span>
            ) : (
              <InlineNumber label="Actual hours" value={task.actualHours} onChange={(v) => void update(task, { actualHours: v }, 'Hours logged')} disabled={!can.hours.allowed} disabledReason={can.hours.reason} />
            )}
          </Prop>
          <Prop label="Project">
            {project ? (
              <Link to={paths.project(project.id)} onClick={onClose} className="block truncate text-[13px] hover:underline">
                {project.title}
              </Link>
            ) : '—'}
          </Prop>
          <Prop label="Reporter">
            <UserChip userId={task.reporterId} />
          </Prop>
        </dl>

        <section className="px-5 py-4" aria-labelledby="desc-h">
          <div className="mb-1.5 flex items-center justify-between">
            <h3 id="desc-h" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</h3>
            {can.edit.allowed && !editingDesc && (
              <Button variant="ghost" size="xs" onClick={() => setEditingDesc(true)}>
                <Pencil /> Edit
              </Button>
            )}
          </div>
          {editingDesc ? (
            <div>
              <Textarea autoFocus aria-label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[110px]" />
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setDesc(task.description); setEditingDesc(false) }}>Cancel</Button>
                <Button size="sm" variant="primary" onClick={() => { void update(task, { description: desc.trim() }, 'Description saved'); setEditingDesc(false) }}>
                  <Check /> Save
                </Button>
              </div>
            </div>
          ) : task.description ? (
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-[13px] text-subtle-foreground">No description yet.</p>
          )}
        </section>

        {!task.parentTaskId && (
          <section className="border-t border-border px-5 py-4" aria-labelledby="sub-h">
            <div className="mb-2 flex items-center justify-between">
              <h3 id="sub-h" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Subtasks <span className="ml-1 tabular">{subtasks.filter((s) => s.status === 'done').length}/{subtasks.length}</span>
              </h3>
              {canSubtask.allowed && (
                <Button variant="ghost" size="xs" onClick={() => openCreate({ projectId: task.projectId, parentTaskId: task.id })}>
                  <Plus /> Detailed subtask
                </Button>
              )}
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 px-2.5 py-1.5">
                  <button
                    type="button"
                    disabled={!can.status.allowed}
                    onClick={() => setStatus(s, s.status === 'done' ? 'in_progress' : 'done')}
                    aria-label={s.status === 'done' ? `Reopen ${s.title}` : `Complete ${s.title}`}
                    className="flex size-5 items-center justify-center rounded-full hover:bg-accent disabled:cursor-not-allowed"
                  >
                    <StatusIcon status={s.status} kind="task" />
                  </button>
                  <button type="button" onClick={() => openTask(s.id)} className={cn('min-w-0 flex-1 truncate text-left text-[13px] hover:underline', s.status === 'done' && 'text-muted-foreground line-through')}>
                    {s.title}
                  </button>
                  <span className="text-xs text-muted-foreground tabular">{formatHours(s.estimatedHours, '')}</span>
                  <UserPicker variant="avatar" value={s.assigneeId} onChange={(v) => void update(s, { assigneeId: v })} disabled={!can.assign.allowed} disabledReason={can.assign.reason} />
                </li>
              ))}
              {canSubtask.allowed ? (
                <li className="flex items-center gap-2 px-2.5 py-1">
                  <Plus className="size-3.5 text-subtle-foreground" />
                  <input
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void addSubtask()}
                    placeholder="Add a subtask and press Enter"
                    aria-label="New subtask title"
                    className="h-7 flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle-foreground"
                  />
                  {newSub && <Button size="xs" variant="primary" onClick={() => void addSubtask()}>Add</Button>}
                </li>
              ) : (
                !subtasks.length && <li className="px-2.5 py-2 text-[13px] text-subtle-foreground">No subtasks.</li>
              )}
            </ul>
          </section>
        )}

        {(qi.length > 0 || taskBugs.length > 0) && (
          <section className="border-t border-border px-5 py-4" aria-labelledby="qi-h">
            <h3 id="qi-h" className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Quality inspection</h3>
            <ul className="space-y-1.5">
              {qi.map((q) => (
                <li key={q.id} className="flex items-center gap-2 text-[13px]">
                  <span className="w-16 text-xs text-muted-foreground">Round {q.round}</span>
                  <MetaBadge list={QI_STATUSES} id={q.status} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{q.notes}</span>
                  <span className="text-xs text-subtle-foreground">{relativeTime(q.completedAt ?? q.startedAt ?? q.submittedAt)}</span>
                </li>
              ))}
              {taskBugs.map((b) => (
                <li key={b.id} className="flex items-center gap-2 text-[13px]">
                  <Badge tone="red">{b.key}</Badge>
                  <Link to={paths.bug(b.id)} onClick={onClose} className="min-w-0 flex-1 truncate hover:underline">{b.title}</Link>
                  <span className="text-xs text-muted-foreground capitalize">{b.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
            <Link to="/qi" onClick={onClose} className="mt-2 inline-block text-xs text-primary hover:underline">Open QI workspace</Link>
          </section>
        )}

        <section className="border-t border-border px-5 py-4">
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments" count={taskComments.length}>Comments</TabsTrigger>
              <TabsTrigger value="activity" count={taskActivity.length}>Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="pt-3">
              {taskComments.length ? (
                <ul className="mb-3 divide-y divide-border">{taskComments.map((c) => <CommentItem key={c.id} comment={c} />)}</ul>
              ) : (
                <p className="mb-3 text-[13px] text-subtle-foreground">No comments yet. Start the conversation below.</p>
              )}
              <CommentComposer taskId={task.id} projectId={task.projectId} />
            </TabsContent>
            <TabsContent value="activity" className="pt-2">
              <ActivityFeed events={taskActivity} compact />
              <p className="mt-2 text-[11px] text-subtle-foreground">Created {formatDateTime(task.createdAt)} · Local prototype data</p>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${task.key}?`}
        destructive
        confirmLabel="Delete task"
        description={
          <>
            “{task.title}”{subtasks.length > 0 && <> and its {subtasks.length} subtask{subtasks.length > 1 ? 's' : ''}</>} will be removed with its comments and QI records. This only affects local prototype data.
          </>
        }
        onConfirm={() => {
          void deleteTask(task.id)
          toast.success(`${task.key} deleted`)
          onClose()
        }}
      >
        <div className="mt-3"><TaskStatusBadge status={task.status} /></div>
      </ConfirmDialog>
    </>
  )
}
