import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlarmClock,
  Ban,
  CalendarCheck,
  CalendarClock,
  CircleCheckBig,
  ClipboardCheck,
  FolderKanban,
  ListTodo,
  Plus,
  TriangleAlert,
} from 'lucide-react'
import type { Department, User } from '@/types'
import { useBreadcrumbs, useUI } from '@/services/ui'
import { useDb } from '@/services/store'
import { useCurrentUser, useProjectStatsMap } from '@/hooks/useData'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { PageBody, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { Badge, EmptyState, Panel, ProgressBar, SectionHeader, Skeleton } from '@/components/ui/display'
import { Gate } from '@/components/common/gate'
import { PriorityIcon, ProjectStatusBadge, ScheduleBadge, TaskStatusBadge } from '@/components/common/badges'
import { ClientAvatar, ClientChip, UserAvatar } from '@/components/common/people'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { MetricTile, StatusDistribution, WorkloadBars } from '@/components/dashboard/widgets'
import { TaskListSheet } from '@/components/tasks/TaskListSheet'
import { compareDates, daysUntil, dueLabel, greeting, now, parseDate } from '@/lib/dates'
import { isProjectActive, isProjectOverdue, isTaskOverdue, projectDueDate } from '@/lib/calculations'
import { DEPARTMENTS, isProjectClosed, isTaskClosed, projectTypeDef, taskTypeDef } from '@/lib/workflow'
import { byId, cn, firstName, pluralize, sum } from '@/lib/utils'
import { paths } from '@/lib/routes'

export function DashboardPage() {
  useDocumentTitle('Overview')
  useBreadcrumbs([{ label: 'Overview' }])
  const loading = useSimulatedLoad('dashboard')
  const me = useCurrentUser()
  const data = useDb()
  const openCreate = useUI((s) => s.openCreateProject)
  const { open: openTask } = useTaskPanel()

  const [clientId, setClientId] = useState('')
  const [department, setDepartment] = useState<Department | ''>('')
  const [assigneeId, setAssigneeId] = useState('')
  const [horizon, setHorizon] = useState('14')

  // Every widget below derives from these two filtered collections.
  const projects = useMemo(
    () =>
      data.projects.filter(
        (p) =>
          !p.archived &&
          (!clientId || p.clientId === clientId) &&
          (!department || projectTypeDef(p.type).department === department),
      ),
    [data.projects, clientId, department],
  )
  const projectIds = useMemo(() => new Set(projects.map((p) => p.id)), [projects])
  const tasks = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          projectIds.has(t.projectId) &&
          (!department || taskTypeDef(t.type).department === department) &&
          (!assigneeId || t.assigneeId === assigneeId),
      ),
    [data.tasks, projectIds, department, assigneeId],
  )
  const stats = useProjectStatsMap(projects)
  const projectMap = useMemo(() => byId(data.projects), [data.projects])

  const openTasks = tasks.filter((t) => !isTaskClosed(t.status))
  const overdueTasks = tasks.filter(isTaskOverdue)
  const dueToday = openTasks.filter((t) => daysUntil(t.dueDate) === 0)
  const activeProjects = projects.filter(isProjectActive)
  const awaitingQi = projects.filter((p) => !isProjectClosed(p.status) && (p.status === 'quality_inspection' || ['awaiting', 'in_progress'].includes(stats.get(p.id)?.qiStatus ?? '')))
  const month = now().getMonth()
  const year = now().getFullYear()
  const completedThisMonth = projects.filter((p) => {
    const d = parseDate(p.completedAt)
    return isProjectClosed(p.status) && d && d.getMonth() === month && d.getFullYear() === year
  })
  const urgentActive = activeProjects.filter((p) => p.priority === 'urgent').length

  const myTasks = data.tasks
    .filter((t) => t.assigneeId === me.id && !isTaskClosed(t.status) && projectMap.get(t.projectId) && !projectMap.get(t.projectId)!.archived)
    .sort((a, b) => (daysUntil(a.dueDate) ?? 999) - (daysUntil(b.dueDate) ?? 999))

  const attention = [
    ...projects.filter(isProjectOverdue).map((p) => ({ kind: 'overdue' as const, project: p, detail: dueLabel(projectDueDate(p)) })),
    ...projects
      .filter((p) => !isProjectOverdue(p) && stats.get(p.id)?.schedule === 'at_risk')
      .map((p) => ({ kind: 'risk' as const, project: p, detail: `${dueLabel(projectDueDate(p))} · ${stats.get(p.id)?.percentComplete}% complete` })),
    ...tasks
      .filter((t) => t.status === 'blocked')
      .map((t) => ({ kind: 'blocked' as const, project: projectMap.get(t.projectId)!, task: t, detail: t.title })),
  ]

  const h = Number(horizon)
  const upcoming = [
    ...openTasks.filter((t) => !t.parentTaskId).map((t) => ({ id: t.id, kind: 'task' as const, title: t.title, date: t.dueDate, projectId: t.projectId, assigneeId: t.assigneeId })),
    ...projects.filter((p) => !isProjectClosed(p.status)).map((p) => ({ id: p.id, kind: 'project' as const, title: p.title, date: projectDueDate(p), projectId: p.id, assigneeId: p.ownerId })),
  ]
    .filter((x) => {
      const n = daysUntil(x.date)
      return n !== null && n >= 0 && n <= h
    })
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  const workload = data.users
    .filter((u) => u.active && (!assigneeId || u.id === assigneeId))
    .map((user) => {
      const mine = openTasks.filter((t) => t.assigneeId === user.id)
      const leaves = mine.filter((t) => !data.tasks.some((k) => k.parentTaskId === t.id))
      return {
        user,
        openTasks: mine.length,
        openHours: Math.round(sum(leaves.map((t) => Math.max(0, (t.estimatedHours ?? 0) - (t.actualHours ?? 0)))) * 10) / 10,
        overdue: mine.filter(isTaskOverdue).length,
      }
    })
    .filter((r) => r.openTasks > 0 || !assigneeId)
    .sort((a, b) => b.openHours - a.openHours)

  const progressProjects = activeProjects
    .filter((p) => !['idea', 'project_setup'].includes(p.status))
    .sort((a, b) => (daysUntil(projectDueDate(a)) ?? 999) - (daysUntil(projectDueDate(b)) ?? 999))
    .slice(0, 6)

  const recent = data.activity
    .filter((a) => !a.projectId || projectIds.has(a.projectId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  const filtersActive = clientId || department || assigneeId

  // Metric tiles and workload bars open a task list over the dashboard (?list=…&who=…).
  const [params, setParams] = useSearchParams()
  const listKind = params.get('list') as 'open' | 'overdue' | 'today' | null
  const listWho = data.users.find((u) => u.id === params.get('who'))
  const listTasks = (listKind === 'overdue' ? overdueTasks : listKind === 'today' ? dueToday : listKind === 'open' ? openTasks : [])
    .filter((t) => !listWho || t.assigneeId === listWho.id)
    .sort((a, b) => compareDates(a.dueDate, b.dueDate))
  const listTitle = { open: 'Open tasks', overdue: 'Overdue tasks', today: 'Due today' }[listKind ?? 'open'] + (listWho ? ` · ${listWho.name}` : '')
  const listScope = [
    clientId && data.clients.find((c) => c.id === clientId)?.name,
    department && DEPARTMENTS.find((d) => d.id === department)?.label,
    assigneeId && !listWho && data.users.find((u) => u.id === assigneeId)?.name,
  ].filter(Boolean).join(' · ')
  const closeList = () =>
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      n.delete('list')
      n.delete('who')
      return n
    })

  return (
    <div>
      <div className="border-b border-border px-4 pt-5 pb-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {greeting()}, {firstName(me.name)}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {myTasks.length ? (
                <>
                  You have {pluralize(myTasks.length, 'open task')}
                  {myTasks.filter(isTaskOverdue).length > 0 && <>, <span className="font-medium text-tone-red-fg">{myTasks.filter(isTaskOverdue).length} overdue</span></>}
                  {myTasks.filter((t) => daysUntil(t.dueDate) === 0).length > 0 && <> and {myTasks.filter((t) => daysUntil(t.dueDate) === 0).length} due today</>}.
                </>
              ) : (
                'Nothing assigned to you right now.'
              )}{' '}
              Today is {format(now(), "EEEE, MMM d")}.
            </p>
          </div>
          <Gate permission="project.create" mode="hide">
            <Button variant="primary" onClick={() => openCreate()}>
              <Plus /> New project
            </Button>
          </Gate>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Dashboard filters">
          <Select aria-label="Filter by client" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-40">
            <option value="">All clients</option>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Filter by department" value={department} onChange={(e) => setDepartment(e.target.value as Department | '')} className="w-44">
            <option value="">All departments</option>
            {DEPARTMENTS.filter((d) => d.id !== 'operations').map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </Select>
          <Select aria-label="Filter by assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-40">
            <option value="">Everyone</option>
            {data.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select aria-label="Deadline horizon" value={horizon} onChange={(e) => setHorizon(e.target.value)} className="w-36">
            <option value="7">Next 7 days</option>
            <option value="14">Next 14 days</option>
            <option value="30">Next 30 days</option>
          </Select>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={() => { setClientId(''); setDepartment(''); setAssigneeId('') }}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <PageBody className="space-y-6">
        <section aria-label="Summary metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-xl" />)
          ) : (
            <>
              <MetricTile label="Active projects" value={activeProjects.length} icon={FolderKanban} to="/projects?scope=active" caption={urgentActive ? `${urgentActive} urgent` : `${projects.length} total`} />
              <MetricTile label="Open tasks" value={openTasks.length} icon={ListTodo} to="?list=open" caption={`${tasks.filter((t) => t.status === 'in_progress').length} in progress`} />
              <MetricTile label="Overdue tasks" value={overdueTasks.length} icon={AlarmClock} to="?list=overdue" emphasis="danger" caption={overdueTasks.length ? `Oldest ${dueLabel(overdueTasks.map((t) => t.dueDate!).sort()[0]).replace(' overdue', '')}` : 'All on track'} />
              <MetricTile label="Due today" value={dueToday.length} icon={CalendarClock} to="?list=today" emphasis="warning" caption={dueToday[0]?.title ?? 'Nothing due today'} />
              <MetricTile label="Awaiting QI" value={awaitingQi.length} icon={ClipboardCheck} to="/qi" caption={pluralize(data.qiRecords.filter((q) => q.status === "awaiting" && projectIds.has(q.projectId)).length, "task") + " in queue"} />
              <MetricTile label="Done this month" value={completedThisMonth.length} icon={CircleCheckBig} to="/projects?status=done,archive_soon" caption={completedThisMonth.length ? `${completedThisMonth.filter((p) => stats.get(p.id)?.schedule === 'completed_on_time').length} on time` : 'None yet'} />
            </>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section aria-labelledby="mywork-h">
              <SectionHeader title={<span id="mywork-h">My work</span>} description={`Open tasks assigned to ${me.name}`} action={<Link to="/tasks/mine" className="text-xs text-primary hover:underline">View all</Link>} />
              <Panel>
                {loading ? (
                  <div className="space-y-2 p-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
                ) : myTasks.length ? (
                  <ul className="divide-y divide-border">
                    {myTasks.slice(0, 6).map((t) => {
                      const p = projectMap.get(t.projectId)
                      return (
                        <li key={t.id}>
                          <button type="button" onClick={() => openTask(t.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2">
                            <PriorityIcon priority={t.priority} className="size-3.5 shrink-0" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium">{t.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{t.key} · {p?.title}</span>
                            </span>
                            <TaskStatusBadge status={t.status} className="max-sm:hidden" />
                            <span className={cn('w-28 text-right text-xs whitespace-nowrap tabular', isTaskOverdue(t) ? 'font-medium text-tone-red-fg' : daysUntil(t.dueDate) === 0 ? 'font-medium text-tone-amber-fg' : 'text-muted-foreground')}>
                              {dueLabel(t.dueDate)}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <EmptyState compact icon={CalendarCheck} title="You're clear" description="No open tasks are assigned to you. Switch roles from the user menu to preview other team members." />
                )}
              </Panel>
            </section>

            <section aria-labelledby="attention-h">
              <SectionHeader title={<span id="attention-h">Requires attention</span>} description="Overdue projects, at-risk deadlines and blocked work" />
              <Panel>
                {attention.length ? (
                  <ul className="divide-y divide-border">
                    {attention.map((a, i) => {
                      const meta = {
                        overdue: { icon: AlarmClock, label: 'Overdue', tone: 'red' as const },
                        risk: { icon: TriangleAlert, label: 'At risk', tone: 'amber' as const },
                        blocked: { icon: Ban, label: 'Blocked', tone: 'red' as const },
                      }[a.kind]
                      const to = a.kind === 'blocked' && 'task' in a && a.task ? paths.task(a.project.id, a.task.id) : paths.project(a.project.id)
                      return (
                        <li key={i}>
                          <Link to={to} className="flex items-center gap-3 px-3 py-2 hover:bg-surface-2">
                            <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium">{a.project.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                            </span>
                            <ClientAvatar client={data.clients.find((c) => c.id === a.project.clientId)} size="xs" />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <EmptyState compact icon={CircleCheckBig} title="Nothing needs attention" description="No overdue projects, at-risk deadlines or blocked tasks for these filters." />
                )}
              </Panel>
            </section>

            <section aria-labelledby="progress-h">
              <SectionHeader title={<span id="progress-h">Project progress</span>} description="Active projects by nearest due date · progress derived from tasks" action={<Link to="/projects" className="text-xs text-primary hover:underline">All projects</Link>} />
              <Panel>
                {progressProjects.length ? (
                  <ul className="divide-y divide-border">
                    {progressProjects.map((p) => {
                      const s = stats.get(p.id)!
                      return (
                        <li key={p.id}>
                          <Link to={paths.project(p.id)} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-3 py-2.5 hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_140px_120px_100px]">
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-medium">{p.title}</span>
                              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ClientChip clientId={p.clientId} link={false} className="text-xs" /> · {s.doneCount}/{s.taskCount} tasks
                              </span>
                            </span>
                            <span className="flex items-center gap-2 max-sm:col-span-2 max-sm:row-start-2">
                              <ProgressBar value={s.percentComplete} />
                              <span className="w-9 text-right text-xs tabular">{s.percentComplete}%</span>
                            </span>
                            <span className="max-sm:hidden"><ProjectStatusBadge status={p.status} /></span>
                            <span className="text-right max-sm:col-start-2 max-sm:row-start-1"><ScheduleBadge health={s.schedule} /></span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <EmptyState compact icon={FolderKanban} title="No active projects" />
                )}
              </Panel>
            </section>
          </div>

          <div className="space-y-6">
            <section aria-labelledby="deadlines-h">
              <SectionHeader title={<span id="deadlines-h">Upcoming deadlines</span>} description={`Next ${horizon} days · projects and tasks`} action={<Link to="/calendar" className="text-xs text-primary hover:underline">Calendar</Link>} />
              <Panel className="p-1">
                {upcoming.length ? (
                  <ol>
                    {upcoming.slice(0, 8).map((u) => {
                      const d = parseDate(u.date)!
                      return (
                        <li key={`${u.kind}-${u.id}`}>
                          {u.kind === 'project' ? (
                            <Link to={paths.project(u.id)} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                              <DeadlineRow d={d} title={u.title} kind="Project deadline" user={data.users.find((x) => x.id === u.assigneeId)} />
                            </Link>
                          ) : (
                            <button type="button" onClick={() => openTask(u.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2">
                              <DeadlineRow d={d} title={u.title} kind={`Task · ${projectMap.get(u.projectId)?.key ?? ''}`} user={data.users.find((x) => x.id === u.assigneeId)} />
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <p className="py-6 text-center text-[13px] text-muted-foreground">No deadlines in the next {horizon} days.</p>
                )}
              </Panel>
            </section>

            <section aria-labelledby="workload-h">
              <SectionHeader title={<span id="workload-h">Team workload</span>} description="Remaining estimated hours on open tasks vs weekly capacity" />
              <Panel className="p-3">
                {workload.length ? <WorkloadBars rows={workload} /> : <p className="py-4 text-center text-[13px] text-muted-foreground">No assigned work.</p>}
              </Panel>
            </section>

            <section aria-labelledby="status-h">
              <SectionHeader title={<span id="status-h">Projects by status</span>} description={`${projects.length} projects`} />
              <Panel className="p-3">
                <StatusDistribution projects={projects} />
              </Panel>
            </section>

            <section aria-labelledby="activity-h">
              <SectionHeader title={<span id="activity-h">Recent activity</span>} description="Local prototype activity" action={<Link to="/inbox" className="text-xs text-primary hover:underline">Inbox</Link>} />
              <Panel className="px-3 py-1">
                <ActivityFeed events={recent} showProject compact />
              </Panel>
            </section>
          </div>
        </div>
      </PageBody>
      <TaskListSheet
        open={Boolean(listKind)}
        onClose={closeList}
        title={listTitle}
        description={listScope ? `Dashboard filters: ${listScope}` : 'All clients and departments'}
        tasks={listTasks}
      />
    </div>
  )
}

function DeadlineRow({ d, title, kind, user }: { d: Date; title: string; kind: string; user?: User }) {
  const n = daysUntil(d.toISOString())
  return (
    <>
      <span className={cn('flex w-10 shrink-0 flex-col items-center rounded-md border border-border py-0.5 leading-none', n === 0 && 'border-tone-amber-dot bg-tone-amber-bg')}>
        <span className="text-[10px] text-muted-foreground uppercase">{d.toLocaleString('en', { month: 'short' })}</span>
        <span className="text-sm font-semibold tabular">{d.getDate()}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{kind}</span>
      </span>
      <UserAvatar user={user} size="xs" />
    </>
  )
}
