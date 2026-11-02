import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Dialog as D } from 'radix-ui'
import { toast } from 'sonner'
import { Bug as BugIcon, Check, CircleSlash, ClipboardCheck, Hourglass, Play, RotateCcw, ThumbsUp, X } from 'lucide-react'
import type { QIChecklistItem, QIRecord, QIStatus } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { recordQIResult, startInspection, updateQIRecord } from '@/services/api'
import { useCan, useProjectMap, useUserMap } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { Badge, EmptyState, SectionHeader } from '@/components/ui/display'
import { Select, Textarea } from '@/components/ui/form'
import { Tooltip } from '@/components/ui/tooltip'
import { RestrictedNotice } from '@/components/common/gate'
import { MetaBadge } from '@/components/common/badges'
import { ClientChip, UserAvatar, UserChip } from '@/components/common/people'
import { UserPicker } from '@/components/common/pickers'
import { BugFormDialog } from '@/components/qi/BugFormDialog'
import { BUG_SEVERITIES, BUG_STATUSES, QI_STATUSES } from '@/lib/workflow'
import { formatDateTime, relativeTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/routes'

const LANES: { id: string; label: string; statuses: QIStatus[]; icon: typeof Hourglass; waiting: 'qi' | 'dev' | null }[] = [
  { id: 'awaiting', label: 'Awaiting inspection', statuses: ['awaiting'], icon: Hourglass, waiting: 'qi' },
  { id: 'in_progress', label: 'Inspecting', statuses: ['in_progress'], icon: ClipboardCheck, waiting: 'qi' },
  { id: 'rework', label: 'Returned to dev', statuses: ['changes_requested', 'failed'], icon: RotateCcw, waiting: 'dev' },
  { id: 'passed', label: 'Approved', statuses: ['passed'], icon: ThumbsUp, waiting: null },
]

const DEVICE_OPTIONS = ['iPhone 15 · Safari', 'Pixel 8 · Chrome', 'iPad · Safari', 'macOS · Chrome', 'macOS · Safari', 'Windows · Firefox', 'Windows · Edge']

export function QIPage() {
  useDocumentTitle('Quality Inspection')
  useBreadcrumbs([{ label: 'Departments' }, { label: 'Quality Inspection' }])
  const { qiRecords, tasks, bugs } = useDb()
  const projects = useProjectMap()
  const users = useUserMap()
  const [params, setParams] = useSearchParams()
  const [inspector, setInspector] = useState('')
  const selectedId = params.get('qi')

  // Show the latest round per task; earlier rounds appear in the detail history.
  const latest = useMemo(() => {
    const m = new Map<string, QIRecord>()
    for (const q of qiRecords) {
      const p = m.get(q.taskId)
      if (!p || q.round > p.round) m.set(q.taskId, q)
    }
    return [...m.values()].filter((q) => projects.get(q.projectId) && !projects.get(q.projectId)!.archived && (!inspector || q.inspectorId === inspector))
  }, [qiRecords, projects, inspector])

  const selected = qiRecords.find((q) => q.id === selectedId)
  const qiBugs = bugs.filter((b) => b.qiRecordId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const setSelected = (id: string) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('qi', id); else n.delete('qi'); return n })

  return (
    <div>
      <PageHeader
        title="Quality Inspection"
        description={`${latest.filter((q) => q.status === 'awaiting').length} awaiting · ${latest.filter((q) => q.status === 'in_progress').length} inspecting · ${latest.filter((q) => q.status === 'changes_requested' || q.status === 'failed').length} returned to dev`}
        actions={
          <Select aria-label="Inspector" value={inspector} onChange={(e) => setInspector(e.target.value)} className="w-44">
            <option value="">All inspectors</option>
            {[...users.values()].filter((u) => u.role === 'qi').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        }
      />
      <PageBody className="space-y-8">
        <p className="text-[13px] text-muted-foreground">
          Moving a task to <strong className="font-medium text-foreground">Ready for QI</strong> anywhere in the app creates an inspection here. Passing completes the task; requesting changes sends it back to the developer.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {LANES.map((lane) => {
            const items = latest.filter((q) => lane.statuses.includes(q.status)).sort((a, b) => (b.completedAt ?? b.submittedAt).localeCompare(a.completedAt ?? a.submittedAt))
            return (
              <section key={lane.id} aria-label={lane.label} className="rounded-xl bg-surface-2 p-2">
                <header className="flex items-center gap-2 px-1.5 pt-0.5 pb-2">
                  <lane.icon className="size-4 text-muted-foreground" />
                  <h2 className="text-[13px] font-semibold">{lane.label}</h2>
                  <span className="text-xs text-muted-foreground tabular">{items.length}</span>
                </header>
                <div className="space-y-2">
                  {items.map((q) => {
                    const task = tasks.find((t) => t.id === q.taskId)
                    const project = projects.get(q.projectId)
                    const waitingOn = lane.waiting === 'qi' ? users.get(q.inspectorId ?? '') : lane.waiting === 'dev' ? users.get(task?.assigneeId ?? '') : undefined
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelected(q.id)}
                        className={cn('w-full rounded-lg border border-border bg-surface p-2.5 text-left shadow-xs hover:border-border-strong', selectedId === q.id && 'ring-2 ring-ring/40')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-subtle-foreground">{task?.key}</span>
                          <Badge className="ml-auto">Round {q.round}</Badge>
                        </div>
                        <p className="mt-1 text-[13px] leading-snug font-medium">{task?.title ?? 'Deleted task'}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{project?.title}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {waitingOn ? (
                            <>
                              <UserAvatar user={waitingOn} size="xs" tooltip={false} />
                              <span className="truncate">Waiting on {waitingOn.name.split(' ')[0]}</span>
                            </>
                          ) : (
                            <span>Inspected by {users.get(q.inspectorId ?? '')?.name ?? '—'}</span>
                          )}
                          <span className="ml-auto whitespace-nowrap">{relativeTime(q.completedAt ?? q.startedAt ?? q.submittedAt)}</span>
                        </div>
                        {q.bugIds.length > 0 && <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-tone-red-fg"><BugIcon className="size-3" /> {q.bugIds.length} bug{q.bugIds.length > 1 ? 's' : ''}</p>}
                      </button>
                    )
                  })}
                  {!items.length && <p className="py-6 text-center text-xs text-subtle-foreground">Nothing here</p>}
                </div>
              </section>
            )
          })}
        </div>

        <section>
          <SectionHeader title="Bugs found during inspection" description="Defects logged from QI rounds" action={<Link to="/bugs" className="text-xs text-primary hover:underline">All bugs</Link>} />
          {qiBugs.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {qiBugs.map((b) => (
                <li key={b.id}>
                  <Link to={paths.bug(b.id)} className="flex flex-wrap items-center gap-3 px-3 py-2 hover:bg-surface-2">
                    <span className="font-mono text-xs text-muted-foreground">{b.key}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{b.title}</span>
                    <MetaBadge list={BUG_SEVERITIES} id={b.severity} />
                    <MetaBadge list={BUG_STATUSES} id={b.status} />
                    <UserChip userId={b.assigneeId} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={BugIcon} title="No bugs from QI" />
          )}
        </section>
      </PageBody>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected('')}>
        {selected && (
          <SheetContent title="QI inspection" className="max-w-[600px]">
            <QIDetail key={selected.id} record={selected} />
          </SheetContent>
        )}
      </Dialog>
    </div>
  )
}

function QIDetail({ record }: { record: QIRecord }) {
  const { tasks, qiRecords, bugs } = useDb()
  const projects = useProjectMap()
  const can = useCan('qi.inspect')
  const canBug = useCan('bug.create')
  const { open } = useTaskPanel()
  const task = tasks.find((t) => t.id === record.taskId)
  const project = projects.get(record.projectId)
  const [notes, setNotes] = useState(record.notes)
  const [bugOpen, setBugOpen] = useState(false)
  const history = qiRecords.filter((q) => q.taskId === record.taskId).sort((a, b) => b.round - a.round)
  const closed = ['passed', 'failed', 'changes_requested'].includes(record.status)
  const failedItems = record.checklist.filter((c) => c.result === 'fail').length

  const setItem = (item: QIChecklistItem, result: QIChecklistItem['result']) =>
    void updateQIRecord(record.id, { checklist: record.checklist.map((c) => (c.id === item.id ? { ...c, result: c.result === result ? null : result } : c)) })

  const decide = async (result: 'passed' | 'failed' | 'changes_requested') => {
    if (result !== 'passed' && !notes.trim()) {
      toast.error('Add notes describing what needs to change')
      return
    }
    await recordQIResult(record.id, result, notes.trim())
    toast.success(result === 'passed' ? 'Inspection passed — task marked Done' : 'Returned to developer', {
      description: result === 'passed' ? undefined : 'The assignee was notified (in-app).',
    })
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <ClipboardCheck className="size-4 text-muted-foreground" />
        <span className="text-[13px] font-medium">QI · Round {record.round}</span>
        <MetaBadge list={QI_STATUSES} id={record.status} />
        <span className="flex-1" />
        <D.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></D.Close>
      </header>
      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div>
          <button type="button" onClick={() => task && open(task.id)} className="text-left text-lg leading-snug font-semibold hover:underline">{task?.title ?? 'Deleted task'}</button>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {project && <ClientChip clientId={project.clientId} className="text-xs" />}
            {project && <Link to={paths.project(project.id)} className="hover:underline">{project.key}</Link>}
            <span>Submitted {formatDateTime(record.submittedAt)}</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-[13px]">
          <div><dt className="mb-0.5 text-xs text-muted-foreground">Developer</dt><dd><UserChip userId={task?.assigneeId} /></dd></div>
          <div>
            <dt className="mb-0.5 text-xs text-muted-foreground">QI owner</dt>
            <dd><UserPicker value={record.inspectorId} roles={['qi']} onChange={(v) => { void updateQIRecord(record.id, { inspectorId: v }); toast.success('Inspector updated') }} disabled={!can.allowed} disabledReason={can.reason} /></dd>
          </div>
          <div><dt className="mb-0.5 text-xs text-muted-foreground">Inspection started</dt><dd>{record.startedAt ? formatDateTime(record.startedAt) : '—'}</dd></div>
          <div><dt className="mb-0.5 text-xs text-muted-foreground">Result recorded</dt><dd>{record.completedAt ? formatDateTime(record.completedAt) : '—'}</dd></div>
        </dl>

        {!can.allowed && <RestrictedNotice>{can.reason}. You can view results but not record them.</RestrictedNotice>}

        {record.status === 'awaiting' && (
          <Button variant="primary" disabled={!can.allowed} onClick={() => { void startInspection(record.id); toast.success('Inspection started') }}>
            <Play /> Start inspection
          </Button>
        )}

        <section>
          <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Checklist {failedItems > 0 && <span className="text-tone-red-fg normal-case">· {failedItems} failing</span>}</h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {record.checklist.map((c) => (
              <li key={c.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="flex-1 text-[13px]">{c.label}</span>
                {(['pass', 'fail', 'na'] as const).map((r) => (
                  <Tooltip key={r} content={{ pass: 'Pass', fail: 'Fail', na: 'Not applicable' }[r]}>
                    <button
                      type="button"
                      disabled={!can.allowed || record.status !== 'in_progress'}
                      aria-pressed={c.result === r}
                      aria-label={`${c.label}: ${r}`}
                      onClick={() => setItem(c, r)}
                      className={cn(
                        'flex h-6 min-w-6 items-center justify-center rounded-md border border-border px-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-60',
                        c.result === r && r === 'pass' && 'border-transparent bg-tone-green-bg text-tone-green-fg',
                        c.result === r && r === 'fail' && 'border-transparent bg-tone-red-bg text-tone-red-fg',
                        c.result === r && r === 'na' && 'border-transparent bg-muted text-muted-foreground',
                      )}
                    >
                      {r === 'pass' ? <Check className="size-3.5" /> : r === 'fail' ? <X className="size-3.5" /> : <CircleSlash className="size-3" />}
                    </button>
                  </Tooltip>
                ))}
              </li>
            ))}
          </ul>
          {record.status === 'awaiting' && <p className="mt-1 text-xs text-muted-foreground">Start the inspection to record checklist results.</p>}
        </section>

        <section>
          <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Devices tested</h3>
          <div className="flex flex-wrap gap-1.5">
            {DEVICE_OPTIONS.map((d) => {
              const on = record.devices.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!can.allowed || closed}
                  aria-pressed={on}
                  onClick={() => void updateQIRecord(record.id, { devices: on ? record.devices.filter((x) => x !== d) : [...record.devices, d] })}
                  className={cn('rounded-full border px-2 py-0.5 text-xs disabled:cursor-not-allowed', on ? 'border-transparent bg-primary-soft text-primary-soft-foreground' : 'border-border text-muted-foreground hover:bg-accent')}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Notes & results</h3>
          {closed ? (
            <p className="rounded-lg bg-surface-2 p-3 text-[13px] whitespace-pre-wrap">{record.notes || 'No notes recorded.'}</p>
          ) : (
            <Textarea aria-label="Inspection notes" value={notes} disabled={!can.allowed} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== record.notes && void updateQIRecord(record.id, { notes })} placeholder="What was tested, what failed, and what needs to change…" />
          )}
        </section>

        {record.bugIds.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Bugs from this round</h3>
            <ul className="space-y-1">
              {record.bugIds.map((id) => {
                const b = bugs.find((x) => x.id === id)
                return b ? (
                  <li key={id} className="flex items-center gap-2 text-[13px]">
                    <Link to={paths.bug(b.id)} className="font-mono text-xs hover:underline">{b.key}</Link>
                    <span className="min-w-0 flex-1 truncate">{b.title}</span>
                    <MetaBadge list={BUG_STATUSES} id={b.status} />
                  </li>
                ) : null
              })}
            </ul>
          </section>
        )}

        {history.length > 1 && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Round history</h3>
            <ol className="space-y-1">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-2 text-[13px]">
                  <span className="w-16 text-xs text-muted-foreground">Round {h.round}</span>
                  <MetaBadge list={QI_STATUSES} id={h.status} />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{h.notes}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
      <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2 px-4 py-3">
        <Button variant="ghost" disabled={!canBug.allowed} onClick={() => setBugOpen(true)}><BugIcon /> Create bug</Button>
        <span className="flex-1" />
        {record.status === 'in_progress' ? (
          <>
            <Button disabled={!can.allowed} onClick={() => void decide('failed')}><X /> Fail</Button>
            <Button disabled={!can.allowed} onClick={() => void decide('changes_requested')}><RotateCcw /> Request changes</Button>
            <Button variant="primary" disabled={!can.allowed} onClick={() => void decide('passed')}><Check /> Pass</Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{record.status === 'awaiting' ? 'Start the inspection to record a result.' : 'Result recorded. A new round starts when the task returns to Ready for QI.'}</span>
        )}
      </footer>
      {bugOpen && <BugFormDialog onClose={() => setBugOpen(false)} defaults={{ projectId: record.projectId, taskId: record.taskId, qiRecordId: record.id }} />}
    </>
  )
}
