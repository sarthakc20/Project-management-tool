import { useState } from 'react'
import { toast } from 'sonner'
import type { BugSeverity } from '@/types'
import { createBug } from '@/services/api'
import { useAllProjects, useAllTasks } from '@/hooks/useData'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { UserPicker } from '@/components/common/pickers'
import { FormDialog, FormSection } from '@/components/forms/FormDialog'
import { BUG_SEVERITIES } from '@/lib/workflow'

export function BugFormDialog({
  onClose,
  defaults,
}: {
  onClose: () => void
  defaults?: { projectId?: string; taskId?: string; qiRecordId?: string; assigneeId?: string }
}) {
  const projects = useAllProjects()
  const tasks = useAllTasks()
  const initial = {
    projectId: defaults?.projectId ?? '',
    taskId: defaults?.taskId ?? '',
    title: '',
    severity: 'major' as BugSeverity,
    assigneeId: defaults?.assigneeId ?? (defaults?.taskId ? tasks.find((t) => t.id === defaults.taskId)?.assigneeId : undefined),
    description: '',
    stepsToReproduce: '',
    environment: '',
  }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Report a bug"
      description={defaults?.qiRecordId ? 'Linked to the current QI inspection' : undefined}
      dirty={JSON.stringify(form) !== JSON.stringify(initial)}
      submitLabel="Create bug"
      onSubmit={async () => {
        const e: Record<string, string> = {}
        if (!form.projectId) e.projectId = 'Select a project.'
        if (form.title.trim().length < 5) e.title = 'Describe the bug in at least 5 characters.'
        if (!form.description.trim()) e.description = 'Add a defect description.'
        setErrors(e)
        if (Object.keys(e).length) return
        const bug = await createBug({
          projectId: form.projectId,
          taskId: form.taskId || undefined,
          qiRecordId: defaults?.qiRecordId,
          title: form.title.trim(),
          severity: form.severity,
          status: 'open',
          assigneeId: form.assigneeId,
          description: form.description.trim(),
          stepsToReproduce: form.stepsToReproduce.trim(),
          environment: form.environment.trim(),
        })
        toast.success(`Bug ${bug.key} created`, { description: bug.title })
        onClose()
      }}
    >
      <FormSection title="Bug">
        <Field label="Project" required error={errors.projectId}>
          {(p) => (
            <Select {...p} value={form.projectId} disabled={Boolean(defaults?.projectId)} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, taskId: '' }))}>
              <option value="">Select project…</option>
              {projects.filter((x) => !x.archived).map((x) => <option key={x.id} value={x.id}>{x.key} · {x.title.slice(0, 55)}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Related task">
          {(p) => (
            <Select {...p} value={form.taskId} disabled={!form.projectId || Boolean(defaults?.taskId)} onChange={(e) => set('taskId', e.target.value)}>
              <option value="">None</option>
              {tasks.filter((t) => t.projectId === form.projectId).map((t) => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Title" required error={errors.title} className="sm:col-span-2">
          {(p) => <Input {...p} autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What is broken?" />}
        </Field>
        <Field label="Severity">
          {(p) => (
            <Select {...p} value={form.severity} onChange={(e) => set('severity', e.target.value as BugSeverity)}>
              {BUG_SEVERITIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Assignee">
          {(p) => <UserPicker id={p.id} variant="field" roles={['developer', 'lead']} value={form.assigneeId} onChange={(v) => set('assigneeId', v)} />}
        </Field>
        <Field label="Defect description" required error={errors.description} className="sm:col-span-2">
          {(p) => <Textarea {...p} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Expected vs actual behaviour" />}
        </Field>
        <Field label="Steps to reproduce" className="sm:col-span-2">
          {(p) => <Textarea {...p} value={form.stepsToReproduce} onChange={(e) => set('stepsToReproduce', e.target.value)} placeholder={'1. Open…\n2. Click…\n3. Observe…'} />}
        </Field>
        <Field label="Environment" className="sm:col-span-2">
          {(p) => <Input {...p} value={form.environment} onChange={(e) => set('environment', e.target.value)} placeholder="Device · OS · Browser" />}
        </Field>
      </FormSection>
    </FormDialog>
  )
}
