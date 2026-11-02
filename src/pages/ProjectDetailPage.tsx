import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, FileText, FolderX, History, ListChecks, MessageSquare, Paperclip, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { useClient, useProject, useProjectStats } from '@/hooks/useData'
import { useDocumentTitle, PageBody } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/display'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { ProjectDetails, ProjectProperties } from '@/components/projects/ProjectCard'
import { ProjectTaskCalendar, ProjectWork } from '@/components/projects/ProjectWork'
import { ProjectFiles } from '@/components/projects/ProjectFiles'
import { ProjectActivity } from '@/components/projects/ProjectActivity'
import { cn } from '@/lib/utils'

const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'properties', label: 'Properties', icon: SlidersHorizontal },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'tasks', label: 'Project tasks', icon: ListChecks },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'details', label: 'Project details', icon: FileText },
  { id: 'files', label: 'Files & links', icon: Paperclip },
  { id: 'activity', label: 'Activity history', icon: History },
]

/** Old tab links (`?tab=tasks`) still land on the matching section of the single-page card. */
const TAB_TO_SECTION: Record<string, string> = { tasks: 'tasks', timeline: 'calendar', activity: 'comments', files: 'files', details: 'details' }

const sectionEl = (id: string) => document.getElementById(`section-${id}`)

/**
 * Project card: one scrollable page laid out like the Notion project card — header properties,
 * grouped property sections, comments, task views, calendar and the long-form brief.
 */
export function ProjectDetailPage() {
  const { projectId } = useParams()
  const project = useProject(projectId)
  const client = useClient(project?.clientId)
  const stats = useProjectStats(project)
  const [params] = useSearchParams()
  const commentCount = useDb((s) => s.comments.filter((c) => c.projectId === projectId).length)
  const linkCount = useDb((s) => s.attachments.filter((a) => a.projectId === projectId).length)
  const taskCount = useDb((s) => s.tasks.filter((t) => t.projectId === projectId && !t.parentTaskId).length)
  const active = useActiveSection(Boolean(project))

  useDocumentTitle(project ? `${project.key} ${project.title}` : 'Project not found')
  useBreadcrumbs(
    project && client
      ? [{ label: 'Clients', to: '/clients' }, { label: client.name, to: `/clients/${client.id}` }, { label: project.key }]
      : [{ label: 'Projects', to: '/projects' }, { label: 'Not found' }],
  )

  const tab = params.get('tab')
  useEffect(() => {
    const target = tab && TAB_TO_SECTION[tab]
    if (!target || !project) return
    const id = window.setTimeout(() => sectionEl(target)?.scrollIntoView({ block: 'start' }), 50)
    return () => window.clearTimeout(id)
    // Only on arrival / when a deep link changes the requested section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, projectId])

  if (!project || !stats)
    return (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="It may have been deleted in this session, or the link is incorrect."
        action={<Button asChild><Link to="/projects">Back to all projects</Link></Button>}
        className="py-24"
      />
    )

  const counts: Record<string, number | undefined> = { comments: commentCount, tasks: taskCount, files: linkCount }

  return (
    <div>
      <ProjectHeader project={project} stats={stats} />
      <nav aria-label="Project card sections" className="sticky top-12 z-20 border-b border-border bg-background/95 backdrop-blur">
        <ul className="scrollbar-thin flex gap-1 overflow-x-auto px-4 py-1.5 sm:px-6">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => sectionEl(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                aria-current={active === s.id ? 'true' : undefined}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground',
                  active === s.id && 'bg-accent font-medium text-foreground',
                )}
              >
                <s.icon className="size-3.5" />
                {s.label}
                {counts[s.id] ? <span className="rounded bg-muted px-1 text-[11px] text-muted-foreground tabular">{counts[s.id]}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <PageBody className="space-y-10 pb-16">
        <CardSection id="properties" title="Properties" icon={SlidersHorizontal}>
          <ProjectProperties project={project} stats={stats} />
        </CardSection>
        <CardSection id="comments" title="Comments" icon={MessageSquare} count={commentCount}>
          <ProjectActivity projectId={project.id} mode="comments" />
        </CardSection>
        <CardSection id="tasks" title="Project tasks" icon={ListChecks} count={taskCount}>
          <ProjectWork projectId={project.id} />
        </CardSection>
        <CardSection id="calendar" title="Calendar" icon={CalendarDays}>
          <ProjectTaskCalendar key={project.id} projectId={project.id} />
        </CardSection>
        <CardSection id="details" title="Project details" icon={FileText}>
          <ProjectDetails project={project} />
        </CardSection>
        <CardSection id="files" title="Files & links" icon={Paperclip} count={linkCount}>
          <ProjectFiles projectId={project.id} />
        </CardSection>
        <CardSection id="activity" title="Activity history" icon={History}>
          <ProjectActivity projectId={project.id} mode="updates" />
        </CardSection>
      </PageBody>
    </div>
  )
}

function CardSection({ id, title, icon: Icon, count, children }: { id: string; title: string; icon: LucideIcon; count?: number; children: ReactNode }) {
  return (
    <section id={`section-${id}`} aria-labelledby={`section-${id}-title`} className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-tone-amber-bg/60 px-3 py-2 dark:bg-tone-amber-bg">
        <Icon className="size-4 text-tone-amber-fg" aria-hidden />
        <h2 id={`section-${id}-title`} className="text-[15px] font-semibold">{title}</h2>
        {count ? <span className="text-[13px] text-muted-foreground tabular">{count}</span> : null}
      </div>
      {children}
    </section>
  )
}

/** Highlights the jump-bar item for the section nearest the top of the viewport. */
function useActiveSection(ready: boolean) {
  const [active, setActive] = useState(SECTIONS[0].id)
  useEffect(() => {
    if (!ready) return
    const onScroll = () => {
      let current = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = sectionEl(s.id)
        if (el && el.getBoundingClientRect().top <= 140) current = s.id
      }
      // At the very bottom the last short sections can never reach the top.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = SECTIONS[SECTIONS.length - 1].id
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ready])
  return active
}
