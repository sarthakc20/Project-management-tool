import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Dialog as D } from 'radix-ui'
import { toast } from 'sonner'
import { FlaskConical, Pencil, Plus, X } from 'lucide-react'
import type { ABTestExperiment, ABTestStatus } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { createABTest, updateABTest } from '@/services/api'
import { useCan, useCurrentUser } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { DemoTag, EmptyState } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Gate } from '@/components/common/gate'
import { MetaBadge } from '@/components/common/badges'
import { ClientChip, UserChip } from '@/components/common/people'
import { DatePicker, UserPicker } from '@/components/common/pickers'
import { FormDialog, FormSection } from '@/components/forms/FormDialog'
import { AB_STATUSES } from '@/lib/workflow'
import { compareDates, daysUntil, formatShortDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/routes'

/** Relative difference between variant and baseline. Illustrative only — no significance testing. */
function lift(e: ABTestExperiment) {
  if (!e.baselineConversionRate || e.variantConversionRate === undefined) return null
  return ((e.variantConversionRate - e.baselineConversionRate) / e.baselineConversionRate) * 100
}

function Lift({ e }: { e: ABTestExperiment }) {
  const l = lift(e)
  if (l === null) return <span className="text-subtle-foreground">—</span>
  return <span className={cn('tabular', l > 0 ? 'text-tone-green-fg' : l < 0 ? 'text-tone-red-fg' : '')}>{l > 0 ? '+' : ''}{l.toFixed(1)}%</span>
}

/**
 * A/B testing programme.
 * TODO(ANALYTICS): Connect A/B test metrics to the approved analytics provider.
 * TODO(EXPERIMENTATION-PLATFORM): Sync experiment status, variants and traffic split from the
 * experimentation platform API (e.g. Shoplift / Intelligems) rather than manual entry.
 * TODO(REPORTING): Generate client-facing experiment reports from stored metric snapshots.
 */
export function ExperimentsPage() {
  useDocumentTitle('A/B Testing')
  useBreadcrumbs([{ label: 'Departments' }, { label: 'A/B Testing' }])
  const tests = useDb((s) => s.abTests)
  const clients = useDb((s) => s.clients)
  const can = useCan('ab.manage')
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('')
  const [clientId, setClientId] = useState('')
  const [editing, setEditing] = useState<ABTestExperiment | 'new' | null>(null)
  const list = useMemo(() => tests.filter((t) => (!status || t.status === status) && (!clientId || t.clientId === clientId)).sort((a, b) => compareDates(b.startDate, a.startDate)), [tests, status, clientId])
  const selected = tests.find((t) => t.id === params.get('exp'))
  const select = (id: string) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('exp', id); else n.delete('exp'); return n })
  const running = tests.filter((t) => t.status === 'running')

  return (
    <div>
      <PageHeader
        title="A/B Testing"
        description={`${running.length} running · ${tests.filter((t) => t.status === 'scheduled').length} scheduled · ${tests.filter((t) => t.status === 'completed').length} completed`}
        actions={<Gate permission="ab.manage" mode="disable"><Button variant="primary" onClick={() => setEditing('new')}><Plus /> New experiment</Button></Gate>}
      />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          <DemoTag /> Conversion rates and sample sizes below are illustrative demo values. They are not connected to any analytics or experimentation platform, and lift is a simple relative difference without significance testing.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-40">
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            {AB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </div>
        {list.length ? (
          <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[1040px] text-left">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                  {['Experiment', 'Client', 'Status', 'Owner', 'Schedule', 'Primary metric', 'Baseline', 'Variant', 'Lift', 'Sample'].map((h) => (
                    <th key={h} scope="col" className={cn('px-3 py-2 font-medium whitespace-nowrap', ['Baseline', 'Variant', 'Lift', 'Sample'].includes(h) && 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} onClick={() => select(t.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="max-w-[300px] px-3 py-2">
                      <span className="block truncate text-[13px] font-medium">{t.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{t.key}</span>
                    </td>
                    <td className="px-3 py-2"><ClientChip clientId={t.clientId} /></td>
                    <td className="px-3 py-2"><MetaBadge list={AB_STATUSES} id={t.status} /></td>
                    <td className="px-3 py-2"><UserChip userId={t.ownerId} /></td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground tabular">
                      {t.startDate ? `${formatShortDate(t.startDate)} → ${formatShortDate(t.endDate)}` : 'Not scheduled'}
                      {t.status === 'running' && t.endDate && <span className="block">{daysUntil(t.endDate)} days left</span>}
                    </td>
                    <td className="px-3 py-2 text-[13px]">{t.primaryMetric}</td>
                    <td className="px-3 py-2 text-right text-[13px] tabular">{t.baselineConversionRate !== undefined ? `${t.baselineConversionRate}%` : '—'}</td>
                    <td className="px-3 py-2 text-right text-[13px] tabular">{t.variantConversionRate !== undefined ? `${t.variantConversionRate}%` : '—'}</td>
                    <td className="px-3 py-2 text-right text-[13px]"><Lift e={t} /></td>
                    <td className="px-3 py-2 text-right text-[13px] tabular">{t.sampleSize?.toLocaleString() ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={FlaskConical} title="No experiments match" />
        )}
      </PageBody>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && select('')}>
        {selected && (
          <SheetContent title={selected.name} className="max-w-[600px]">
            <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="font-mono text-xs">{selected.key}</span>
              <MetaBadge list={AB_STATUSES} id={selected.status} />
              <span className="flex-1" />
              {can.allowed && <Button size="sm" onClick={() => setEditing(selected)}><Pencil /> Edit</Button>}
              <D.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></D.Close>
            </header>
            <ExperimentDetail e={selected} />
          </SheetContent>
        )}
      </Dialog>
      {editing && <ExperimentForm existing={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ExperimentDetail({ e }: { e: ABTestExperiment }) {
  const projects = useDb((s) => s.projects)
  const can = useCan('ab.manage')
  const l = lift(e)
  return (
    <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold">{e.name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <ClientChip clientId={e.clientId} className="text-xs" />
          <UserChip userId={e.ownerId} />
          <span>{e.platform}</span>
          <span>{e.trafficSplit}/{100 - e.trafficSplit} split</span>
        </div>
      </div>
      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Hypothesis</h3>
        <p className="text-[13px] leading-relaxed">{e.hypothesis}</p>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Results · {e.primaryMetric}</h3>
          <DemoTag />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Control', name: e.controlName, value: e.baselineConversionRate },
            { label: 'Variant', name: e.variantName, value: e.variantConversionRate },
          ].map((v) => (
            <div key={v.label} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{v.label}</p>
              <p className="truncate text-[13px] font-medium">{v.name}</p>
              <p className="mt-1 text-2xl font-semibold tabular">{v.value !== undefined ? `${v.value}%` : '—'}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[13px]">
          Relative lift: <Lift e={e} />
          {e.sampleSize ? <span className="text-muted-foreground"> · sample {e.sampleSize.toLocaleString()} sessions</span> : null}
          {l !== null && <span className="block text-xs text-muted-foreground">Statistical significance is not calculated in this prototype.</span>}
        </p>
      </section>
      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Results summary</h3>
        <p className="text-[13px] leading-relaxed">{e.resultsSummary || <span className="text-subtle-foreground">No summary yet.</span>}</p>
      </section>
      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Schedule</h3>
        <p className="text-[13px]">{e.startDate ? `${formatShortDate(e.startDate)} → ${formatShortDate(e.endDate)}` : 'Not scheduled'}</p>
        {can.allowed && e.status !== 'completed' && (
          <div className="mt-2 flex flex-wrap gap-2">
            {e.status === 'draft' && <Button size="sm" onClick={() => { void updateABTest(e.id, { status: 'scheduled' }); toast.success('Experiment scheduled') }}>Schedule</Button>}
            {(e.status === 'scheduled' || e.status === 'paused') && <Button size="sm" onClick={() => { void updateABTest(e.id, { status: 'running' }); toast.success('Marked as running', { description: 'Status only — the experiment platform is not connected.' }) }}>Mark running</Button>}
            {e.status === 'running' && <Button size="sm" onClick={() => { void updateABTest(e.id, { status: 'paused' }); toast.success('Marked as paused') }}>Mark paused</Button>}
            {e.status === 'running' && <Button size="sm" onClick={() => { void updateABTest(e.id, { status: 'completed' }); toast.success('Marked as completed') }}>Mark completed</Button>}
          </div>
        )}
      </section>
      {e.linkedProjectIds.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Linked projects</h3>
          <ul className="space-y-1">
            {e.linkedProjectIds.map((id) => {
              const p = projects.find((x) => x.id === id)
              return p ? <li key={id}><Link to={paths.project(p.id)} className="text-[13px] hover:underline">{p.key} · {p.title}</Link></li> : null
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

function ExperimentForm({ existing, onClose }: { existing?: ABTestExperiment; onClose: () => void }) {
  const me = useCurrentUser()
  const clients = useDb((s) => s.clients)
  const projects = useDb((s) => s.projects)
  const str = (n?: number) => (n === undefined ? '' : String(n))
  const initial = {
    name: existing?.name ?? '', clientId: existing?.clientId ?? '', hypothesis: existing?.hypothesis ?? '', controlName: existing?.controlName ?? 'Control',
    variantName: existing?.variantName ?? '', startDate: existing?.startDate, endDate: existing?.endDate, status: existing?.status ?? ('draft' as ABTestStatus),
    ownerId: existing?.ownerId ?? me.id, primaryMetric: existing?.primaryMetric ?? '', baseline: str(existing?.baselineConversionRate), variant: str(existing?.variantConversionRate),
    sampleSize: str(existing?.sampleSize), trafficSplit: str(existing?.trafficSplit ?? 50), platform: existing?.platform ?? 'To be decided', resultsSummary: existing?.resultsSummary ?? '',
    linkedProjectIds: existing?.linkedProjectIds ?? [],
  }
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
  return (
    <FormDialog
      open
      onClose={onClose}
      title={existing ? `Edit ${existing.key}` : 'New experiment'}
      dirty={JSON.stringify(f) !== JSON.stringify(initial)}
      submitLabel={existing ? 'Save' : 'Create experiment'}
      size="xl"
      onSubmit={async () => {
        const e: Record<string, string> = {}
        if (!f.name.trim()) e.name = 'Enter a name.'
        if (!f.clientId) e.clientId = 'Select a client.'
        if (!f.variantName.trim()) e.variantName = 'Name the variant.'
        if (!f.primaryMetric.trim()) e.primaryMetric = 'Choose a primary metric.'
        if (f.startDate && f.endDate && compareDates(f.endDate, f.startDate) < 0) e.endDate = 'End must be after start.'
        for (const k of ['baseline', 'variant'] as const) { const v = num(f[k]); if (v !== undefined && (Number.isNaN(v) || v < 0 || v > 100)) e[k] = '0–100%' }
        const split = Number(f.trafficSplit)
        if (Number.isNaN(split) || split < 1 || split > 99) e.trafficSplit = '1–99'
        setErrors(e)
        if (Object.keys(e).length) return
        const payload = {
          name: f.name.trim(), clientId: f.clientId, hypothesis: f.hypothesis.trim(), controlName: f.controlName.trim(), variantName: f.variantName.trim(),
          startDate: f.startDate, endDate: f.endDate, status: f.status, ownerId: f.ownerId, primaryMetric: f.primaryMetric.trim(),
          baselineConversionRate: num(f.baseline), variantConversionRate: num(f.variant), sampleSize: num(f.sampleSize), trafficSplit: split,
          platform: f.platform, resultsSummary: f.resultsSummary.trim(), linkedProjectIds: f.linkedProjectIds,
        }
        if (existing) await updateABTest(existing.id, payload)
        else await createABTest(payload)
        toast.success(existing ? 'Experiment updated' : 'Experiment created')
        onClose()
      }}
    >
      <FormSection title="Experiment">
        <Field label="Name" required error={errors.name} className="sm:col-span-2">{(p) => <Input {...p} autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} />}</Field>
        <Field label="Client" required error={errors.clientId}>{(p) => <Select {...p} value={f.clientId} onChange={(e) => setF((x) => ({ ...x, clientId: e.target.value, linkedProjectIds: [] }))}><option value="">Select client…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}</Field>
        <Field label="Linked project">{(p) => <Select {...p} value={f.linkedProjectIds[0] ?? ''} disabled={!f.clientId} onChange={(e) => set('linkedProjectIds', e.target.value ? [e.target.value] : [])}><option value="">None</option>{projects.filter((x) => x.clientId === f.clientId).map((x) => <option key={x.id} value={x.id}>{x.key} · {x.title.slice(0, 45)}</option>)}</Select>}</Field>
        <Field label="Hypothesis" className="sm:col-span-2">{(p) => <Textarea {...p} value={f.hypothesis} onChange={(e) => set('hypothesis', e.target.value)} />}</Field>
        <Field label="Control name">{(p) => <Input {...p} value={f.controlName} onChange={(e) => set('controlName', e.target.value)} />}</Field>
        <Field label="Variant name" required error={errors.variantName}>{(p) => <Input {...p} value={f.variantName} onChange={(e) => set('variantName', e.target.value)} />}</Field>
        <Field label="Status">{(p) => <Select {...p} value={f.status} onChange={(e) => set('status', e.target.value as ABTestStatus)}>{AB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>}</Field>
        <Field label="Owner">{(p) => <UserPicker id={p.id} variant="field" roles={['ab_testing']} allowNone={false} value={f.ownerId} onChange={(v) => v && set('ownerId', v)} />}</Field>
        <Field label="Start date">{(p) => <DatePicker id={p.id} variant="field" value={f.startDate} closed onChange={(v) => set('startDate', v)} />}</Field>
        <Field label="End date" error={errors.endDate}>{(p) => <DatePicker id={p.id} variant="field" value={f.endDate} closed onChange={(v) => set('endDate', v)} />}</Field>
        <Field label="Platform">{(p) => <Select {...p} value={f.platform} onChange={(e) => set('platform', e.target.value)}>{['To be decided', 'Shoplift', 'Intelligems', 'Convert', 'VWO'].map((x) => <option key={x}>{x}</option>)}</Select>}</Field>
        <Field label="Traffic to variant (%)" error={errors.trafficSplit}>{(p) => <Input {...p} type="number" min={1} max={99} value={f.trafficSplit} onChange={(e) => set('trafficSplit', e.target.value)} />}</Field>
      </FormSection>
      <FormSection title="Metrics" description="Manually entered demo values — not pulled from analytics.">
        <Field label="Primary metric" required error={errors.primaryMetric} className="sm:col-span-2">{(p) => <Input {...p} value={f.primaryMetric} onChange={(e) => set('primaryMetric', e.target.value)} placeholder="e.g. Add-to-cart rate" />}</Field>
        <Field label="Baseline conversion (%)" error={errors.baseline}>{(p) => <Input {...p} type="number" step={0.1} value={f.baseline} onChange={(e) => set('baseline', e.target.value)} />}</Field>
        <Field label="Variant conversion (%)" error={errors.variant}>{(p) => <Input {...p} type="number" step={0.1} value={f.variant} onChange={(e) => set('variant', e.target.value)} />}</Field>
        <Field label="Sample size">{(p) => <Input {...p} type="number" min={0} value={f.sampleSize} onChange={(e) => set('sampleSize', e.target.value)} />}</Field>
        <Field label="Results summary" className="sm:col-span-2">{(p) => <Textarea {...p} value={f.resultsSummary} onChange={(e) => set('resultsSummary', e.target.value)} />}</Field>
      </FormSection>
    </FormDialog>
  )
}
