import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import type { Project, ProjectStatus, User } from '@/types'
import { Tooltip } from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/common/people'
import { StatusIcon } from '@/components/common/badges'
import { DEFAULT_PROJECT_STATUSES, TONE_DOT } from '@/lib/workflow'
import { cn } from '@/lib/utils'

export function MetricTile({
  label,
  value,
  icon: Icon,
  to,
  caption,
  emphasis,
}: {
  label: string
  value: number
  icon: LucideIcon
  to: string
  caption?: string
  emphasis?: 'danger' | 'warning'
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-surface px-3.5 py-3 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon
          className={cn(
            'size-4 text-subtle-foreground',
            emphasis === 'danger' && value > 0 && 'text-tone-red-fg',
            emphasis === 'warning' && value > 0 && 'text-tone-amber-fg',
          )}
          aria-hidden
        />
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular">{value}</p>
      {caption && <p className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</p>}
    </Link>
  )
}

/**
 * Projects by status as one stacked bar with a labelled legend (counts are always shown as
 * text, so status is never conveyed by colour alone).
 */
export function StatusDistribution({ projects }: { projects: Project[] }) {
  const counts = DEFAULT_PROJECT_STATUSES.map((s) => ({ ...s, count: projects.filter((p) => p.status === s.id).length })).filter((s) => s.count > 0)
  const total = projects.length
  if (!total) return <p className="py-6 text-center text-[13px] text-muted-foreground">No projects match the filters.</p>
  return (
    <div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={counts.map((c) => `${c.label}: ${c.count}`).join(', ')}>
        {counts.map((c) => (
          <Tooltip key={c.id} content={`${c.label}: ${c.count} of ${total}`}>
            <Link to={`/projects?status=${c.id}`} className={cn('h-full first:rounded-l-full last:rounded-r-full hover:opacity-80', TONE_DOT[c.tone])} style={{ width: `${(c.count / total) * 100}%` }} aria-label={`${c.label}: ${c.count}`} />
          </Tooltip>
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {counts.map((c) => (
          <li key={c.id}>
            <Link to={`/projects?status=${c.id}`} className="flex items-center gap-2 rounded px-1 py-0.5 text-[13px] hover:bg-accent">
              <StatusIcon status={c.id as ProjectStatus} kind="project" />
              <span className="flex-1 truncate">{c.label}</span>
              <span className="text-muted-foreground tabular">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Open estimated hours per person against weekly capacity. Single series, one axis. */
export function WorkloadBars({ rows }: { rows: { user: User; openHours: number; openTasks: number; overdue: number }[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.openHours, r.user.weeklyCapacityHours)), 1)
  return (
    <ul className="space-y-2.5">
      {rows.map(({ user, openHours, openTasks, overdue }) => {
        const over = openHours > user.weeklyCapacityHours
        return (
          <li key={user.id}>
            <Link to={`?list=open&who=${user.id}`} className="group block rounded-md px-1 py-0.5 hover:bg-accent">
              <div className="flex items-center gap-2 text-[13px]">
                <UserAvatar user={user} size="xs" tooltip={false} />
                <span className="flex-1 truncate">{user.name}</span>
                <span className="text-xs text-muted-foreground tabular">
                  {openTasks} task{openTasks === 1 ? '' : 's'}
                  {overdue > 0 && <span className="text-tone-red-fg"> · {overdue} overdue</span>}
                </span>
              </div>
              <Tooltip content={`${openHours}h open estimate · ${user.weeklyCapacityHours}h weekly capacity`}>
                <div className="relative mt-1 ml-7 h-2 rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', over ? 'bg-tone-orange-dot' : 'bg-primary')}
                    style={{ width: `${Math.min(100, (openHours / max) * 100)}%` }}
                  />
                  <span
                    className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-foreground/50"
                    style={{ left: `${(user.weeklyCapacityHours / max) * 100}%` }}
                    aria-hidden
                  />
                </div>
              </Tooltip>
              <p className="mt-0.5 ml-7 text-[11px] text-subtle-foreground tabular">
                {openHours}h open / {user.weeklyCapacityHours}h capacity{over && ' · over capacity'}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
