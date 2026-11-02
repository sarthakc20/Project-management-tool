import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Dialog as D } from 'radix-ui'
import { toast } from 'sonner'
import { Bug as BugIcon, Plus, Search, X } from 'lucide-react'
import type { Bug, BugSeverity, BugStatus } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { updateBug } from '@/services/api'
import { useCan, useClients, useProjectMap } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/display'
import { Input, Select } from '@/components/ui/form'
import { Gate } from '@/components/common/gate'
import { UserPicker } from '@/components/common/pickers'
import { MetaBadge } from '@/components/common/badges'
import { ClientChip, UserChip } from '@/components/common/people'
import { BugFormDialog } from '@/components/qi/BugFormDialog'
import { BUG_SEVERITIES, BUG_STATUSES } from '@/lib/workflow'
import { formatDateTime, relativeTime } from '@/lib/dates'
import { includesText } from '@/lib/utils'
import { paths } from '@/lib/routes'

const SEV_RANK: Record<BugSeverity, number> = { critical: 0, major: 1, minor: 2, trivial: 3 }

export function BugsPage() {
  useDocumentTitle('Bugs')
  useBreadcrumbs([{ label: 'Bugs' }])
  const bugs = useDb((s) => s.bugs)
  const users = useDb((s) => s.users)
  const projects = useProjectMap()
  const clients = useClients()
  const canEdit = useCan('bug.edit')
  const [params, setParams] = useSearchParams()
  const get = (k: string) => params.get(k) ?? ''
  const set = (k: string, v: string) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n }, { replace: true })

  const filtered = useMemo(
    () =>
      bugs
        .filter((b) => {
          if (get('client') && projects.get(b.projectId)?.clientId !== get('client')) return false
          if (get('project') && b.projectId !== get('project')) return false
          if (get('severity') && b.severity !== get('severity')) return false
          if (get('status') === 'open' && !(b.status === 'open' || b.status === 'in_progress')) return false
          if (get('status') && get('status') !== 'open' && b.status !== get('status')) return false
          if (get('assignee') && b.assigneeId !== get('assignee')) return false
          return includesText([b.title, b.key, b.description], get('q'))
        })
        .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.createdAt.localeCompare(a.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bugs, projects, params],
  )
  const selected = bugs.find((b) => b.id === get('bug'))
  const projectFilter = get('project') ? projects.get(get('project')) : undefined
  const openCount = bugs.filter((b) => b.status === 'open' || b.status === 'in_progress').length

  return (
    <div>
      <PageHeader
        title="Bugs"
        description={`${openCount} open · ${bugs.length} total · from QI and client reports`}
        actions={
          <Gate permission="bug.create" mode="hide">
            <Button variant="primary" onClick={() => set('new', '1')}><Plus /> Report bug</Button>
          </Gate>
        }
      />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search bugs" placeholder="Search bugs…" value={get('q')} onChange={(e) => set('q', e.target.value)} className="pl-8" />
          </div>
          <Select aria-label="Client" value={get('client')} onChange={(e) => set('client', e.target.value)} className="w-48">
            <option value="">All clients</option>
            {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Severity" value={get('severity')} onChange={(e) => set('severity', e.target.value)} className="w-36">
            <option value="">Any severity</option>
            {BUG_SEVERITIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <Select aria-label="Status" value={get('status')} onChange={(e) => set('status', e.target.value)} className="w-36">
            <option value="">Any status</option>
            <option value="open">Open + in progress</option>
            {BUG_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <Select aria-label="Assignee" value={get('assignee')} onChange={(e) => set('assignee', e.target.value)} className="w-40">
            <option value="">Any assignee</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          {projectFilter && (
            <span className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface-2 pr-1 pl-2.5 text-xs">
              <span className="text-muted-foreground">Project:</span>
              <span className="max-w-[200px] truncate font-medium">{projectFilter.key} · {projectFilter.title}</span>
              <button type="button" onClick={() => set('project', '')} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Clear project filter">
                <X className="size-3.5" />
              </button>
            </span>
          )}
        </div>
        {filtered.length ? (
          <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                  {['Bug', 'Project', 'Severity', 'Status', 'Assignee', 'Source', 'Reported'].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} onClick={() => set('bug', b.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="max-w-[340px] px-3 py-2">
                      <span className="block truncate text-[13px] font-medium">{b.title}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{b.key}</span>
                    </td>
                    <td className="max-w-[220px] px-3 py-2"><span className="block truncate text-[13px] text-muted-foreground">{projects.get(b.projectId)?.title}</span></td>
                    <td className="px-3 py-2"><MetaBadge list={BUG_SEVERITIES} id={b.severity} /></td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <BugStatusSelect bug={b} disabled={!canEdit.allowed} />
                    </td>
                    <td className="px-3 py-2"><UserChip userId={b.assigneeId} /></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{b.qiRecordId ? 'QI inspection' : 'Reported'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">{relativeTime(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={BugIcon} title="No bugs match" description="Adjust filters, or report a new bug." />
        )}
      </PageBody>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && set('bug', '')}>
        {selected && (
          <SheetContent title={selected.title} className="max-w-[560px]">
            <BugDetail bug={selected} />
          </SheetContent>
        )}
      </Dialog>
      {get('new') === '1' && <BugFormDialog onClose={() => set('new', '')} defaults={{ projectId: get('project') || undefined }} />}
    </div>
  )
}

function BugStatusSelect({ bug, disabled }: { bug: Bug; disabled?: boolean }) {
  return (
    <Select
      aria-label={`Status of ${bug.key}`}
      value={bug.status}
      disabled={disabled}
      title={disabled ? 'Your role cannot update bugs' : undefined}
      onChange={(e) => {
        void updateBug(bug.id, { status: e.target.value as BugStatus })
        toast.success(`${bug.key} → ${BUG_STATUSES.find((s) => s.id === e.target.value)?.label}`)
      }}
      className="w-32 [&_select]:h-7"
    >
      {BUG_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </Select>
  )
}

function BugDetail({ bug }: { bug: Bug }) {
  const project = useDb((s) => s.projects.find((p) => p.id === bug.projectId))
  const task = useDb((s) => s.tasks.find((t) => t.id === bug.taskId))
  const qi = useDb((s) => s.qiRecords.find((q) => q.id === bug.qiRecordId))
  const can = useCan('bug.edit')
  const { open } = useTaskPanel()
  const row = (k: string, v: React.ReactNode) => (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-1.5 text-[13px]">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0">{v}</dd>
    </div>
  )
  return (
    <>
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs">{bug.key}</span>
        <span className="flex-1" />
        <D.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></D.Close>
      </header>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
        <h2 className="text-lg leading-snug font-semibold">{bug.title}</h2>
        <dl className="mt-3 border-y border-border py-2">
          {row('Status', <BugStatusSelect bug={bug} disabled={!can.allowed} />)}
          {row('Severity', can.allowed ? (
            <Select aria-label="Severity" value={bug.severity} onChange={(e) => void updateBug(bug.id, { severity: e.target.value as BugSeverity })} className="w-32 [&_select]:h-7">
              {BUG_SEVERITIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          ) : <MetaBadge list={BUG_SEVERITIES} id={bug.severity} />)}
          {row('Assignee', <UserPicker value={bug.assigneeId} onChange={(v) => { void updateBug(bug.id, { assigneeId: v }); toast.success('Assignee updated') }} disabled={!can.allowed} disabledReason={can.reason} />)}
          {row('Reporter', <UserChip userId={bug.reporterId} />)}
          {row('Project', project ? <Link to={paths.project(project.id)} className="hover:underline">{project.key} · {project.title}</Link> : '—')}
          {row('Client', project ? <ClientChip clientId={project.clientId} /> : '—')}
          {row('Task', task ? <button type="button" className="text-left hover:underline" onClick={() => open(task.id)}>{task.key} · {task.title}</button> : '—')}
          {row('QI inspection', qi ? `Round ${qi.round} · ${formatDateTime(qi.completedAt ?? qi.submittedAt)}` : 'Not from QI')}
          {row('Environment', bug.environment || '—')}
          {row('Reported', formatDateTime(bug.createdAt))}
        </dl>
        <h3 className="mt-4 mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</h3>
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{bug.description}</p>
        <h3 className="mt-4 mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Steps to reproduce</h3>
        <p className="rounded-lg bg-surface-2 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{bug.stepsToReproduce || 'Not provided'}</p>
      </div>
    </>
  )
}
