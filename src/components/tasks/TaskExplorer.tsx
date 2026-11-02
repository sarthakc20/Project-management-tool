import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Kanban, ListChecks, ListFilter, Search, Table2, X } from 'lucide-react'
import type { Department, TaskStatus } from '@/types'
import { useSession } from '@/services/session'
import { useAllProjects, useAllTasks, useClients, useUsers } from '@/hooks/useData'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { Button } from '@/components/ui/button'
import { EmptyState, Skeleton } from '@/components/ui/display'
import { Input, Segmented, Select } from '@/components/ui/form'
import { Menu, MenuCheckboxItem, MenuContent, MenuTrigger } from '@/components/ui/menu'
import { StatusIcon } from '@/components/common/badges'
import { TaskTable, ALL_TASK_COLUMNS, type TaskColumn } from '@/components/tasks/TaskTable'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { matchTask } from '@/lib/filters'
import { byId, pluralize } from '@/lib/utils'
import { compareDates } from '@/lib/dates'
import { DEFAULT_TASK_STATUSES, DEPARTMENTS, PRIORITIES, priorityDef } from '@/lib/workflow'

/** Filterable task list (table / board) used by the department pages. Filters live in the URL. */
export function TaskExplorer({ fixedDepartment, columns = ALL_TASK_COLUMNS }: { fixedDepartment?: Department; columns?: TaskColumn[] }) {
  const loading = useSimulatedLoad(`tasks-${fixedDepartment ?? 'all'}`)
  const [params, setParams] = useSearchParams()
  const tasks = useAllTasks()
  const projects = useAllProjects()
  const clients = useClients()
  const users = useUsers()
  const view = useSession((s) => s.taskView)
  const setView = useSession((s) => s.setTaskView)

  const get = (k: string) => params.get(k) ?? ''
  const set = (k: string, v: string) =>
    setParams((p) => {
      const n = new URLSearchParams(p)
      if (v) n.set(k, v)
      else n.delete(k)
      return n
    }, { replace: true })
  const status = get('status').split(',').filter(Boolean) as TaskStatus[]
  const sort = get('sort') || 'due'
  const closed = get('closed') === '1'

  const projectMap = useMemo(() => byId(projects), [projects])
  const filtered = useMemo(() => {
    const list = tasks.filter((t) =>
      matchTask(
        t,
        {
          search: get('q'),
          clientId: get('client') || undefined,
          projectId: get('project') || undefined,
          assigneeId: get('assignee') || undefined,
          department: fixedDepartment ?? ((get('department') || undefined) as Department | undefined),
          status: status.length ? status : undefined,
          priority: get('priority') ? [get('priority') as never] : undefined,
          due: (get('due') || 'any') as 'any',
          includeClosed: closed || status.length > 0 || get('due') === 'any' ? undefined : false,
        },
        projectMap,
      ),
    )
    return list.sort((a, b) =>
      sort === 'priority'
        ? priorityDef(a.priority).rank - priorityDef(b.priority).rank
        : sort === 'updated'
          ? b.updatedAt.localeCompare(a.updatedAt)
          : compareDates(a.dueDate, b.dueDate),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, projectMap, params, fixedDepartment])

  const activeFilters = ['q', 'client', 'project', 'assignee', 'department', 'status', 'priority', 'due', 'closed'].filter((k) => params.get(k)).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search tasks" placeholder="Search tasks…" value={get('q')} onChange={(e) => set('q', e.target.value)} className="pl-8" />
        </div>
        <Select aria-label="Client" value={get('client')} onChange={(e) => set('client', e.target.value)} className="w-36">
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label="Project" value={get('project')} onChange={(e) => set('project', e.target.value)} className="w-44">
          <option value="">All projects</option>
          {projects.filter((p) => !p.archived && (!get('client') || p.clientId === get('client'))).map((p) => <option key={p.id} value={p.id}>{p.key} · {p.title.slice(0, 40)}</option>)}
        </Select>
        <Select aria-label="Assignee" value={get('assignee')} onChange={(e) => set('assignee', e.target.value)} className="w-40">
          <option value="">Any assignee</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        {!fixedDepartment && (
          <Select aria-label="Department" value={get('department')} onChange={(e) => set('department', e.target.value)} className="w-40">
            <option value="">All departments</option>
            {DEPARTMENTS.filter((d) => d.id !== 'operations').map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </Select>
        )}
        <Menu>
          <MenuTrigger asChild>
            <Button aria-label="Filter by status"><ListFilter /> Status{status.length ? ` · ${status.length}` : ''}</Button>
          </MenuTrigger>
          <MenuContent>
            {DEFAULT_TASK_STATUSES.map((s) => (
              <MenuCheckboxItem key={s.id} checked={status.includes(s.id)} onSelect={(e) => e.preventDefault()} onCheckedChange={(c) => set('status', (c ? [...status, s.id] : status.filter((x) => x !== s.id)).join(','))}>
                <StatusIcon status={s.id} kind="task" /> {s.label}
              </MenuCheckboxItem>
            ))}
          </MenuContent>
        </Menu>
        <Select aria-label="Priority" value={get('priority')} onChange={(e) => set('priority', e.target.value)} className="w-32">
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </Select>
        <Select aria-label="Due date" value={get('due')} onChange={(e) => set('due', e.target.value)} className="w-36">
          <option value="">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Next 7 days</option>
          <option value="none">No due date</option>
        </Select>
        <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <input type="checkbox" checked={closed} onChange={(e) => set('closed', e.target.checked ? '1' : '')} className="accent-[var(--primary)]" /> Include done
        </label>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })}><X /> Clear {activeFilters}</Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {view === 'table' && (
            <Select aria-label="Sort" value={sort} onChange={(e) => set('sort', e.target.value === 'due' ? '' : e.target.value)} className="w-40">
              <option value="due">Sort: Due date</option>
              <option value="priority">Sort: Priority</option>
              <option value="updated">Sort: Recently updated</option>
            </Select>
          )}
          <Segmented label="View" value={view} onChange={setView} options={[{ value: 'table', label: 'Table', icon: <Table2 /> }, { value: 'board', label: 'Board', icon: <Kanban /> }]} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{pluralize(filtered.length, 'task')} · subtasks are listed individually</p>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : view === 'table' ? (
        <TaskTable
          tasks={filtered}
          nested={false}
          columns={columns}
          emptyState={<EmptyState icon={ListChecks} title="No tasks match these filters" action={<Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>} />}
        />
      ) : (
        <TaskBoard tasks={filtered} />
      )}
    </div>
  )
}
