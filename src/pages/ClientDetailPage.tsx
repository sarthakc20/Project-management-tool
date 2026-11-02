import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Task } from '@/types'
import { Building2, CalendarClock, Columns3, ExternalLink, FolderKanban, Globe, Hash, ListChecks, Mail, Pencil, Plus, Search } from 'lucide-react'
import { useBreadcrumbs, useUI } from '@/services/ui'
import { useDb } from '@/services/store'
import { updateClient } from '@/services/api'
import { useCan, useClient, useProjectStatsMap } from '@/hooks/useData'
import { useDocumentTitle, PageBody } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { EmptyState, Panel, ProgressBar, SectionHeader, Tabs, TabsList, TabsTrigger } from '@/components/ui/display'
import { Input, Select, Textarea } from '@/components/ui/form'
import { Gate } from '@/components/common/gate'
import { ClientAvatar, UserChip } from '@/components/common/people'
import { MetaBadge, ProjectStatusBadge, ScheduleBadge } from '@/components/common/badges'
import { StatusDistribution } from '@/components/dashboard/widgets'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { ProjectTable } from '@/components/projects/ProjectTable'
import { ProjectStatusBoard } from '@/components/projects/ProjectStatusBoard'
import { ProjectFilterBar, useProjectFilterState } from '@/components/projects/ProjectFilters'
import { TaskTable, ALL_TASK_COLUMNS } from '@/components/tasks/TaskTable'
import { isProjectActive, projectDueDate } from '@/lib/calculations'
import { CLIENT_STATUSES, isProjectClosed, isTaskClosed } from '@/lib/workflow'
import { compareDates, daysUntil, dueLabel, formatDate, formatShortDate } from '@/lib/dates'
import { paths } from '@/lib/routes'
import { includesText, pluralize } from '@/lib/utils'

const TABS = ['overview', 'board', 'projects', 'tasks', 'activity', 'details']

export function ClientDetailPage() {
  const { clientId } = useParams()
  const client = useClient(clientId)
  const { projects: allProjects, tasks: allTasks, activity } = useDb()
  const openCreate = useUI((s) => s.openCreateProject)
  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab') ?? '') ? params.get('tab')! : 'overview'

  useDocumentTitle(client?.name ?? 'Client not found')
  useBreadcrumbs([{ label: 'Clients', to: '/clients' }, { label: client?.name ?? 'Not found' }])

  const projects = useMemo(() => allProjects.filter((p) => p.clientId === clientId && !p.archived), [allProjects, clientId])
  const ids = useMemo(() => new Set(projects.map((p) => p.id)), [projects])
  const tasks = useMemo(() => allTasks.filter((t) => ids.has(t.projectId)), [allTasks, ids])
  const stats = useProjectStatsMap(projects)
  const events = useMemo(
    () => activity.filter((a) => a.clientId === clientId || (a.projectId && ids.has(a.projectId))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activity, clientId, ids],
  )

  if (!client)
    return <EmptyState icon={Building2} title="Client not found" action={<Button asChild><Link to="/clients">Back to clients</Link></Button>} className="py-24" />

  const active = projects.filter(isProjectActive)
  const completed = projects.filter((p) => isProjectClosed(p.status))
  const openTasks = tasks.filter((t) => !isTaskClosed(t.status))
  const upcoming = [
    ...active.map((p) => ({ id: p.id, title: p.title, date: projectDueDate(p), kind: 'Project', to: paths.project(p.id) })),
    ...openTasks.filter((t) => !t.parentTaskId).map((t) => ({ id: t.id, title: t.title, date: t.dueDate, kind: 'Task', to: paths.task(t.projectId, t.id) })),
  ]
    .filter((x) => { const n = daysUntil(x.date); return n !== null && n >= -14 })
    .sort((a, b) => compareDates(a.date, b.date))
    .slice(0, 8)

  return (
    <div>
      <div className="border-b border-border px-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-start gap-4">
          <ClientAvatar client={client} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
              <MetaBadge list={CLIENT_STATUSES} id={client.status} />
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
              <span>{client.industry}</span>
              <span>{client.plan}</span>
              <a href={client.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><Globe className="size-3.5" /> {client.website.replace('https://', '')}</a>
              <span className="inline-flex items-center gap-1">AM <UserChip userId={client.accountManagerId} /></span>
            </p>
          </div>
          <Gate permission="project.create" mode="disable">
            <Button variant="primary" size="lg" onClick={() => openCreate({ clientId: client.id })}>
              <Plus /> Create project
            </Button>
          </Gate>
        </div>
        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
          <TabsList className="mt-4 -mb-px border-b-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="board"><Columns3 /> Status board</TabsTrigger>
            <TabsTrigger value="projects" count={projects.length}>Projects</TabsTrigger>
            <TabsTrigger value="tasks" count={openTasks.length}>Tasks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <PageBody>
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Active projects', active.length],
                  ['Completed', completed.length],
                  ['Open tasks', openTasks.length],
                  ['Overdue tasks', openTasks.filter((t) => (daysUntil(t.dueDate) ?? 0) < 0).length],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl border border-border bg-surface px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="mt-1 text-xl font-semibold tabular">{v}</p>
                  </div>
                ))}
              </div>
              <section>
                <SectionHeader title="Active projects" action={<Link to="?tab=projects" className="text-xs text-primary hover:underline">All projects</Link>} />
                <Panel>
                  {active.length ? (
                    <ul className="divide-y divide-border">
                      {active.map((p) => {
                        const s = stats.get(p.id)!
                        return (
                          <li key={p.id}>
                            <Link to={paths.project(p.id)} className="flex flex-wrap items-center gap-3 px-3 py-2.5 hover:bg-surface-2">
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-medium">{p.title}</span>
                                <span className="text-xs text-muted-foreground">{p.key} · Due {formatShortDate(projectDueDate(p))}</span>
                              </span>
                              <span className="flex w-32 items-center gap-2"><ProgressBar value={s.percentComplete} /><span className="text-xs tabular">{s.percentComplete}%</span></span>
                              <ProjectStatusBadge status={p.status} />
                              <ScheduleBadge health={s.schedule} />
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <EmptyState compact icon={FolderKanban} title="No active projects" description="Create a project to start tracking work for this client." />
                  )}
                </Panel>
              </section>
              <section>
                <SectionHeader title="Completed projects" />
                <Panel>
                  {completed.length ? (
                    <ul className="divide-y divide-border">
                      {completed.map((p) => (
                        <li key={p.id}>
                          <Link to={paths.project(p.id)} className="flex items-center gap-3 px-3 py-2 hover:bg-surface-2">
                            <span className="min-w-0 flex-1 truncate text-[13px]">{p.title}</span>
                            <span className="text-xs text-muted-foreground">Completed {formatShortDate(p.completedAt)}</span>
                            <ScheduleBadge health={stats.get(p.id)!.schedule} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-4 text-[13px] text-muted-foreground">No completed projects yet.</p>
                  )}
                </Panel>
              </section>
              <section>
                <SectionHeader title="Recent activity" />
                <Panel className="px-3 py-1"><ActivityFeed events={events.slice(0, 8)} showProject compact /></Panel>
              </section>
            </div>
            <div className="space-y-6">
              <section>
                <SectionHeader title="Upcoming deadlines" icon={CalendarClock} />
                <Panel className="p-1">
                  {upcoming.length ? (
                    <ul>
                      {upcoming.map((u) => (
                        <li key={u.id}>
                          <Link to={u.to} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                            <span className="w-14 text-xs tabular">{formatShortDate(u.date)}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px]">{u.title}</span>
                              <span className="block text-[11px] text-muted-foreground">{u.kind} · {dueLabel(u.date)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-4 text-[13px] text-muted-foreground">No upcoming deadlines.</p>
                  )}
                </Panel>
              </section>
              <section>
                <SectionHeader title="Project status" />
                <Panel className="p-3"><StatusDistribution projects={projects} /></Panel>
              </section>
              <section>
                <SectionHeader title="Assigned team" />
                <Panel className="p-2">
                  <ul className="space-y-1">
                    {client.teamMemberIds.map((id) => (
                      <li key={id} className="flex items-center justify-between rounded-md px-1.5 py-1">
                        <UserChip userId={id} size="sm" />
                        {id === client.accountManagerId && <span className="text-[11px] text-muted-foreground">Account manager</span>}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </section>
              <section>
                <SectionHeader title="External links" />
                <ClientLinks clientId={client.id} />
              </section>
            </div>
          </div>
        )}
        {tab === 'board' && <ClientStatusBoard clientId={client.id} clientName={client.name} />}
        {tab === 'projects' && <ClientProjects clientId={client.id} />}
        {tab === 'tasks' && <ClientTasks tasks={tasks} />}
        {tab === 'activity' && (
          <div className="max-w-3xl">
            <p className="mb-2 text-xs text-muted-foreground">{pluralize(events.length, 'event')} across this client's projects · local prototype data</p>
            <ActivityFeed events={events} showProject />
          </div>
        )}
        {tab === 'details' && <ClientDetails clientId={client.id} />}
      </PageBody>
    </div>
  )
}

function ClientLinks({ clientId }: { clientId: string }) {
  const client = useClient(clientId)!
  const links = [
    ...(client.clientPortalUrl ? [{ id: 'portal', label: 'Client portal', url: client.clientPortalUrl }] : []),
    ...client.links,
  ]
  return (
    <Panel className="p-1">
      {links.length ? (
        <ul>
          {links.map((l) => (
            <li key={l.id}>
              <a href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-2">
                <ExternalLink className="size-3.5 text-muted-foreground" /> <span className="truncate">{l.label}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-3 text-[13px] text-muted-foreground">No links added.</p>
      )}
    </Panel>
  )
}

function ClientProjects({ clientId }: { clientId: string }) {
  const all = useDb((s) => s.projects)
  const filter = useProjectFilterState(clientId)
  const projects = useMemo(() => filter.apply(all, () => undefined), [all, filter])
  return (
    <div className="space-y-4">
      <ProjectFilterBar state={filter} hideClient showColumns />
      {!projects.length ? (
        <EmptyState icon={FolderKanban} title="No projects match" description="Clear filters or create a project for this client." />
      ) : (
        <ProjectTable projects={projects} hideClient />
      )}
    </div>
  )
}

/** Every project of the client stacked by Notion status, with selectable status columns. */
function ClientStatusBoard({ clientId, clientName }: { clientId: string; clientName: string }) {
  const all = useDb((s) => s.projects)
  const [q, setQ] = useState('')
  const projects = useMemo(
    () => all.filter((p) => p.clientId === clientId && !p.archived && includesText([p.title, p.key, ...p.tags], q)),
    [all, clientId, q],
  )
  const total = all.filter((p) => p.clientId === clientId && !p.archived).length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[13px] text-muted-foreground">
          All {total} {clientName} projects across every status. Pick which status columns to show.
        </p>
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search this board" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
      </div>
      {total ? (
        <ProjectStatusBoard projects={projects} showClient={false} />
      ) : (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project for this client to see it on the board." />
      )}
    </div>
  )
}

function ClientTasks({ tasks }: { tasks: Task[] }) {
  const [show, setShow] = useState<'open' | 'all' | 'overdue'>('open')
  const list = tasks
    .filter((t) => !t.parentTaskId)
    .filter((t) => (show === 'all' ? true : show === 'open' ? !isTaskClosed(t.status) : !isTaskClosed(t.status) && (daysUntil(t.dueDate) ?? 0) < 0))
    .sort((a, b) => compareDates(a.dueDate, b.dueDate))
  return (
    <div className="space-y-3">
      <Select aria-label="Show tasks" value={show} onChange={(e) => setShow(e.target.value as typeof show)} className="w-40">
        <option value="open">Open tasks</option>
        <option value="overdue">Overdue</option>
        <option value="all">All tasks</option>
      </Select>
      <TaskTable tasks={list} columns={ALL_TASK_COLUMNS} emptyState={<EmptyState icon={ListChecks} title="No tasks here" />} />
    </div>
  )
}

function ClientDetails({ clientId }: { clientId: string }) {
  const client = useClient(clientId)!
  const can = useCan('client.edit')
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(client.notes)
  const rows: [string, React.ReactNode][] = [
    ['Primary contact', <span key="c">{client.primaryContact.name} · {client.primaryContact.role}</span>],
    ['Contact email', <a key="e" href={`mailto:${client.primaryContact.email}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Mail className="size-3.5" />{client.primaryContact.email}</a>],
    ['Website', <a key="w" href={client.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{client.website}</a>],
    ['Shopify domain', <code key="d" className="font-mono text-xs">{client.shopifyDomain}</code>],
    ['Plan', client.plan],
    ['Slack channel', client.slackChannel ? <span key="s" className="inline-flex items-center gap-1"><Hash className="size-3.5" />{client.slackChannel.replace('#', '')}</span> : '—'],
    ['Timezone', client.timezone],
    ['Account manager', <UserChip key="am" userId={client.accountManagerId} />],
    ['Client since', formatDate(client.createdAt)],
    ['Project key prefix', <code key="k" className="font-mono text-xs">{client.code}</code>],
  ]
  return (
    <div className="grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
      <section>
        <SectionHeader title="Client information" />
        <dl className="divide-y divide-border rounded-xl border border-border bg-surface px-3">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[140px_1fr] gap-3 py-2 text-[13px]">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 truncate">{v}</dd>
            </div>
          ))}
        </dl>
        {/* TODO(EMAIL-SLACK): Link the Slack channel and contact to the Slack/CRM integrations once approved. */}
      </section>
      <section>
        <SectionHeader title="Account notes" action={can.allowed && !editing && <Button size="xs" variant="ghost" onClick={() => setEditing(true)}><Pencil /> Edit</Button>} />
        {editing ? (
          <div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Account notes" className="min-h-[140px]" />
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setNotes(client.notes); setEditing(false) }}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={() => { void updateClient(client.id, { notes }); setEditing(false); toast.success('Notes saved') }}>Save</Button>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{client.notes || 'No notes.'}</p>
        )}
        {!can.allowed && <p className="mt-2 text-xs text-muted-foreground">{can.reason}.</p>}
        <div className="mt-6">
          <SectionHeader title="Links" />
          <ClientLinks clientId={client.id} />
        </div>
      </section>
    </div>
  )
}
