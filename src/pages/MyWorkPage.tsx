import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, ClipboardCheck, Eye, FolderKanban, ListTodo } from 'lucide-react'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { useCurrentUser, useNotifications, useProjectStatsMap } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { EmptyState, Panel, ProgressBar, SectionHeader } from '@/components/ui/display'
import { ProjectStatusBadge, ScheduleBadge } from '@/components/common/badges'
import { ClientChip } from '@/components/common/people'
import { NotificationRow } from '@/components/activity/NotificationList'
import { TaskListRow, groupOf } from './MyTasksPage'
import { projectMembers } from '@/lib/filters'
import { isProjectActive, projectDueDate } from '@/lib/calculations'
import { compareDates, formatShortDate } from '@/lib/dates'
import { roleDef } from '@/lib/workflow'
import { paths } from '@/lib/routes'

/** Personal hub: my projects, my open tasks, things waiting on me, and mentions. */
export function MyWorkPage() {
  useDocumentTitle('My Work')
  useBreadcrumbs([{ label: 'My Work' }])
  const me = useCurrentUser()
  const { projects, tasks, qiRecords } = useDb()
  const notifications = useNotifications()

  const myProjects = useMemo(() => projects.filter((p) => isProjectActive(p) && projectMembers(p).includes(me.id)).sort((a, b) => compareDates(projectDueDate(a), projectDueDate(b))), [projects, me.id])
  const stats = useProjectStatsMap(myProjects)
  const myTasks = tasks.filter((t) => t.assigneeId === me.id && groupOf(t) !== 'completed').sort((a, b) => compareDates(a.dueDate, b.dueDate))
  const leadProjectIds = new Set(projects.filter((p) => p.leadId === me.id || p.ownerId === me.id).map((p) => p.id))
  const waiting = [
    ...qiRecords.filter((q) => q.inspectorId === me.id && (q.status === 'awaiting' || q.status === 'in_progress')).map((q) => tasks.find((t) => t.id === q.taskId)),
    ...tasks.filter((t) => t.status === 'in_review' && leadProjectIds.has(t.projectId) && t.assigneeId !== me.id),
  ].filter((t): t is NonNullable<typeof t> => Boolean(t))
  const mentions = notifications.filter((n) => n.type === 'mention' || n.type === 'comment').slice(0, 5)

  return (
    <div>
      <PageHeader title="My Work" description={`${me.name} · ${roleDef(me.role).label}`} />
      <PageBody className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section>
            <SectionHeader icon={ListTodo} title="My open tasks" description="Sorted by due date" action={<Link to="/tasks/mine" className="text-xs text-primary hover:underline">Grouped view</Link>} />
            {myTasks.length ? (
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface">{myTasks.slice(0, 10).map((t) => <TaskListRow key={t.id} task={t} />)}</ul>
            ) : (
              <Panel><EmptyState compact icon={ListTodo} title="No open tasks" /></Panel>
            )}
          </section>
          <section>
            <SectionHeader icon={Eye} title="Waiting on me" description="QI inspections assigned to me and work in review on projects I lead or own" />
            {waiting.length ? (
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface">{waiting.map((t) => <TaskListRow key={t.id} task={t} />)}</ul>
            ) : (
              <Panel><EmptyState compact icon={ClipboardCheck} title="Nothing waiting on you" /></Panel>
            )}
          </section>
        </div>
        <div className="space-y-6">
          <section>
            <SectionHeader icon={FolderKanban} title="My projects" description="Active projects I'm part of" />
            <Panel>
              {myProjects.length ? (
                <ul className="divide-y divide-border">
                  {myProjects.map((p) => {
                    const s = stats.get(p.id)!
                    return (
                      <li key={p.id}>
                        <Link to={paths.project(p.id)} className="block px-3 py-2.5 hover:bg-surface-2">
                          <span className="block truncate text-[13px] font-medium">{p.title}</span>
                          <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <ClientChip clientId={p.clientId} link={false} className="text-xs" /> · Due {formatShortDate(projectDueDate(p))}
                          </span>
                          <span className="mt-1.5 flex items-center gap-2">
                            <ProgressBar value={s.percentComplete} />
                            <span className="text-xs tabular">{s.percentComplete}%</span>
                          </span>
                          <span className="mt-1.5 flex gap-1.5"><ProjectStatusBadge status={p.status} /><ScheduleBadge health={s.schedule} /></span>
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
          <section>
            <SectionHeader icon={AtSign} title="Mentions & comments" action={<Link to="/inbox" className="text-xs text-primary hover:underline">Inbox</Link>} />
            <Panel className="p-1">
              {mentions.length ? mentions.map((n) => <NotificationRow key={n.id} n={n} dense />) : <p className="px-3 py-4 text-[13px] text-muted-foreground">No mentions.</p>}
            </Panel>
          </section>
        </div>
      </PageBody>
    </div>
  )
}
