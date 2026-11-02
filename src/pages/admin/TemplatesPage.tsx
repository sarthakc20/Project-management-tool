import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { ProjectTemplate, TaskType } from '@/types'
import { useBreadcrumbs, useUI } from '@/services/ui'
import { useDb, db } from '@/services/store'
import { useCan } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { RestrictedNotice } from '@/components/common/gate'
import { ProjectTypeLabel, TaskTypeLabel } from '@/components/common/badges'
import { FormDialog, FormSection } from '@/components/forms/FormDialog'
import { TASK_TYPES } from '@/lib/workflow'

export function TemplatesPage() {
  useDocumentTitle('Project Templates')
  useBreadcrumbs([{ label: 'Administration' }, { label: 'Project Templates' }])
  const { templates, customFields } = useDb()
  const can = useCan('admin.templates')
  const canCreate = useCan('project.create')
  const openCreate = useUI((s) => s.openCreateProject)
  const [editing, setEditing] = useState<ProjectTemplate | null>(null)
  return (
    <div>
      <PageHeader title="Project Templates" description="Templates pre-fill project type, priority, department fields and default tasks" />
      <PageBody className="space-y-4">
        {!can.allowed && <RestrictedNotice>{can.reason}. Templates are shown read-only.</RestrictedNotice>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <article key={t.id} className="flex flex-col rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">{t.name}</h2>
                  <ProjectTypeLabel type={t.type} className="text-xs" />
                </div>
                {can.allowed && <Button size="icon-sm" variant="ghost" aria-label={`Edit ${t.name}`} onClick={() => setEditing(t)}><Pencil /></Button>}
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">{t.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <Badge>Buffer {Math.round(t.bufferRatio * 100)}% of dev</Badge>
                <Badge>QI {Math.round(t.qiRatio * 100)}% of dev</Badge>
                {t.customFieldIds.map((id) => <Badge key={id} tone="violet">{customFields.find((c) => c.id === id)?.label}</Badge>)}
              </div>
              <ul className="mt-3 flex-1 space-y-1 border-t border-border pt-3">
                {t.defaultTasks.length ? t.defaultTasks.map((d, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate">{d.title}</span>
                    <TaskTypeLabel type={d.type} className="shrink-0 text-xs" />
                  </li>
                )) : <li className="text-[13px] text-subtle-foreground">No default tasks</li>}
              </ul>
              {canCreate.allowed && (
                <Button className="mt-4 self-start" size="sm" onClick={() => openCreate({ templateId: t.id })}><Plus /> New project from template</Button>
              )}
            </article>
          ))}
        </div>
      </PageBody>
      {editing && <TemplateForm template={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function TemplateForm({ template, onClose }: { template: ProjectTemplate; onClose: () => void }) {
  const initial = { name: template.name, description: template.description, buffer: String(Math.round(template.bufferRatio * 100)), qi: String(Math.round(template.qiRatio * 100)), tasks: template.defaultTasks }
  const [f, setF] = useState(initial)
  const [error, setError] = useState('')
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Edit template: ${template.name}`}
      description="Changes apply to projects created afterwards. Existing projects are not modified."
      dirty={JSON.stringify(f) !== JSON.stringify(initial)}
      submitLabel="Save template"
      onSubmit={() => {
        if (!f.name.trim()) return setError('Enter a name.')
        if (f.tasks.some((t) => !t.title.trim())) return setError('Every default task needs a title.')
        // TODO(BACKEND): Persist template versions via the API so edits are audited and reversible.
        db.set((s) => ({
          templates: s.templates.map((t) => (t.id === template.id ? { ...t, name: f.name.trim(), description: f.description.trim(), bufferRatio: Number(f.buffer) / 100 || 0, qiRatio: Number(f.qi) / 100 || 0, defaultTasks: f.tasks.map((x) => ({ ...x, title: x.title.trim() })) } : t)),
        }))
        toast.success('Template saved')
        onClose()
      }}
    >
      <FormSection title="Template">
        <Field label="Name" required error={error && !f.name.trim() ? error : undefined}>{(p) => <Input {...p} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Buffer % of dev">{(p) => <Input {...p} type="number" min={0} max={100} value={f.buffer} onChange={(e) => setF({ ...f, buffer: e.target.value })} />}</Field>
          <Field label="QI % of dev">{(p) => <Input {...p} type="number" min={0} max={100} value={f.qi} onChange={(e) => setF({ ...f, qi: e.target.value })} />}</Field>
        </div>
        <Field label="Description" className="sm:col-span-2">{(p) => <Textarea {...p} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
      </FormSection>
      <FormSection title="Default tasks">
        <div className="space-y-2 sm:col-span-2">
          {f.tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input aria-label={`Task ${i + 1} title`} value={t.title} onChange={(e) => setF({ ...f, tasks: f.tasks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
              <Select aria-label={`Task ${i + 1} type`} value={t.type} onChange={(e) => setF({ ...f, tasks: f.tasks.map((x, j) => (j === i ? { ...x, type: e.target.value as TaskType } : x)) })} className="w-44 shrink-0">
                {TASK_TYPES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </Select>
              <Button size="icon" variant="destructive-ghost" aria-label={`Remove task ${i + 1}`} onClick={() => setF({ ...f, tasks: f.tasks.filter((_, j) => j !== i) })}><Trash2 /></Button>
            </div>
          ))}
          <Button size="sm" onClick={() => setF({ ...f, tasks: [...f.tasks, { title: '', type: 'development' }] })}><Plus /> Add default task</Button>
          {error && <p className="text-xs text-tone-red-fg">{error}</p>}
        </div>
      </FormSection>
    </FormDialog>
  )
}
