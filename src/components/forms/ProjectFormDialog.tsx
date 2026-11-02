import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { Priority, Project, ProjectStatus, ProjectType } from '@/types'
import { useUI } from '@/services/ui'
import { createProject, updateProject } from '@/services/api'
import { useDb } from '@/services/store'
import { useCan, useClients, useCurrentUser } from '@/hooks/useData'
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/form'
import { DatePicker, MultiUserPicker, UserPicker } from '@/components/common/pickers'
import { FormDialog, FormSection } from './FormDialog'
import { DEFAULT_PROJECT_STATUSES, PRIORITIES, PROJECT_TYPES } from '@/lib/workflow'
import { isValidUrl, uid } from '@/lib/utils'
import { compareDates, dayOffset } from '@/lib/dates'
import { paths } from '@/lib/routes'

interface FormState {
  title: string
  clientId: string
  type: ProjectType
  templateId: string
  createDefaultTasks: boolean
  priority: Priority
  status: ProjectStatus
  ownerId?: string
  accountManagerId?: string
  leadId?: string
  developerIds: string[]
  designerIds: string[]
  qiOwnerId?: string
  croOwnerId?: string
  abOwnerId?: string
  startDate?: string
  originalDueDate?: string
  revisedDueDate?: string
  projectedDevHours: string
  bufferHours: string
  projectedQiHours: string
  daysNeeded: string
  percentPushedToQi: string
  clientPortalUrl: string
  description: string
  requirements: string
  tags: string
  custom: Record<string, string>
}

const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
const str = (v?: number) => (v === undefined ? '' : String(v))

function fromProject(p: Project): FormState {
  return {
    title: p.title, clientId: p.clientId, type: p.type, templateId: p.templateId ?? '', createDefaultTasks: false,
    priority: p.priority, status: p.status, ownerId: p.ownerId, accountManagerId: p.accountManagerId, leadId: p.leadId,
    developerIds: p.developerIds, designerIds: p.designerIds, qiOwnerId: p.qiOwnerId, croOwnerId: p.croOwnerId, abOwnerId: p.abOwnerId,
    startDate: p.startDate, originalDueDate: p.originalDueDate, revisedDueDate: p.revisedDueDate,
    projectedDevHours: str(p.projectedDevHours), bufferHours: str(p.bufferHours), projectedQiHours: str(p.projectedQiHours),
    daysNeeded: str(p.daysNeeded), percentPushedToQi: str(p.percentPushedToQi), clientPortalUrl: p.clientPortalUrl ?? '',
    description: p.description, requirements: p.requirements.map((r) => r.text).join('\n'), tags: p.tags.join(', '),
    custom: Object.fromEntries(p.customFields.map((c) => [c.fieldId, c.value === null ? '' : String(c.value)])),
  }
}

/** Global create/edit project dialog, opened through the UI store. */
export function ProjectFormDialog() {
  const state = useUI((s) => s.createProject)
  const close = useUI((s) => s.closeCreateProject)
  const editing = useDb((s) => (state.editId ? s.projects.find((p) => p.id === state.editId) : undefined))
  if (!state.open) return null
  return <ProjectForm key={state.editId ?? 'new'} project={editing} defaultClientId={state.clientId} defaultTemplateId={state.templateId} onClose={close} />
}

function ProjectForm({ project, defaultClientId, defaultTemplateId, onClose }: { project?: Project; defaultClientId?: string; defaultTemplateId?: string; onClose: () => void }) {
  const clients = useClients()
  const templates = useDb((s) => s.templates)
  const customFields = useDb((s) => s.customFields)
  const me = useCurrentUser()
  const navigate = useNavigate()
  const canAssign = useCan('project.assign')
  const canDates = useCan('project.editDates')

  const initial = useMemo<FormState>(() => {
    if (project) return fromProject(project)
    const client = clients.find((c) => c.id === defaultClientId)
    const tpl = templates.find((t) => t.id === defaultTemplateId) ?? templates.find((t) => t.id === 'tpl_development')
    return {
      title: '', clientId: defaultClientId ?? '', type: tpl?.type ?? 'development', templateId: tpl?.id ?? '', createDefaultTasks: true,
      priority: tpl?.defaultPriority ?? 'medium', status: 'project_setup', ownerId: me.id, accountManagerId: client?.accountManagerId ?? (me.role === 'account_manager' ? me.id : undefined),
      developerIds: [], designerIds: [], startDate: dayOffset(1), originalDueDate: undefined,
      projectedDevHours: '', bufferHours: '', projectedQiHours: '', daysNeeded: '', percentPushedToQi: '', clientPortalUrl: '',
      description: '', requirements: '', tags: '', custom: {},
    }
  }, [project, clients, defaultClientId, defaultTemplateId, templates, me])

  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  // Default the account manager from the selected client.
  useEffect(() => {
    if (project) return
    const c = clients.find((x) => x.id === form.clientId)
    if (c && !form.accountManagerId) setForm((f) => ({ ...f, accountManagerId: c.accountManagerId }))
  }, [form.clientId, form.accountManagerId, clients, project])

  const template = templates.find((t) => t.id === form.templateId)
  const typeFields = customFields.filter((f) => f.appliesTo.includes(form.type))
  const dev = num(form.projectedDevHours)
  const suggestion = template && dev ? { buffer: Math.round(dev * template.bufferRatio * 2) / 2, qi: Math.round(dev * template.qiRatio * 2) / 2 } : null

  const validate = () => {
    const e: typeof errors = {}
    if (form.title.trim().length < 5) e.title = 'Enter a descriptive title (at least 5 characters).'
    if (!form.clientId) e.clientId = 'Select a client.'
    if (!form.ownerId) e.ownerId = 'Select a project owner.'
    if (!form.accountManagerId) e.accountManagerId = 'Select an account manager.'
    if (!form.originalDueDate) e.originalDueDate = 'Set the original due date.'
    if (form.startDate && form.originalDueDate && compareDates(form.originalDueDate, form.startDate) < 0) e.originalDueDate = 'Due date must be on or after the start date.'
    if (form.revisedDueDate && form.startDate && compareDates(form.revisedDueDate, form.startDate) < 0) e.revisedDueDate = 'Revised date must be on or after the start date.'
    if (form.clientPortalUrl && !isValidUrl(form.clientPortalUrl)) e.clientPortalUrl = 'Enter a full URL starting with https://'
    for (const k of ['projectedDevHours', 'bufferHours', 'projectedQiHours', 'daysNeeded'] as const) {
      const v = num(form[k])
      if (v !== undefined && (Number.isNaN(v) || v < 0)) e[k] = 'Must be a positive number.'
    }
    const pct = num(form.percentPushedToQi)
    if (pct !== undefined && (Number.isNaN(pct) || pct < 0 || pct > 100)) e.percentPushedToQi = 'Enter a value from 0 to 100.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    const existingReqs = project?.requirements ?? []
    const requirements = form.requirements
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text) => existingReqs.find((r) => r.text === text) ?? { id: uid('r'), text, done: false })
    const payload = {
      title: form.title.trim(), clientId: form.clientId, type: form.type, templateId: form.templateId || undefined,
      priority: form.priority, status: form.status, ownerId: form.ownerId!, accountManagerId: form.accountManagerId!,
      leadId: form.leadId, developerIds: form.developerIds, designerIds: form.designerIds, qiOwnerId: form.qiOwnerId,
      croOwnerId: form.type === 'cro' ? form.croOwnerId : project?.croOwnerId,
      abOwnerId: form.type === 'ab_testing' ? form.abOwnerId : project?.abOwnerId,
      startDate: form.startDate, originalDueDate: form.originalDueDate, revisedDueDate: form.revisedDueDate,
      projectedDevHours: num(form.projectedDevHours), bufferHours: num(form.bufferHours), projectedQiHours: num(form.projectedQiHours),
      daysNeeded: num(form.daysNeeded), percentPushedToQi: num(form.percentPushedToQi),
      clientPortalUrl: form.clientPortalUrl.trim() || undefined, description: form.description.trim(), requirements,
      tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      customFields: typeFields.filter((f) => form.custom[f.id]).map((f) => ({ fieldId: f.id, value: f.kind === 'number' ? Number(form.custom[f.id]) : form.custom[f.id] })),
    }
    if (project) {
      await updateProject(project.id, payload)
      toast.success('Project updated')
      onClose()
    } else {
      const created = await createProject({ ...payload, createDefaultTasks: form.createDefaultTasks })
      toast.success(`Created ${created.key}`, { description: created.title })
      onClose()
      navigate(paths.project(created.id))
    }
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={project ? `Edit ${project.key}` : 'New project'}
      description={project ? project.title : 'Create a project card. Required fields are marked with an asterisk.'}
      dirty={dirty}
      onSubmit={submit}
      submitLabel={project ? 'Save changes' : 'Create project'}
      size="xl"
      footerStart={dirty ? 'Unsaved changes' : undefined}
    >
      <FormSection title="Project">
        <Field label="Title" required error={errors.title} className="sm:col-span-2">
          {(p) => <Input {...p} autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. SF - Release Theme Migration Phase 6: Account Pages" />}
        </Field>
        <Field label="Client" required error={errors.clientId}>
          {(p) => (
            <Select {...p} value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Project type" required>
          {(p) => (
            <Select
              {...p}
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as ProjectType
                const tpl = templates.find((t) => t.type === type)
                setForm((f) => ({ ...f, type, templateId: project ? f.templateId : (tpl?.id ?? ''), priority: project ? f.priority : (tpl?.defaultPriority ?? f.priority) }))
              }}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          )}
        </Field>
        {!project && (
          <>
            <Field label="Template" hint={template?.description}>
              {(p) => (
                <Select {...p} value={form.templateId} onChange={(e) => set('templateId', e.target.value)}>
                  <option value="">No template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-[13px]">
                <Checkbox checked={form.createDefaultTasks} onChange={(v) => set('createDefaultTasks', v)} label="Create default tasks" disabled={!template?.defaultTasks.length} />
                Create {template?.defaultTasks.length ?? 0} default tasks from template
              </label>
            </div>
          </>
        )}
        <Field label="Priority">
          {(p) => (
            <Select {...p} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {PRIORITIES.map((x) => (
                <option key={x.id} value={x.id}>{x.label}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Status">
          {(p) => (
            <Select {...p} value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
              {DEFAULT_PROJECT_STATUSES.map((x) => (
                <option key={x.id} value={x.id}>{x.label}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(p) => <Textarea {...p} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is being delivered and why" />}
        </Field>
        <Field label="Requirements" hint="One requirement per line. They become a checklist on the project." className="sm:col-span-2">
          {(p) => <Textarea {...p} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} placeholder={'Page matches approved design on all breakpoints\nSection settings editable in theme editor'} />}
        </Field>
      </FormSection>

      <FormSection title="People" description={!canAssign.allowed ? canAssign.reason : undefined}>
        <Field label="Project owner" required error={errors.ownerId}>
          {(p) => <UserPicker id={p.id} variant="field" value={form.ownerId} onChange={(v) => set('ownerId', v)} allowNone={false} disabled={!!project && !canAssign.allowed} disabledReason={canAssign.reason} />}
        </Field>
        <Field label="Account manager" required error={errors.accountManagerId}>
          {(p) => <UserPicker id={p.id} variant="field" roles={['account_manager', 'admin']} value={form.accountManagerId} onChange={(v) => set('accountManagerId', v)} allowNone={false} disabled={!!project && !canAssign.allowed} disabledReason={canAssign.reason} />}
        </Field>
        <Field label="Lead">
          {(p) => <UserPicker id={p.id} variant="field" roles={['lead']} value={form.leadId} onChange={(v) => set('leadId', v)} disabled={!!project && !canAssign.allowed} disabledReason={canAssign.reason} />}
        </Field>
        <Field label="QI owner">
          {(p) => <UserPicker id={p.id} variant="field" roles={['qi']} value={form.qiOwnerId} onChange={(v) => set('qiOwnerId', v)} disabled={!!project && !canAssign.allowed} disabledReason={canAssign.reason} />}
        </Field>
        <Field label="Developers">
          {(p) => <MultiUserPicker id={p.id} roles={['developer', 'lead']} value={form.developerIds} onChange={(v) => set('developerIds', v)} disabled={!!project && !canAssign.allowed} disabledReason={canAssign.reason} />}
        </Field>
        <Field label="Designers">
          {(p) => <MultiUserPicker id={p.id} roles={['designer']} value={form.designerIds} onChange={(v) => set('designerIds', v)} disabled={!!project && !canAssign.allowed} disabledReason={canAssign.reason} />}
        </Field>
        {form.type === 'cro' && (
          <Field label="CRO owner">
            {(p) => <UserPicker id={p.id} variant="field" roles={['cro']} value={form.croOwnerId} onChange={(v) => set('croOwnerId', v)} />}
          </Field>
        )}
        {form.type === 'ab_testing' && (
          <Field label="A/B testing owner">
            {(p) => <UserPicker id={p.id} variant="field" roles={['ab_testing']} value={form.abOwnerId} onChange={(v) => set('abOwnerId', v)} />}
          </Field>
        )}
      </FormSection>

      <FormSection title="Schedule & estimates" description="Manual projections. Task-based totals are calculated separately on the project.">
        <Field label="Start date">
          {(p) => <DatePicker id={p.id} variant="field" value={form.startDate} onChange={(v) => set('startDate', v)} disabled={!!project && !canDates.allowed} disabledReason={canDates.reason} />}
        </Field>
        <Field label="Original due date" required error={errors.originalDueDate}>
          {(p) => <DatePicker id={p.id} variant="field" value={form.originalDueDate} onChange={(v) => set('originalDueDate', v)} disabled={!!project && !canDates.allowed} disabledReason={canDates.reason} />}
        </Field>
        {project && (
          <Field label="Revised due date" error={errors.revisedDueDate} hint="Keep the original date for on-time reporting.">
            {(p) => <DatePicker id={p.id} variant="field" value={form.revisedDueDate} onChange={(v) => set('revisedDueDate', v)} disabled={!canDates.allowed} disabledReason={canDates.reason} />}
          </Field>
        )}
        <Field label="Days needed" error={errors.daysNeeded}>
          {(p) => <Input {...p} type="number" min={0} step={0.5} value={form.daysNeeded} onChange={(e) => set('daysNeeded', e.target.value)} />}
        </Field>
        <Field label="Projected dev hours" error={errors.projectedDevHours}>
          {(p) => <Input {...p} type="number" min={0} step={0.5} value={form.projectedDevHours} onChange={(e) => set('projectedDevHours', e.target.value)} />}
        </Field>
        <Field label="Buffer hours" error={errors.bufferHours} hint={suggestion ? `Template suggests ${suggestion.buffer}h` : undefined}>
          {(p) => <Input {...p} type="number" min={0} step={0.5} value={form.bufferHours} onChange={(e) => set('bufferHours', e.target.value)} />}
        </Field>
        <Field label="Projected QI hours" error={errors.projectedQiHours} hint={suggestion ? `Template suggests ${suggestion.qi}h` : undefined}>
          {(p) => <Input {...p} type="number" min={0} step={0.5} value={form.projectedQiHours} onChange={(e) => set('projectedQiHours', e.target.value)} />}
        </Field>
        {project && (
          <Field label="% pushed to QI (recorded)" error={errors.percentPushedToQi}>
            {(p) => <Input {...p} type="number" min={0} max={100} value={form.percentPushedToQi} onChange={(e) => set('percentPushedToQi', e.target.value)} />}
          </Field>
        )}
      </FormSection>

      <FormSection title="Links & metadata">
        <Field label="Client portal URL" error={errors.clientPortalUrl} className="sm:col-span-2">
          {(p) => <Input {...p} type="url" value={form.clientPortalUrl} onChange={(e) => set('clientPortalUrl', e.target.value)} placeholder="https://portal.ecomworkspace.example/…" />}
        </Field>
        <Field label="Tags" hint="Comma separated" className="sm:col-span-2">
          {(p) => <Input {...p} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="theme-migration, phase-6" />}
        </Field>
        {typeFields.map((f) => (
          <Field key={f.id} label={f.label} hint={f.description}>
            {(p) =>
              f.kind === 'select' ? (
                <Select {...p} value={form.custom[f.id] ?? ''} onChange={(e) => set('custom', { ...form.custom, [f.id]: e.target.value })}>
                  <option value="">—</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
              ) : (
                <Input {...p} type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'} value={form.custom[f.id] ?? ''} onChange={(e) => set('custom', { ...form.custom, [f.id]: e.target.value })} />
              )
            }
          </Field>
        ))}
      </FormSection>
    </FormDialog>
  )
}
