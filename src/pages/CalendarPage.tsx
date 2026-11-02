import { useMemo, useState } from 'react'
import type { TaskStatus } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useAllProjects, useAllTasks, useClients, useUsers } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Segmented, Select } from '@/components/ui/form'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { useCalendarEvents } from '@/components/calendar/useCalendarEvents'
import { projectMembers } from '@/lib/filters'
import { DEFAULT_TASK_STATUSES, isProjectClosed, isTaskClosed, taskStatusDef } from '@/lib/workflow'

export function CalendarPage() {
  useDocumentTitle('Calendar')
  useBreadcrumbs([{ label: 'Calendar' }])
  const projects = useAllProjects()
  const tasks = useAllTasks()
  const clients = useClients()
  const users = useUsers()
  const [clientId, setClientId] = useState('')
  const [assignee, setAssignee] = useState('')
  const [status, setStatus] = useState<'open' | 'all' | TaskStatus>('open')
  const [show, setShow] = useState<'both' | 'projects' | 'tasks'>('both')

  const fp = useMemo(
    () =>
      projects.filter(
        (p) => !p.archived && (!clientId || p.clientId === clientId) && (!assignee || projectMembers(p).includes(assignee)) && (status !== 'open' || !isProjectClosed(p.status)),
      ),
    [projects, clientId, assignee, status],
  )
  const ids = useMemo(() => new Set(fp.map((p) => p.id)), [fp])
  const ft = useMemo(
    () =>
      tasks.filter(
        (t) =>
          ids.has(t.projectId) &&
          (!assignee || t.assigneeId === assignee) &&
          (status === 'all' ? true : status === 'open' ? !isTaskClosed(t.status) : t.status === status),
      ),
    [tasks, ids, assignee, status],
  )
  const events = useCalendarEvents(show === 'tasks' ? [] : fp, show === 'projects' ? [] : ft)

  return (
    <div>
      <PageHeader title="Calendar" description="Project deadlines and task due dates from the shared dataset" />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Show" value={show} onChange={setShow} options={[{ value: 'both', label: 'Projects & tasks' }, { value: 'projects', label: 'Projects' }, { value: 'tasks', label: 'Tasks' }]} />
          <Select aria-label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-40">
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-40">
            <option value="">Everyone</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-40">
            <option value="open">Open work</option>
            <option value="all">All statuses</option>
            {DEFAULT_TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>Task: {taskStatusDef(s.id).label}</option>)}
          </Select>
        </div>
        <MonthCalendar events={events} />
      </PageBody>
    </div>
  )
}
