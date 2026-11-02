import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { Priority, TaskStatus, TaskType } from '@/types'
import { useUI } from '@/services/ui'
import { createTask } from '@/services/api'
import { useAllProjects, useAllTasks, useCan, useClientMap } from '@/hooks/useData'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { DatePicker, UserPicker } from '@/components/common/pickers'
import { FormDialog, FormSection } from './FormDialog'
import { DEFAULT_TASK_STATUSES, PRIORITIES, TASK_TYPES } from '@/lib/workflow'
import { compareDates } from '@/lib/dates'
import { paths } from '@/lib/routes'

export function TaskFormDialog() {
  const state = useUI((s) => s.createTask)
  const close = useUI((s) => s.closeCreateTask)
  if (!state.open) return null
  return (
    <TaskForm
      key={`${state.projectId}-${state.parentTaskId}`}
      projectId={state.projectId}
      parentTaskId={state.parentTaskId}
      status={state.status as TaskStatus | undefined}
      onClose={close}
    />
  )
}

function TaskForm({ projectId, parentTaskId, status, onClose }: { projectId?: string; parentTaskId?: string; status?: TaskStatus; onClose: () => void }) {
  const projects = useAllProjects()
  const tasks = useAllTasks()
  const clients = useClientMap()
  const navigate = useNavigate()
  const canTask = useCan('task.create')
  const canAssign = useCan('task.assign')
  const parent = tasks.find((t) => t.id === parentTaskId)

  const initial = useMemo(
    () => ({
      title: '',
      projectId: projectId ?? parent?.projectId ?? '',
      parentTaskId: parentTaskId ?? '',
      type: (parent?.type ?? 'development') as TaskType,
      status: status ?? ('backlog' as TaskStatus),
      priority: (parent?.priority ?? 'medium') as Priority,
      assigneeId: parent?.assigneeId as string | undefined,
      startDate: undefined as string | undefined,
      dueDate: parent?.dueDate as string | undefined,
      estimatedHours: '',
      description: '',
    }),
    [projectId, parentTaskId, parent, status],
  )
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const parentOptions = tasks.filter((t) => t.projectId === form.projectId && !t.parentTaskId)

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Enter a task title.'
    if (!form.projectId) e.projectId = 'Select a project.'
    if (!form.parentTaskId && !canTask.allowed) e.parentTaskId = 'Your role can only create subtasks.'
    if (form.startDate && form.dueDate && compareDates(form.dueDate, form.startDate) < 0) e.dueDate = 'Due date must be on or after the start date.'
    const est = form.estimatedHours === '' ? undefined : Number(form.estimatedHours)
    if (est !== undefined && (Number.isNaN(est) || est < 0)) e.estimatedHours = 'Must be a positive number.'
    setErrors(e)
    if (Object.keys(e).length) return
    const created = await createTask({
      projectId: form.projectId,
      parentTaskId: form.parentTaskId || undefined,
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId,
      startDate: form.startDate,
      dueDate: form.dueDate,
      estimatedHours: est,
      description: form.description.trim(),
    })
    toast.success(`${form.parentTaskId ? 'Subtask' : 'Task'} created`, {
      description: `${created.key} · ${created.title}`,
      action: { label: 'Open', onClick: () => navigate(paths.task(created.projectId, created.id)) },
    })
    onClose()
  }

  const permission = form.parentTaskId ? 'subtask' : 'task'
  return (
    <FormDialog
      open
      onClose={onClose}
      title={form.parentTaskId ? 'New subtask' : 'New task'}
      description={parent ? `Under ${parent.key} · ${parent.title}` : undefined}
      dirty={dirty}
      onSubmit={submit}
      submitLabel={`Create ${permission}`}
      size="lg"
    >
      <FormSection title="Details">
        <Field label="Title" required error={errors.title} className="sm:col-span-2">
          {(p) => <Input {...p} autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What needs to be done?" />}
        </Field>
        <Field label="Project" required error={errors.projectId}>
          {(p) => (
            <Select {...p} value={form.projectId} disabled={Boolean(parentTaskId)} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, parentTaskId: '' }))}>
              <option value="">Select project…</option>
              {projects
                .filter((x) => !x.archived)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.key} · {x.title.length > 60 ? `${x.title.slice(0, 60)}…` : x.title} ({clients.get(x.clientId)?.name})
                  </option>
                ))}
            </Select>
          )}
        </Field>
        <Field label="Parent task" hint="Optional — makes this a subtask" error={errors.parentTaskId}>
          {(p) => (
            <Select {...p} value={form.parentTaskId} disabled={!form.projectId || Boolean(parentTaskId)} onChange={(e) => set('parentTaskId', e.target.value)}>
              <option value="">None (top-level task)</option>
              {parentOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.key} · {t.title}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Type">
          {(p) => (
            <Select {...p} value={form.type} onChange={(e) => set('type', e.target.value as TaskType)}>
              {TASK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Status">
          {(p) => (
            <Select {...p} value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
              {DEFAULT_TASK_STATUSES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(p) => <Textarea {...p} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Acceptance criteria, links, notes…" />}
        </Field>
      </FormSection>
      <FormSection title="Planning">
        <Field label="Assignee" hint={!canAssign.allowed ? 'Your role can create but not assign — leave unassigned for a lead to assign.' : undefined}>
          {(p) => <UserPicker id={p.id} variant="field" value={form.assigneeId} onChange={(v) => set('assigneeId', v)} disabled={!canAssign.allowed} disabledReason={canAssign.reason} />}
        </Field>
        <Field label="Priority">
          {(p) => (
            <Select {...p} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {PRIORITIES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Start date">
          {(p) => <DatePicker id={p.id} variant="field" value={form.startDate} onChange={(v) => set('startDate', v)} />}
        </Field>
        <Field label="Due date" error={errors.dueDate}>
          {(p) => <DatePicker id={p.id} variant="field" value={form.dueDate} onChange={(v) => set('dueDate', v)} />}
        </Field>
        <Field label="Estimated hours" error={errors.estimatedHours}>
          {(p) => <Input {...p} type="number" min={0} step={0.5} value={form.estimatedHours} onChange={(e) => set('estimatedHours', e.target.value)} />}
        </Field>
      </FormSection>
    </FormDialog>
  )
}
