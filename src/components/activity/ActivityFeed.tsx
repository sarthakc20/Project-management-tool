import { Link } from 'react-router-dom'
import type { ActivityEvent } from '@/types'
import { useDb } from '@/services/store'
import { UserAvatar } from '@/components/common/people'
import { Tooltip } from '@/components/ui/tooltip'
import { ACTIVITY_ICON, describeActivity } from '@/lib/activity'
import { formatDateTime, relativeTime } from '@/lib/dates'
import { paths } from '@/lib/routes'
import { cn } from '@/lib/utils'

/** Compact, consistent rendering of activity events used across dashboard, client and project views. */
export function ActivityItem({ event, showProject, compact }: { event: ActivityEvent; showProject?: boolean; compact?: boolean }) {
  const users = useDb((s) => s.users)
  const tasks = useDb((s) => s.tasks)
  const projects = useDb((s) => s.projects)
  const actor = users.find((u) => u.id === event.actorId)
  const project = event.projectId ? projects.find((p) => p.id === event.projectId) : undefined
  const Icon = ACTIVITY_ICON[event.type]
  const text = describeActivity(event, { users, tasks, projects })
  return (
    <li className={cn('relative flex gap-3', compact ? 'py-1.5' : 'py-2')}>
      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
        <Icon className="size-3" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="inline-flex items-center gap-1 align-middle">
          <UserAvatar user={actor} size="xs" />
        </span>{' '}
        <span className="font-medium">{actor?.name ?? 'System'}</span> <span className="text-muted-foreground">{text}</span>
        {showProject && project && (
          <>
            {' '}
            <span className="text-muted-foreground">on</span>{' '}
            <Link to={paths.project(project.id)} className="font-medium hover:underline">
              {project.key}
            </Link>
          </>
        )}
        <Tooltip content={formatDateTime(event.createdAt)}>
          <span className="ml-1.5 text-xs whitespace-nowrap text-subtle-foreground">{relativeTime(event.createdAt)}</span>
        </Tooltip>
      </div>
    </li>
  )
}

export function ActivityFeed({ events, showProject, compact, empty = 'No activity yet.' }: { events: ActivityEvent[]; showProject?: boolean; compact?: boolean; empty?: string }) {
  if (!events.length) return <p className="py-6 text-center text-[13px] text-muted-foreground">{empty}</p>
  return (
    <ol className="relative before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-border">
      {events.map((e) => (
        <ActivityItem key={e.id} event={e} showProject={showProject} compact={compact} />
      ))}
    </ol>
  )
}
