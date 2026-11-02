import { useMemo } from 'react'
import { CalendarDays, ChartGantt, FolderSearch, Kanban, Plus, Table2 } from 'lucide-react'
import { useBreadcrumbs, useUI } from '@/services/ui'
import { useSession, type ProjectView } from '@/services/session'
import { useAllProjects, useAllTasks, useClientMap } from '@/hooks/useData'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/form'
import { EmptyState, Skeleton } from '@/components/ui/display'
import { Gate } from '@/components/common/gate'
import { ProjectTable } from '@/components/projects/ProjectTable'
import { ProjectStatusBoard } from '@/components/projects/ProjectStatusBoard'
import { ProjectFilterBar, useProjectFilterState } from '@/components/projects/ProjectFilters'
import { MonthCalendar } from '@/components/calendar/MonthCalendar'
import { Timeline } from '@/components/calendar/Timeline'
import { useCalendarEvents } from '@/components/calendar/useCalendarEvents'

export const VIEW_OPTIONS: { value: ProjectView; label: string; icon: React.ReactNode }[] = [
  { value: 'table', label: 'Table', icon: <Table2 /> },
  { value: 'board', label: 'Board', icon: <Kanban /> },
  { value: 'calendar', label: 'Calendar', icon: <CalendarDays /> },
  { value: 'timeline', label: 'Timeline', icon: <ChartGantt /> },
]

export function ProjectsPage() {
  useDocumentTitle('All Projects')
  useBreadcrumbs([{ label: 'Projects', to: '/projects' }, { label: 'All Projects' }])
  const loading = useSimulatedLoad('projects')
  const view = useSession((s) => s.projectView)
  const setView = useSession((s) => s.setProjectView)
  const openCreate = useUI((s) => s.openCreateProject)
  const all = useAllProjects()
  const tasks = useAllTasks()
  const clients = useClientMap()
  const filter = useProjectFilterState()
  const projects = useMemo(() => filter.apply(all, (id) => clients.get(id)?.name), [all, clients, filter])
  const ids = useMemo(() => new Set(projects.map((p) => p.id)), [projects])
  const events = useCalendarEvents(projects, view === 'calendar' ? tasks.filter((t) => ids.has(t.projectId) && !t.parentTaskId) : [])

  return (
    <div>
      <PageHeader
        title="All Projects"
        description={`${projects.length} of ${all.filter((p) => !p.archived).length} projects`}
        actions={
          <>
            <Segmented label="View" value={view} onChange={setView} options={VIEW_OPTIONS} />
            <Gate permission="project.create" mode="hide">
              <Button variant="primary" onClick={() => openCreate({ clientId: filter.f.client || undefined })}>
                <Plus /> New project
              </Button>
            </Gate>
          </>
        }
        className="pb-4"
      />
      <PageBody className="space-y-4">
        <ProjectFilterBar state={filter} showColumns={view === 'table'} />
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
        ) : !projects.length ? (
          <EmptyState icon={FolderSearch} title="No projects match these filters" description="Try clearing filters or choosing a different saved view." action={<Button onClick={filter.clear}>Clear filters</Button>} />
        ) : view === 'table' ? (
          <ProjectTable projects={projects} />
        ) : view === 'board' ? (
          <ProjectStatusBoard projects={projects} />
        ) : view === 'calendar' ? (
          <MonthCalendar events={events} />
        ) : (
          <Timeline projects={projects} />
        )}
      </PageBody>
    </div>
  )
}
