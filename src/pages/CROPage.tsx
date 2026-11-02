import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Dialog as D } from 'radix-ui'
import { toast } from 'sonner'
import { LineChart, Pencil, Plus, X } from 'lucide-react'
import type { CROExperiment, CROStatus, Priority } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { createCROExperiment, updateCROExperiment } from '@/services/api'
import { useCan, useCurrentUser } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { DemoTag, EmptyState } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Gate, RestrictedNotice } from '@/components/common/gate'
import { MetaBadge, PriorityBadge, TaskStatusBadge } from '@/components/common/badges'
import { ClientChip, UserChip } from '@/components/common/people'
import { UserPicker } from '@/components/common/pickers'
import { FormDialog, FormSection } from '@/components/forms/FormDialog'
import { CRO_STATUSES, PRIORITIES } from '@/lib/workflow'
import { relativeTime } from '@/lib/dates'
import { paths } from '@/lib/routes'

/**
 * CRO research & hypotheses.
 * TODO(ANALYTICS): Attach supporting data (GA4 funnels, heatmap exports) via the analytics
 * provider instead of free text once the integration is approved.
 */
export function CROPage() {
  useDocumentTitle('CRO')
  useBreadcrumbs([{ label: 'Departments' }, { label: 'CRO' }])
  const items = useDb((s) => s.croExperiments)
  const clients = useDb((s) => s.clients)
  const can = useCan('cro.manage')
  const [params, setParams] = useSearchParams()
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<CROExperiment | 'new' | null>(null)
  const list = useMemo(() => items.filter((c) => (!clientId || c.clientId === clientId) && (!status || c.status === status)).sort((a, b) => b.impactScore - a.impactScore), [items, clientId, status])
  const selected = items.find((c) => c.id === params.get('cro'))
  const select = (id: string) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('cro', id); else n.delete('cro'); return n })

  return (
    <div>
      <PageHeader
        title="CRO"
        description="Conversion research, hypotheses and recommendations"
        actions={<Gate permission="cro.manage" mode="disable"><Button variant="primary" onClick={() => setEditing('new')}><Plus /> New hypothesis</Button></Gate>}
      />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-40">
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            {CRO_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">Sorted by impact score</span>
        </div>
        {list.length ? (
          <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                  {['Hypothesis', 'Client', 'Status', 'Owner', 'Priority', 'Impact', 'Linked tasks', 'Updated'].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} onClick={() => select(c.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="max-w-[360px] px-3 py-2">
                      <span className="block truncate text-[13px] font-medium">{c.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.pageArea}</span>
                    </td>
                    <td className="px-3 py-2"><ClientChip clientId={c.clientId} /></td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      {can.allowed ? (
                        <Select aria-label="Status" value={c.status} onChange={(e) => { void updateCROExperiment(c.id, { status: e.target.value as CROStatus }); toast.success('Status updated') }} className="w-36 [&_select]:h-7">
                          {CRO_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </Select>
                      ) : <MetaBadge list={CRO_STATUSES} id={c.status} />}
                    </td>
                    <td className="px-3 py-2"><UserChip userId={c.ownerId} /></td>
                    <td className="px-3 py-2"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-3 py-2 text-[13px] tabular">{c.impactScore}/10</td>
                    <td className="px-3 py-2 text-[13px] tabular">{c.linkedTaskIds.length}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">{relativeTime(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={LineChart} title="No CRO hypotheses match" />
        )}
      </PageBody>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && select('')}>
        {selected && (
          <SheetContent title={selected.title} className="max-w-[600px]">
            <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <MetaBadge list={CRO_STATUSES} id={selected.status} />
              <span className="flex-1" />
              {can.allowed && <Button size="sm" onClick={() => setEditing(selected)}><Pencil /> Edit</Button>}
              <D.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></D.Close>
            </header>
            <CRODetail item={selected} />
          </SheetContent>
        )}
      </Dialog>
      {editing && <CROForm existing={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function CRODetail({ item }: { item: CROExperiment }) {
  const tasks = useDb((s) => s.tasks)
  const project = useDb((s) => s.projects.find((p) => p.id === item.projectId))
  const { open } = useTaskPanel()
  const can = useCan('cro.manage')
  const block = (label: string, text: string) => (
    <section>
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</h3>
      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{text || <span className="text-subtle-foreground">Not recorded</span>}</p>
    </section>
  )
  return (
    <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold">{item.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <ClientChip clientId={item.clientId} className="text-xs" />
          <span>{item.pageArea}</span>
          <span>Impact {item.impactScore}/10</span>
          <PriorityBadge priority={item.priority} />
          <UserChip userId={item.ownerId} />
        </div>
      </div>
      {!can.allowed && <RestrictedNotice>{can.reason}</RestrictedNotice>}
      {block('Problem statement', item.problemStatement)}
      {block('Hypothesis', item.hypothesis)}
      {block('Proposed change', item.proposedChange)}
      {block('Expected outcome', item.expectedOutcome)}
      {block('Recommendations', item.recommendations)}
      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Linked implementation tasks</h3>
        {item.linkedTaskIds.length ? (
          <ul className="space-y-1">
            {item.linkedTaskIds.map((id) => {
              const t = tasks.find((x) => x.id === id)
              return t ? (
                <li key={id} className="flex items-center gap-2">
                  <button type="button" onClick={() => open(t.id)} className="min-w-0 flex-1 truncate text-left text-[13px] hover:underline">{t.key} · {t.title}</button>
                  <TaskStatusBadge status={t.status} />
                </li>
              ) : null
            })}
          </ul>
        ) : (
          <p className="text-[13px] text-subtle-foreground">No linked tasks.</p>
        )}
        {project && <Link to={paths.project(project.id)} className="mt-2 inline-block text-xs text-primary hover:underline">Open project {project.key}</Link>}
      </section>
    </div>
  )
}

function CROForm({ existing, onClose }: { existing?: CROExperiment; onClose: () => void }) {
  const me = useCurrentUser()
  const clients = useDb((s) => s.clients)
  const projects = useDb((s) => s.projects)
  const tasks = useDb((s) => s.tasks)
  const initial = {
    title: existing?.title ?? '', clientId: existing?.clientId ?? '', projectId: existing?.projectId ?? '', pageArea: existing?.pageArea ?? '',
    status: existing?.status ?? ('idea' as CROStatus), ownerId: existing?.ownerId ?? me.id, priority: existing?.priority ?? ('medium' as Priority),
    impactScore: String(existing?.impactScore ?? 5), problemStatement: existing?.problemStatement ?? '', hypothesis: existing?.hypothesis ?? '',
    proposedChange: existing?.proposedChange ?? '', expectedOutcome: existing?.expectedOutcome ?? '', recommendations: existing?.recommendations ?? '',
    linkedTaskIds: existing?.linkedTaskIds ?? [],
  }
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const clientProjects = projects.filter((p) => p.clientId === f.clientId && !p.archived)
  const clientTasks = tasks.filter((t) => clientProjects.some((p) => p.id === t.projectId) && !t.parentTaskId)
  return (
    <FormDialog
      open
      onClose={onClose}
      title={existing ? 'Edit CRO hypothesis' : 'New CRO hypothesis'}
      dirty={JSON.stringify(f) !== JSON.stringify(initial)}
      submitLabel={existing ? 'Save' : 'Create'}
      size="xl"
      onSubmit={async () => {
        const e: Record<string, string> = {}
        if (!f.title.trim()) e.title = 'Enter a title.'
        if (!f.clientId) e.clientId = 'Select a client.'
        if (!f.hypothesis.trim()) e.hypothesis = 'State the hypothesis.'
        const score = Number(f.impactScore)
        if (Number.isNaN(score) || score < 1 || score > 10) e.impactScore = 'Score from 1 to 10.'
        setErrors(e)
        if (Object.keys(e).length) return
        const payload = { ...f, title: f.title.trim(), projectId: f.projectId || undefined, impactScore: score, ownerId: f.ownerId }
        if (existing) await updateCROExperiment(existing.id, payload)
        else await createCROExperiment(payload)
        toast.success(existing ? 'Hypothesis updated' : 'Hypothesis created')
        onClose()
      }}
    >
      <FormSection title="Overview">
        <Field label="Title" required error={errors.title} className="sm:col-span-2">{(p) => <Input {...p} autoFocus value={f.title} onChange={(e) => set('title', e.target.value)} />}</Field>
        <Field label="Client" required error={errors.clientId}>
          {(p) => <Select {...p} value={f.clientId} onChange={(e) => setF((x) => ({ ...x, clientId: e.target.value, projectId: '', linkedTaskIds: [] }))}><option value="">Select client…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}
        </Field>
        <Field label="Related project">
          {(p) => <Select {...p} value={f.projectId} disabled={!f.clientId} onChange={(e) => set('projectId', e.target.value)}><option value="">None</option>{clientProjects.map((x) => <option key={x.id} value={x.id}>{x.key} · {x.title.slice(0, 50)}</option>)}</Select>}
        </Field>
        <Field label="Page / area">{(p) => <Input {...p} value={f.pageArea} onChange={(e) => set('pageArea', e.target.value)} placeholder="e.g. PDP · Buy box" />}</Field>
        <Field label="Status">{(p) => <Select {...p} value={f.status} onChange={(e) => set('status', e.target.value as CROStatus)}>{CRO_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>}</Field>
        <Field label="Owner">{(p) => <UserPicker id={p.id} variant="field" roles={['cro']} allowNone={false} value={f.ownerId} onChange={(v) => v && set('ownerId', v)} />}</Field>
        <Field label="Priority">{(p) => <Select {...p} value={f.priority} onChange={(e) => set('priority', e.target.value as Priority)}>{PRIORITIES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</Select>}</Field>
        <Field label="Impact score (1–10)" error={errors.impactScore}>{(p) => <Input {...p} type="number" min={1} max={10} value={f.impactScore} onChange={(e) => set('impactScore', e.target.value)} />}</Field>
      </FormSection>
      <FormSection title="Research">
        <Field label="Problem statement" className="sm:col-span-2">{(p) => <Textarea {...p} value={f.problemStatement} onChange={(e) => set('problemStatement', e.target.value)} />}</Field>
        <Field label="Hypothesis" required error={errors.hypothesis} className="sm:col-span-2">{(p) => <Textarea {...p} value={f.hypothesis} onChange={(e) => set('hypothesis', e.target.value)} placeholder="If we…, then…, because…" />}</Field>
        <Field label="Proposed change" className="sm:col-span-2">{(p) => <Textarea {...p} value={f.proposedChange} onChange={(e) => set('proposedChange', e.target.value)} />}</Field>
        <Field label="Expected outcome">{(p) => <Textarea {...p} value={f.expectedOutcome} onChange={(e) => set('expectedOutcome', e.target.value)} />}</Field>
        <Field label="Recommendations">{(p) => <Textarea {...p} value={f.recommendations} onChange={(e) => set('recommendations', e.target.value)} />}</Field>
        <Field label="Linked implementation tasks" hint="Hold Ctrl / Cmd to select several" className="sm:col-span-2">
          {(p) => (
            <select {...p} multiple value={f.linkedTaskIds} disabled={!f.clientId} onChange={(e) => set('linkedTaskIds', [...e.target.selectedOptions].map((o) => o.value))} className="h-28 w-full rounded-md border border-input bg-surface p-1 text-[13px]">
              {clientTasks.map((t) => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
            </select>
          )}
        </Field>
      </FormSection>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><DemoTag /> Research data is entered manually; no analytics source is connected.</p>
    </FormDialog>
  )
}
