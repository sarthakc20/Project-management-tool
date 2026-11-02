import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Bot,
  Bug as BugIcon,
  Calculator,
  Check,
  ChevronDown,
  Clock,
  CodeXml,
  ExternalLink,
  FileText,
  FolderKanban,
  GitPullRequest,
  Pencil,
  Play,
  Plus,
  ShieldCheck,
  Square,
  Target,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { PMStatus, Project, ProjectAutomation, ProjectType, Tone } from '@/types'
import { startQiTimer, stopQiTimer, updateProject } from '@/services/api'
import { useDb } from '@/services/store'
import { useCan, useClient, useUserMap, useUsers } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { Button } from '@/components/ui/button'
import { Badge, ProgressBar } from '@/components/ui/display'
import { Checkbox, Input, Textarea } from '@/components/ui/form'
import { Tooltip } from '@/components/ui/tooltip'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu'
import { DatePicker, InlineNumber, MultiUserPicker, PriorityPicker, UserPicker } from '@/components/common/pickers'
import { ClientChip, UserChip } from '@/components/common/people'
import { MetaBadge, ProjectTypeLabel } from '@/components/common/badges'
import { RichText } from '@/components/activity/RichText'
import { BugFormDialog } from '@/components/qi/BugFormDialog'
import { qiEntryHours, qiTrackedHours, type ProjectStats } from '@/lib/calculations'
import { daysUntil, formatDate, formatDateTime, formatDuration } from '@/lib/dates'
import { PM_STATUSES, PROJECT_TYPES, TONE_BADGE, isProjectClosed } from '@/lib/workflow'
import { cn, formatHours, isValidUrl, uid } from '@/lib/utils'
import { paths } from '@/lib/routes'

// ───────────────────────────── Building blocks ─────────────────────────────

/** Collapsible property group, the equivalent of a Notion card's "… Section" toggles. */
function PropertySection({ title, icon: Icon, tone, children, aside, defaultOpen = true }: { title: string; icon: LucideIcon; tone: Tone; children: ReactNode; aside?: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = `prop-${title.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <section className="rounded-xl border border-border bg-surface" aria-labelledby={id}>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${id}-body`} className="-ml-1 flex min-w-0 items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-accent">
          <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', TONE_BADGE[tone])}><Icon className="size-3.5" /></span>
          <h3 id={id} className="truncate text-[13px] font-semibold">{title}</h3>
          <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        </button>
        <div className="ml-auto">{aside}</div>
      </div>
      {open && <dl id={`${id}-body`} className="border-t border-border px-4 py-2">{children}</dl>}
    </section>
  )
}

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(110px,38%)_1fr] items-center gap-3 py-1.5 sm:grid-cols-[170px_1fr]">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        {children}
        {hint && <span className="text-[11px] text-subtle-foreground">{hint}</span>}
      </dd>
    </div>
  )
}

const Empty = ({ children = 'Empty' }: { children?: ReactNode }) => <span className="text-subtle-foreground">{children}</span>

function SourceTag({ kind }: { kind: 'manual' | 'calculated' | 'recorded' | 'synced' }) {
  const label = { manual: 'Manual', calculated: 'Calculated', recorded: 'Recorded', synced: 'Synced' }[kind]
  const tip = {
    manual: 'Entered by the AM or lead',
    calculated: 'Derived from tasks / other fields — updates automatically',
    recorded: 'Value recorded on the card (carried over from Notion)',
    synced: 'Written by an automation or Time Doctor (sample values in this prototype)',
  }[kind]
  return (
    <Tooltip content={tip}>
      <span className={cn('inline-flex items-center gap-0.5 rounded px-1 text-[10px] font-medium tracking-wide uppercase', kind === 'calculated' ? 'bg-primary-soft text-primary-soft-foreground' : 'bg-muted text-muted-foreground')}>
        {kind === 'calculated' && <Calculator className="size-2.5" />}
        {label}
      </span>
    </Tooltip>
  )
}

function EditableText({
  value,
  onSave,
  disabled,
  multiline,
  placeholder,
  validate,
  render,
}: {
  value?: string
  onSave: (v: string) => void
  disabled?: boolean
  multiline?: boolean
  placeholder: string
  validate?: (v: string) => string | null
  render?: (v: string) => ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [error, setError] = useState<string | null>(null)
  if (!editing)
    return (
      <div className="group flex min-w-0 flex-1 items-start gap-2">
        <div className="min-w-0 flex-1">
          {value ? (render ? render(value) : multiline ? <p className="leading-relaxed whitespace-pre-wrap">{value}</p> : <span className="break-all">{value}</span>) : <Empty>{placeholder}</Empty>}
        </div>
        {!disabled && (
          <Button variant="ghost" size="icon-xs" aria-label={`Edit ${placeholder.toLowerCase()}`} className="opacity-60 group-hover:opacity-100" onClick={() => { setDraft(value ?? ''); setEditing(true) }}>
            <Pencil />
          </Button>
        )}
      </div>
    )
  const save = () => {
    const err = validate?.(draft.trim()) ?? null
    setError(err)
    if (err) return
    onSave(draft.trim())
    setEditing(false)
  }
  return (
    <div className="w-full">
      {multiline ? (
        <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={placeholder} aria-invalid={!!error} className="min-h-40 font-mono text-[12px]" />
      ) : (
        <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={placeholder} aria-invalid={!!error} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }} />
      )}
      {error && <p className="mt-1 text-xs text-tone-red-fg">{error}</p>}
      <div className="mt-1.5 flex gap-1.5">
        <Button size="xs" variant="primary" onClick={save}><Check /> Save</Button>
        <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  )
}

const urlCheck = (v: string) => (v && !isValidUrl(v) ? 'Enter a full URL starting with https://' : null)

function UrlValue({ url, icon: Icon = ExternalLink }: { url: string; icon?: LucideIcon }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex max-w-full min-w-0 items-center gap-1 text-primary hover:underline">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
    </a>
  )
}

function useSave(project: Project) {
  return (u: Partial<Project>, msg = 'Saved') => {
    void updateProject(project.id, u)
    toast.success(msg)
  }
}

/** Last status change: explicit timestamp, else the newest status activity, else creation. */
function useStatusChangedAt(project: Project) {
  const lastEvent = useDb((s) => s.activity.find((a) => a.projectId === project.id && a.type === 'status_changed' && a.meta.field === 'project')?.createdAt)
  const candidates = [project.statusChangedAt, lastEvent].filter(Boolean) as string[]
  return candidates.sort().pop() ?? project.createdAt
}

// ───────────────────────────── Properties ─────────────────────────────

const AUTOMATION_DEFAULTS: ProjectAutomation = { processed: false, addToTimeDoctor: false }

/**
 * All card properties grouped like the Notion project card. Every field the Notion card shows
 * has a home here; manual fields are editable (permission-aware), derived ones are labelled.
 */
export function ProjectProperties({ project, stats }: { project: Project; stats: ProjectStats }) {
  const client = useClient(project.clientId)
  const templates = useDb((s) => s.templates)
  const customFields = useDb((s) => s.customFields)
  const canEdit = useCan('project.edit')
  const canAssign = useCan('project.assign')
  const canDates = useCan('project.editDates')
  const save = useSave(project)
  const statusChangedAt = useStatusChangedAt(project)
  const automation = { ...AUTOMATION_DEFAULTS, ...project.automation }
  const setAutomation = (u: Partial<ProjectAutomation>, msg: string) => save({ automation: { ...automation, ...u } }, msg)
  const reqDone = project.requirements.filter((r) => r.done).length
  const fieldsForType = customFields.filter((f) => f.appliesTo.includes(project.type))
  const variance = stats.actualHours && stats.estimatedHours ? stats.actualHours - stats.estimatedHours : null
  const statusDays = Math.max(0, -(daysUntil(statusChangedAt.slice(0, 10)) ?? 0))
  const template = templates.find((t) => t.id === project.templateId)

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <PropertySection title="Project info" icon={FolderKanban} tone="blue">
          <Row label="Client"><ClientChip clientId={project.clientId} />{client && <Link to={paths.client(client.id, 'board')} className="text-xs text-primary hover:underline">Status board</Link>}</Row>
          <Row label="Project owner"><UserPicker value={project.ownerId} allowNone={false} onChange={(v) => v && save({ ownerId: v }, 'Owner updated')} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></Row>
          <Row label="Account manager"><UserPicker value={project.accountManagerId} roles={['account_manager', 'admin']} allowNone={false} onChange={(v) => v && save({ accountManagerId: v }, 'Account manager updated')} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></Row>
          <Row label="Client portal project">
            {/* TODO(CLIENT-PORTAL): Generate/sync this link from the external client portal API instead of manual entry. */}
            <EditableText value={project.clientPortalUrl} placeholder="Add client portal URL" disabled={!canEdit.allowed} validate={urlCheck} render={(v) => <UrlValue url={v} />} onSave={(v) => save({ clientPortalUrl: v || undefined }, 'Portal link saved')} />
          </Row>
          <Row label="Created">{formatDate(project.createdAt)}</Row>
          <Row label="Template">{template ? template.name : <Empty>None</Empty>}</Row>
          <Row label="Notion source">{project.notionSourceId ? <code className="font-mono text-xs">{project.notionSourceId}</code> : <Empty>Created in Ecom Workspace</Empty>}</Row>
        </PropertySection>

        <PropertySection title="Time & date info" icon={Clock} tone="amber">
          <Row label="PM status">
            {canEdit.allowed ? (
              <Menu>
                <MenuTrigger className="rounded p-0.5 hover:bg-accent" aria-label="Change PM status"><MetaBadge list={PM_STATUSES} id={project.pmStatus} /></MenuTrigger>
                <MenuContent>
                  {PM_STATUSES.map((s) => <MenuItem key={s.id} onSelect={() => save({ pmStatus: s.id as PMStatus }, `PM status → ${s.label}`)}>{s.label}</MenuItem>)}
                </MenuContent>
              </Menu>
            ) : (
              <MetaBadge list={PM_STATUSES} id={project.pmStatus} />
            )}
          </Row>
          <Row label="Start date"><DatePicker value={project.startDate} closed placeholder="Empty" onChange={(d) => save({ startDate: d }, 'Start date updated')} disabled={!canDates.allowed} disabledReason={canDates.reason} /></Row>
          <Row label="Original due date"><DatePicker value={project.originalDueDate} closed placeholder="Empty" onChange={(d) => save({ originalDueDate: d }, 'Original due date updated')} disabled={!canDates.allowed} disabledReason={canDates.reason} /></Row>
          <Row label="Revised due date"><DatePicker value={project.revisedDueDate} closed placeholder="Empty" onChange={(d) => save({ revisedDueDate: d }, 'Revised due date updated')} disabled={!canDates.allowed} disabledReason={canDates.reason} /></Row>
          <Row label="Completed">{project.completedAt ? formatDate(project.completedAt) : <Empty>{isProjectClosed(project.status) ? 'Not recorded' : 'In progress'}</Empty>}</Row>
          <Row label="Days needed" hint={<SourceTag kind="manual" />}><InlineNumber label="Days needed" value={project.daysNeeded} step={0.1} onChange={(v) => save({ daysNeeded: v }, 'Days needed updated')} disabled={!canEdit.allowed} disabledReason={canEdit.reason} /></Row>
          <Row label="Projected dev hours" hint={<SourceTag kind="manual" />}><InlineNumber label="Projected dev hours" value={project.projectedDevHours} onChange={(v) => save({ projectedDevHours: v }, 'Projection updated')} disabled={!canEdit.allowed} disabledReason={canEdit.reason} /></Row>
          <Row label="Buffer hours" hint={<SourceTag kind="manual" />}><InlineNumber label="Buffer hours" value={project.bufferHours} onChange={(v) => save({ bufferHours: v }, 'Projection updated')} disabled={!canEdit.allowed} disabledReason={canEdit.reason} /></Row>
          <Row label="Projected QI hours" hint={<SourceTag kind="manual" />}><InlineNumber label="Projected QI hours" value={project.projectedQiHours} onChange={(v) => save({ projectedQiHours: v }, 'Projection updated')} disabled={!canEdit.allowed} disabledReason={canEdit.reason} /></Row>
          <Row label="Total project hours" hint={<SourceTag kind="calculated" />}><span className="px-1 font-semibold tabular">{formatHours(stats.projectedTotalHours, 'Empty')}</span></Row>
          <Row label="Hours from tasks" hint={<SourceTag kind="calculated" />}>
            <span className="px-1 tabular">{formatHours(stats.estimatedHours, '0h')} est. · {formatHours(stats.actualHours, '0h')} actual</span>
            {variance !== null && <span className={cn('text-xs tabular', variance > 0 ? 'text-tone-orange-fg' : 'text-tone-green-fg')}>{variance > 0 ? '+' : ''}{Math.round(variance * 10) / 10}h</span>}
          </Row>
          <Row label="Non-billable project">
            <Checkbox label="Non-billable project" checked={Boolean(project.nonBillable)} disabled={!canEdit.allowed} onChange={(v) => save({ nonBillable: v }, v ? 'Marked non-billable' : 'Marked billable')} className="size-4" />
            {project.nonBillable && <span className="text-xs text-muted-foreground">Hours are not invoiced</span>}
          </Row>
        </PropertySection>

        <PropertySection title="Strategy" icon={Target} tone="pink">
          <Row label="Relative potential revenue" hint={<SourceTag kind="manual" />}><InlineNumber label="Relative potential revenue" value={project.relativePotentialRevenue} onChange={(v) => save({ relativePotentialRevenue: v }, 'Strategy updated')} disabled={!canEdit.allowed} disabledReason={canEdit.reason} /></Row>
          <Row label="Task type">
            {canEdit.allowed ? (
              <Menu>
                <MenuTrigger className="rounded px-1 py-0.5 hover:bg-accent" aria-label="Change project type"><ProjectTypeLabel type={project.type} className="text-foreground" /></MenuTrigger>
                <MenuContent>
                  {PROJECT_TYPES.map((t) => <MenuItem key={t.id} onSelect={() => save({ type: t.id as ProjectType }, `Type → ${t.label}`)}><t.icon /> {t.label}</MenuItem>)}
                </MenuContent>
              </Menu>
            ) : (
              <ProjectTypeLabel type={project.type} className="text-foreground" />
            )}
          </Row>
          <Row label="Priority"><PriorityPicker value={project.priority} onChange={(p) => save({ priority: p }, 'Priority updated')} disabled={!canEdit.allowed} disabledReason={canEdit.reason} /></Row>
          <Row label="Requirements met">{project.requirements.length ? <span className="tabular">{reqDone}/{project.requirements.length}</span> : <Empty />}</Row>
          <Row label="Tags">{project.tags.length ? <span className="flex flex-wrap gap-1">{project.tags.map((t) => <Badge key={t}>{t}</Badge>)}</span> : <Empty />}</Row>
          {fieldsForType.map((f) => {
            const v = project.customFields.find((c) => c.fieldId === f.id)?.value
            return (
              <Row key={f.id} label={f.label}>
                {v === undefined || v === null || v === '' ? <Empty /> : f.kind === 'url' ? <UrlValue url={String(v)} /> : <span className="break-all">{String(v)}</span>}
              </Row>
            )
          })}
        </PropertySection>
      </div>

      <div className="space-y-4">
        <QISection project={project} stats={stats} />

        <PropertySection title="Dev and designer info" icon={CodeXml} tone="teal">
          <Row label="Developers"><div className="w-full max-w-sm"><MultiUserPicker value={project.developerIds} roles={['developer', 'lead']} placeholder="Empty" onChange={(v) => save({ developerIds: v }, 'Developers updated')} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></div></Row>
          <Row label="ID"><code className="font-mono text-xs">{project.key}</code></Row>
          <Row label="GitHub PR link">
            {/* TODO(GIT-INTEGRATION): Read PR state (open / merged / checks) from the GitHub API instead of a pasted link. */}
            <EditableText value={project.githubPrUrl} placeholder="Add pull request URL" disabled={!canEdit.allowed} validate={urlCheck} render={(v) => <UrlValue url={v} icon={GitPullRequest} />} onSave={(v) => save({ githubPrUrl: v || undefined }, 'PR link saved')} />
          </Row>
          <Row label="Lead"><UserPicker value={project.leadId} roles={['lead']} placeholder="Empty" onChange={(v) => save({ leadId: v }, 'Lead updated')} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></Row>
          <Row label="Designers"><div className="w-full max-w-sm"><MultiUserPicker value={project.designerIds} roles={['designer']} placeholder="Empty" onChange={(v) => save({ designerIds: v }, 'Designers updated')} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></div></Row>
          <Row label="CRO specialist"><UserPicker value={project.croOwnerId} roles={['cro']} placeholder="Empty" onChange={(v) => save({ croOwnerId: v }, 'CRO specialist updated')} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></Row>
          {(project.type === 'ab_testing' || project.abOwnerId) && <Row label="A/B testing owner"><UserPicker value={project.abOwnerId} roles={['ab_testing']} placeholder="Empty" onChange={(v) => save({ abOwnerId: v })} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></Row>}
        </PropertySection>

        <PropertySection title="Automation" icon={Bot} tone="gray" aside={<SourceTag kind="synced" />}>
          {/* TODO(NOTION-AUTOMATIONS): These flags are set by automations today; move them to server-side jobs. */}
          <Row label="Processed"><Checkbox label="Processed" checked={automation.processed} disabled={!canEdit.allowed} onChange={(v) => setAutomation({ processed: v, cycleMonth: v ? new Date().toISOString() : automation.cycleMonth }, v ? 'Marked processed' : 'Marked not processed')} className="size-4" /></Row>
          <Row label="Cycle (current month)">{automation.cycleMonth ? formatDateTime(automation.cycleMonth) : <Empty />}</Row>
          <Row label="Last status change">{formatDate(statusChangedAt)}</Row>
          <Row label="Status since"><span className="tabular">{statusDays === 0 ? 'Today' : `${statusDays} day${statusDays === 1 ? '' : 's'}`}</span><span className="text-xs text-muted-foreground">in current status</span></Row>
          <Row label="Add to Time Doctor"><Checkbox label="Add to Time Doctor" checked={automation.addToTimeDoctor} disabled={!canEdit.allowed} onChange={(v) => setAutomation({ addToTimeDoctor: v }, v ? 'Will be added to Time Doctor' : 'Removed from Time Doctor sync')} className="size-4" /></Row>
          {/* TODO(TIME-DOCTOR): Read estimate / used hours from the Time Doctor API. */}
          <Row label="Estimation (Time Doctor)">{automation.timeDoctorEstimateHours !== undefined ? <span className="tabular">{formatHours(automation.timeDoctorEstimateHours)}</span> : <Empty />}</Row>
          <Row label="Estimation time used">
            {automation.timeDoctorUsedHours !== undefined ? (
              <>
                <span className="tabular">{formatHours(automation.timeDoctorUsedHours)}</span>
                {automation.timeDoctorEstimateHours ? <span className="text-xs text-muted-foreground tabular">{Math.round((automation.timeDoctorUsedHours / automation.timeDoctorEstimateHours) * 100)}% of estimate</span> : null}
              </>
            ) : (
              <Empty />
            )}
          </Row>
          <Row label="Scheduled date"><DatePicker value={automation.scheduledDate} closed placeholder="Empty" onChange={(d) => setAutomation({ scheduledDate: d }, 'Scheduled date updated')} disabled={!canEdit.allowed} disabledReason={canEdit.reason} /></Row>
          <Row label="Last updated">{formatDateTime(project.updatedAt)}</Row>
          <QITimeEntries projectId={project.id} />
        </PropertySection>
      </div>
    </div>
  )
}

/** QI Start / QI End timer, inspector, what is in QI right now, and bug capture. */
function QISection({ project, stats }: { project: Project; stats: ProjectStats }) {
  const entries = useDb((s) => s.qiTimeEntries)
  const tasks = useDb((s) => s.tasks)
  const qiRecords = useDb((s) => s.qiRecords)
  const users = useUserMap()
  const canEdit = useCan('project.edit')
  const canAssign = useCan('project.assign')
  const canQi = useCan('qi.inspect')
  const canBug = useCan('bug.create')
  const { open } = useTaskPanel()
  const save = useSave(project)
  const [bugOpen, setBugOpen] = useState(false)
  const running = entries.find((e) => e.projectId === project.id && !e.endedAt)
  const sessions = entries.filter((e) => e.projectId === project.id)
  // Re-render every 30s while a session runs so the total keeps counting.
  const [, tick] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => tick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [running])
  const total = qiTrackedHours(entries, project.id)
  const inspecting = new Set(qiRecords.filter((q) => q.projectId === project.id && q.status === 'in_progress').map((q) => q.taskId))
  const testing = tasks.filter((t) => t.projectId === project.id && (t.status === 'ready_for_qi' || inspecting.has(t.id)))
  const qiLabel = { none: 'No inspections yet', awaiting: 'Awaiting inspection', in_progress: 'Inspection in progress', passed: 'All inspected tasks passed', rework: 'Rework requested' }[stats.qiStatus]
  const qiTone = ({ none: 'gray', awaiting: 'amber', in_progress: 'blue', passed: 'green', rework: 'orange' } as const)[stats.qiStatus]
  const canDateQi = canEdit.allowed || canQi.allowed

  return (
    <PropertySection title="QI info" icon={ShieldCheck} tone="violet">
      <Row label="Quality inspector"><UserPicker value={project.qiOwnerId} roles={['qi']} placeholder="Empty" onChange={(v) => save({ qiOwnerId: v }, 'Quality inspector updated')} disabled={!canAssign.allowed} disabledReason={canAssign.reason} /></Row>
      <Row label="QI timer">
        <Tooltip content={canQi.allowed ? (running ? 'A session is already running' : 'Start tracking QI time') : canQi.reason}>
          <span>
            <Button size="xs" disabled={!canQi.allowed || Boolean(running)} onClick={() => { void startQiTimer(project.id); toast.success('QI timer started') }}><Play /> QI Start</Button>
          </span>
        </Tooltip>
        <Tooltip content={canQi.allowed ? (running ? 'Stop the running session' : 'No session running') : canQi.reason}>
          <span>
            <Button size="xs" disabled={!canQi.allowed || !running} onClick={() => { void stopQiTimer(project.id).then((e) => e && toast.success('QI timer stopped', { description: `Session: ${formatDuration(qiEntryHours(e))}` })) }}><Square /> QI End</Button>
          </span>
        </Tooltip>
        {running && (
          <span className="inline-flex items-center gap-1.5 text-xs text-tone-green-fg" role="status">
            <span className="size-1.5 animate-pulse rounded-full bg-tone-green-dot" aria-hidden />
            Running {formatDuration(qiEntryHours(running))} · {users.get(running.inspectorId)?.name.split(' ')[0]}
          </span>
        )}
      </Row>
      <Row label="Total QI hours" hint={<SourceTag kind="calculated" />}>
        <span className="tabular">{sessions.length ? formatDuration(total) : <Empty />}</span>
        {sessions.length > 0 && <span className="text-xs text-muted-foreground tabular">{sessions.length} session{sessions.length === 1 ? '' : 's'}{project.projectedQiHours ? ` · ${formatHours(project.projectedQiHours)} projected` : ''}</span>}
      </Row>
      <Row label="QI currently testing">
        {testing.length ? (
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            {testing.map((t) => <button key={t.id} type="button" onClick={() => open(t.id)} className="max-w-full truncate text-left hover:underline">{t.title}</button>)}
          </span>
        ) : (
          <Empty>Nothing in QI</Empty>
        )}
      </Row>
      <Row label="QI status" hint={<SourceTag kind="calculated" />}><Badge tone={qiTone} dot>{qiLabel}</Badge></Row>
      <Row label="QI test date"><DatePicker value={project.qiTestDate} closed placeholder="Empty" onChange={(d) => save({ qiTestDate: d }, 'QI test date updated')} disabled={!canDateQi} disabledReason={canQi.reason} /></Row>
      <Row label="Bug video">
        <EditableText value={project.bugVideoUrl} placeholder="Add bug video URL" disabled={!canDateQi} validate={urlCheck} render={(v) => <UrlValue url={v} icon={Video} />} onSave={(v) => save({ bugVideoUrl: v || undefined }, 'Bug video saved')} />
      </Row>
      <Row label="Bugs">
        <BugSummary projectId={project.id} />
        {canBug.allowed && <Button size="xs" onClick={() => setBugOpen(true)}><BugIcon /> Create bug</Button>}
      </Row>
      {bugOpen && <BugFormDialog onClose={() => setBugOpen(false)} defaults={{ projectId: project.id, assigneeId: project.developerIds[0] }} />}
    </PropertySection>
  )
}

function QITimeEntries({ projectId }: { projectId: string }) {
  const entries = useDb((s) => s.qiTimeEntries).filter((e) => e.projectId === projectId).sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  return (
    <div className="grid grid-cols-[minmax(110px,38%)_1fr] gap-3 py-1.5 sm:grid-cols-[170px_1fr]">
      <dt className="text-[13px] text-muted-foreground">All QI time tracker entries</dt>
      <dd className="min-w-0 text-[13px]">
        {entries.length ? (
          <ul className="space-y-1">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-2">
                <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="tabular">{formatDateTime(e.startedAt)}</span>
                <span className="text-muted-foreground tabular">· {e.endedAt ? formatDuration(qiEntryHours(e)) : 'running'}</span>
                <UserChip userId={e.inspectorId} muted />
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </dd>
    </div>
  )
}

function BugSummary({ projectId }: { projectId: string }) {
  const bugs = useDb((s) => s.bugs).filter((b) => b.projectId === projectId)
  if (!bugs.length) return <Empty>None logged</Empty>
  const open = bugs.filter((b) => b.status === 'open' || b.status === 'in_progress').length
  return (
    <Link to={`/bugs?project=${projectId}`} className="hover:underline">
      {bugs.length} total · <span className={open ? 'text-tone-red-fg' : ''}>{open} open</span>
    </Link>
  )
}

// ───────────────────────────── Project details ─────────────────────────────

/** Long-form brief (Notion "Project Details"), requirements checklist and release notes. */
export function ProjectDetails({ project }: { project: Project }) {
  const users = useUsers()
  const canEdit = useCan('project.edit')
  const save = useSave(project)
  const [newReq, setNewReq] = useState('')
  const reqDone = project.requirements.filter((r) => r.done).length

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 text-[13px]">
        <EditableText
          value={project.description}
          multiline
          placeholder="Add a project brief"
          disabled={!canEdit.allowed}
          render={(v) => <RichText body={v} users={users} className="text-[14px] leading-relaxed" />}
          onSave={(v) => save({ description: v }, 'Project details saved')}
        />
        {canEdit.allowed && <p className="mt-2 text-[11px] text-subtle-foreground">Supports ## headings, - bullets, **bold**, `code` and links.</p>}
      </div>

      <aside className="min-w-0 space-y-5 lg:border-l lg:border-border lg:pl-8">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Requirements</h3>
            {project.requirements.length > 0 && <span className="text-xs text-muted-foreground tabular">{reqDone}/{project.requirements.length} met</span>}
          </div>
          {project.requirements.length > 0 && <ProgressBar value={(reqDone / project.requirements.length) * 100} className="mb-2" />}
          <ul className="space-y-0.5">
            {project.requirements.map((r) => (
              <li key={r.id} className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={r.done}
                  disabled={!canEdit.allowed}
                  aria-label={r.text}
                  onChange={(e) => void updateProject(project.id, { requirements: project.requirements.map((x) => (x.id === r.id ? { ...x, done: e.target.checked } : x)) })}
                  className="mt-0.5 size-3.5 accent-[var(--primary)]"
                />
                <span className={cn('flex-1 text-[13px] leading-snug', r.done && 'text-muted-foreground')}>{r.text}</span>
                {canEdit.allowed && (
                  <button type="button" aria-label={`Remove requirement: ${r.text}`} onClick={() => save({ requirements: project.requirements.filter((x) => x.id !== r.id) }, 'Requirement removed')} className="rounded p-0.5 text-subtle-foreground opacity-0 group-hover:opacity-100 hover:text-tone-red-fg focus-visible:opacity-100">
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
            {!project.requirements.length && <li className="text-[13px] text-subtle-foreground">No requirements captured yet.</li>}
          </ul>
          {canEdit.allowed && (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!newReq.trim()) return
                save({ requirements: [...project.requirements, { id: uid('r'), text: newReq.trim(), done: false }] }, 'Requirement added')
                setNewReq('')
              }}
            >
              <Input value={newReq} onChange={(e) => setNewReq(e.target.value)} placeholder="Add a requirement" aria-label="New requirement" />
              <Button type="submit" disabled={!newReq.trim()}><Plus /> Add</Button>
            </form>
          )}
        </div>
        <div>
          <h3 className="mb-1.5 text-[13px] font-semibold">Release / deployment notes</h3>
          <div className="text-[13px]">
            <EditableText value={project.releaseNotes} multiline placeholder="No release notes yet" disabled={!canEdit.allowed} onSave={(v) => save({ releaseNotes: v || undefined }, 'Release notes saved')} />
          </div>
        </div>
      </aside>
    </div>
  )
}
