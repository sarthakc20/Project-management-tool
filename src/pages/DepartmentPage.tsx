import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { EmptyState, SectionHeader } from '@/components/ui/display'
import { AvatarStack } from '@/components/common/people'
import { ProjectTable } from '@/components/projects/ProjectTable'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'
import { isProjectActive } from '@/lib/calculations'
import { DEPARTMENTS, isTaskClosed, projectTypeDef, taskTypeDef } from '@/lib/workflow'
import { Button } from '@/components/ui/button'

/**
 * Shared department view: same project table and task explorer as elsewhere, with a fixed
 * department filter (Development, Design, Account Management).
 */
export function DepartmentPage() {
  const { department: slug } = useParams()
  const dept = DEPARTMENTS.find((d) => d.slug === slug)
  const { projects, tasks, users } = useDb()
  useDocumentTitle(dept?.label ?? 'Department')
  useBreadcrumbs([{ label: 'Departments' }, { label: dept?.label ?? 'Unknown' }])

  const deptProjects = useMemo(() => projects.filter((p) => dept && isProjectActive(p) && projectTypeDef(p.type).department === dept.id), [projects, dept])
  if (!dept) return <EmptyState icon={Compass} title="Unknown department" action={<Button asChild><Link to="/">Go to overview</Link></Button>} className="py-24" />

  const members = users.filter((u) => u.department === dept.id)
  const deptTasks = tasks.filter((t) => taskTypeDef(t.type).department === dept.id && !isTaskClosed(t.status))
  const hours = deptTasks.reduce((a, t) => a + Math.max(0, (t.estimatedHours ?? 0) - (t.actualHours ?? 0)), 0)

  return (
    <div>
      <PageHeader
        title={dept.label}
        description={`${deptTasks.length} open ${dept.label.toLowerCase()} tasks · ~${Math.round(hours)}h remaining estimate`}
        actions={<AvatarStack userIds={members.map((m) => m.id)} max={6} />}
      />
      <PageBody className="space-y-8">
        <section>
          <SectionHeader title="Active projects" description={`Projects whose type belongs to ${dept.label}`} />
          {deptProjects.length ? <ProjectTable projects={deptProjects} /> : <p className="rounded-xl border border-dashed border-border p-4 text-[13px] text-muted-foreground">No active {dept.label.toLowerCase()} projects. Department tasks inside other projects are listed below.</p>}
        </section>
        <section>
          <SectionHeader title="Department tasks" description="Tasks of this department's types across all projects" />
          <TaskExplorer fixedDepartment={dept.id} />
        </section>
      </PageBody>
    </div>
  )
}
