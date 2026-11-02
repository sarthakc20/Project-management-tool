import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Building2, ChevronsUpDown, Search } from 'lucide-react'
import type { Client } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { EmptyState, Skeleton } from '@/components/ui/display'
import { Input, Select } from '@/components/ui/form'
import { ClientAvatar, UserChip } from '@/components/common/people'
import { MetaBadge } from '@/components/common/badges'
import { isProjectActive, projectDueDate } from '@/lib/calculations'
import { CLIENT_STATUSES, isProjectClosed, isTaskClosed } from '@/lib/workflow'
import { compareDates, dueLabel, formatShortDate, relativeTime } from '@/lib/dates'
import { cn, includesText } from '@/lib/utils'
import { paths } from '@/lib/routes'

interface ClientRow {
  client: Client
  active: number
  openTasks: number
  nextDeadline?: { date: string; title: string }
  lastActivity?: string
}

type SortKey = 'name' | 'industry' | 'active' | 'openTasks' | 'deadline' | 'activity'

export function useClientRows(): ClientRow[] {
  const { clients, projects, tasks, activity } = useDb()
  return useMemo(
    () =>
      clients.map((client) => {
        const cp = projects.filter((p) => p.clientId === client.id && !p.archived)
        const ids = new Set(cp.map((p) => p.id))
        const next = cp
          .filter((p) => !isProjectClosed(p.status) && projectDueDate(p))
          .sort((a, b) => compareDates(projectDueDate(a), projectDueDate(b)))[0]
        const last = activity.filter((a) => a.clientId === client.id || (a.projectId && ids.has(a.projectId))).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        return {
          client,
          active: cp.filter(isProjectActive).length,
          openTasks: tasks.filter((t) => ids.has(t.projectId) && !isTaskClosed(t.status)).length,
          nextDeadline: next ? { date: projectDueDate(next)!, title: next.title } : undefined,
          lastActivity: last?.createdAt,
        }
      }),
    [clients, projects, tasks, activity],
  )
}

export function ClientsPage() {
  useDocumentTitle('Clients')
  useBreadcrumbs([{ label: 'Clients' }])
  const loading = useSimulatedLoad('clients')
  const navigate = useNavigate()
  const users = useDb((s) => s.users)
  const rows = useClientRows()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [am, setAm] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 })

  const filtered = useMemo(() => {
    const list = rows.filter(
      (r) => (!status || r.client.status === status) && (!am || r.client.accountManagerId === am) && includesText([r.client.name, r.client.industry, r.client.code], q),
    )
    const v = (r: ClientRow): string | number => {
      switch (sort.key) {
        case 'name': return r.client.name
        case 'industry': return r.client.industry
        case 'active': return r.active
        case 'openTasks': return r.openTasks
        case 'deadline': return r.nextDeadline?.date ?? '9999'
        case 'activity': return r.lastActivity ?? ''
      }
    }
    return list.sort((a, b) => (v(a) < v(b) ? -1 : v(a) > v(b) ? 1 : 0) * sort.dir)
  }, [rows, q, status, am, sort])

  const th = (key: SortKey, label: string, className?: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cn('px-3 py-2 font-medium whitespace-nowrap', className)}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))}>
        {label}
        {sort.key === key ? sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
      </button>
    </th>
  )

  return (
    <div>
      <PageHeader title="All Clients" description={`${rows.length} clients · ${rows.reduce((a, r) => a + r.active, 0)} active projects`} />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search clients" placeholder="Search clients or industries…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <Select aria-label="Client status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            {CLIENT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <Select aria-label="Account manager" value={am} onChange={(e) => setAm(e.target.value)} className="w-44">
            <option value="">Any account manager</option>
            {users.filter((u) => u.role === 'account_manager' || u.role === 'admin').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !filtered.length ? (
          <EmptyState icon={Building2} title="No clients found" description="Adjust the search or filters." />
        ) : (
          <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                  {th('name', 'Client')}
                  {th('industry', 'Industry')}
                  <th scope="col" className="px-3 py-2 font-medium">Account manager</th>
                  {th('active', 'Active projects', 'text-right')}
                  {th('openTasks', 'Open tasks', 'text-right')}
                  {th('deadline', 'Next deadline')}
                  <th scope="col" className="px-3 py-2 font-medium">Status</th>
                  {th('activity', 'Last activity')}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.client.id} onClick={() => navigate(paths.client(r.client.id))} className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-3 py-2.5">
                      <a href={paths.client(r.client.id)} onClick={(e) => { e.preventDefault(); navigate(paths.client(r.client.id)) }} className="flex items-center gap-2.5">
                        <ClientAvatar client={r.client} size="md" />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium hover:underline">{r.client.name}</span>
                          <span className="block text-xs text-muted-foreground">{r.client.shopifyDomain}</span>
                        </span>
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-muted-foreground">{r.client.industry}</td>
                    <td className="px-3 py-2.5"><UserChip userId={r.client.accountManagerId} /></td>
                    <td className="px-3 py-2.5 text-right text-[13px] tabular">{r.active}</td>
                    <td className="px-3 py-2.5 text-right text-[13px] tabular">{r.openTasks}</td>
                    <td className="px-3 py-2.5">
                      {r.nextDeadline ? (
                        <span className="block max-w-[220px]">
                          <span className="block text-[13px] tabular">{formatShortDate(r.nextDeadline.date)} <span className="text-xs text-muted-foreground">· {dueLabel(r.nextDeadline.date)}</span></span>
                          <span className="block truncate text-xs text-muted-foreground">{r.nextDeadline.title}</span>
                        </span>
                      ) : (
                        <span className="text-[13px] text-subtle-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><MetaBadge list={CLIENT_STATUSES} id={r.client.status} /></td>
                    <td className="px-3 py-2.5 text-[13px] whitespace-nowrap text-muted-foreground">{relativeTime(r.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </div>
  )
}
