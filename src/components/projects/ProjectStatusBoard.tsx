import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Columns3, EyeOff, ListChecks } from 'lucide-react'
import type { Project, ProjectStatus, Tone } from '@/types'
import { updateProject } from '@/services/api'
import { useSession } from '@/services/session'
import { useAllTasks, useCan, useClientMap, useProjectStatsMap, useUserMap } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { ProgressBar } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/tooltip'
import { PriorityIcon, ProjectStatusBadge, ScheduleBadge } from '@/components/common/badges'
import { AvatarStack, ClientAvatar, UserAvatar } from '@/components/common/people'
import { StatusColumnSelect } from './StatusColumnSelect'
import { projectDueDate } from '@/lib/calculations'
import { compareDates, dueLabel, formatShortDate } from '@/lib/dates'
import { DEFAULT_PROJECT_STATUSES, isProjectClosed, isTaskClosed, priorityDef, projectStatusDef } from '@/lib/workflow'
import { cn, pluralize } from '@/lib/utils'
import { paths } from '@/lib/routes'

/** Soft column tints (literal classes so Tailwind can generate them). */
const COLUMN_TINT: Record<Tone, string> = {
  gray: 'bg-tone-gray-bg/60 dark:bg-tone-gray-bg/30',
  blue: 'bg-tone-blue-bg/50 dark:bg-tone-blue-bg/30',
  violet: 'bg-tone-violet-bg/50 dark:bg-tone-violet-bg/30',
  amber: 'bg-tone-amber-bg/55 dark:bg-tone-amber-bg/30',
  green: 'bg-tone-green-bg/50 dark:bg-tone-green-bg/30',
  red: 'bg-tone-red-bg/50 dark:bg-tone-red-bg/30',
  orange: 'bg-tone-orange-bg/50 dark:bg-tone-orange-bg/30',
  teal: 'bg-tone-teal-bg/50 dark:bg-tone-teal-bg/30',
  pink: 'bg-tone-pink-bg/50 dark:bg-tone-pink-bg/30',
}

const KNOWN = new Set(DEFAULT_PROJECT_STATUSES.map((s) => s.id))

/**
 * Kanban of projects stacked by Notion status. Which status columns appear is chosen with a
 * chip multi-select and persisted per browser; empty columns can be hidden.
 */
export function ProjectStatusBoard({ projects, showClient = true }: { projects: Project[]; showClient?: boolean }) {
  const selected = useSession((s) => s.boardStatuses).filter((id) => KNOWN.has(id))
  const setSelected = useSession((s) => s.setBoardStatuses)
  const hideEmpty = useSession((s) => s.boardHideEmpty)
  const setHideEmpty = useSession((s) => s.setBoardHideEmpty)
  const can = useCan('project.changeStatus')
  const [over, setOver] = useState<ProjectStatus | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const byStatus = useMemo(() => {
    const m = new Map<ProjectStatus, Project[]>()
    for (const p of projects) m.set(p.status, [...(m.get(p.status) ?? []), p])
    for (const list of m.values()) list.sort((a, b) => priorityDef(a.priority).rank - priorityDef(b.priority).rank || compareDates(projectDueDate(a), projectDueDate(b)))
    return m
  }, [projects])
  const counts = useMemo(() => new Map([...byStatus.entries()].map(([k, v]) => [k, v.length])), [byStatus])

  const columns = DEFAULT_PROJECT_STATUSES.filter((s) => selected.includes(s.id) && (!hideEmpty || (counts.get(s.id) ?? 0) > 0))
  const emptyHidden = hideEmpty ? selected.filter((id) => !counts.get(id)).length : 0
  const notShown = projects.filter((p) => !columns.some((c) => c.id === p.status)).length

  const move = (id: string, status: ProjectStatus) => {
    const p = projects.find((x) => x.id === id)
    if (!p || p.status === status) return
    void updateProject(id, { status })
    toast.success(`${p.key} → ${projectStatusDef(status).label}`)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <div className="flex shrink-0 items-center gap-1.5 pt-2 text-[13px] font-medium text-muted-foreground">
          <Columns3 className="size-4" /> Status columns
        </div>
        <StatusColumnSelect value={selected} onChange={setSelected} counts={counts} />
        <label className="flex shrink-0 items-center gap-1.5 pt-2 text-[13px] text-muted-foreground">
          <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} className="accent-[var(--primary)]" />
          Hide empty columns
        </label>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {pluralize(columns.length, 'column')} of {selected.length} selected
        {emptyHidden > 0 && ` · ${emptyHidden} empty hidden`}
        {notShown > 0 && (
          <span className="text-tone-amber-fg"> · {pluralize(notShown, 'project')} in statuses not shown</span>
        )}
        {can.allowed ? ' · drag cards between columns to change status' : ` · ${can.reason}`}
      </p>

      {columns.length ? (
        <div className="scrollbar-thin flex items-start gap-3 overflow-x-auto pb-3">
          {columns.map((s) => {
            const items = byStatus.get(s.id) ?? []
            return (
              <section
                key={s.id}
                aria-label={`${s.label} column, ${items.length} projects`}
                onDragOver={(e) => {
                  if (!can.allowed) return
                  e.preventDefault()
                  setOver(s.id)
                }}
                onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
                onDrop={(e) => {
                  e.preventDefault()
                  setOver(null)
                  move(e.dataTransfer.getData('text/project'), s.id)
                }}
                className={cn('flex w-[296px] shrink-0 flex-col rounded-2xl p-2 ring-2 ring-transparent transition-shadow', COLUMN_TINT[s.tone], over === s.id && 'ring-ring/60')}
              >
                <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
                  <Tooltip content={s.description}>
                    <span><ProjectStatusBadge status={s.id} className="h-6 rounded-full px-2.5 text-[13px]" /></span>
                  </Tooltip>
                  <span className="text-xs font-medium text-muted-foreground tabular">{items.length}</span>
                </header>
                <div className="flex flex-col gap-2">
                  {items.map((p) => (
                    <BoardCard
                      key={p.id}
                      project={p}
                      showClient={showClient}
                      draggable={can.allowed}
                      dragging={dragging === p.id}
                      onDragStart={() => setDragging(p.id)}
                      onDragEnd={() => setDragging(null)}
                    />
                  ))}
                  {!items.length && (
                    <p className="rounded-xl border border-dashed border-border-strong/70 py-6 text-center text-xs text-muted-foreground">
                      {can.allowed ? 'Drop a project here' : 'No projects'}
                    </p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong py-12 text-center">
          <EyeOff className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No status columns to show</p>
          <p className="text-[13px] text-muted-foreground">
            {selected.length ? 'All selected statuses are empty. Untick “Hide empty columns” or add more statuses.' : 'Add statuses with the column selector above.'}
          </p>
          <button type="button" onClick={() => setSelected(DEFAULT_PROJECT_STATUSES.map((x) => x.id))} className="mt-1 text-[13px] text-primary hover:underline">
            Show all statuses
          </button>
        </div>
      )}
    </div>
  )
}

function BoardCard({
  project,
  showClient,
  draggable,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  project: Project
  showClient: boolean
  draggable: boolean
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const navigate = useNavigate()
  const { open } = useTaskPanel()
  const clients = useClientMap()
  const users = useUserMap()
  const allTasks = useAllTasks()
  const stats = useProjectStatsMap([project]).get(project.id)!
  const client = clients.get(project.clientId)
  const owner = users.get(project.ownerId)
  const due = projectDueDate(project)
  const closed = isProjectClosed(project.status)
  const openTasks = allTasks
    .filter((t) => t.projectId === project.id && !t.parentTaskId && !isTaskClosed(t.status))
    .sort((a, b) => compareDates(a.dueDate, b.dueDate))
  const team = [project.leadId, ...project.developerIds, ...project.designerIds, project.qiOwnerId].filter((id): id is string => Boolean(id) && id !== project.ownerId)
  const go = () => navigate(paths.project(project.id))

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/project', project.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={go}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && go()}
      tabIndex={0}
      aria-label={`${project.key} ${project.title}`}
      className={cn(
        'cursor-pointer rounded-xl border border-border bg-surface p-3 shadow-xs transition-shadow hover:border-border-strong hover:shadow-sm',
        dragging && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-[14px] leading-snug font-semibold">{project.title}</h3>
        <PriorityIcon priority={project.priority} className="mt-0.5 size-3.5 shrink-0" />
      </div>

      <div className="mt-2 space-y-1.5">
        {showClient && client && (
          <p className="flex items-center gap-1.5 text-[13px]">
            <ClientAvatar client={client} size="xs" />
            <span className="truncate underline decoration-border-strong underline-offset-2">{client.name}</span>
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <ProjectStatusBadge status={project.status} />
          <span className="font-mono text-[11px] text-subtle-foreground">{project.key}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px]">
          <UserAvatar user={owner} size="xs" />
          <span className="min-w-0 flex-1 truncate">{owner?.name ?? 'No owner'}</span>
          {team.length > 0 && <AvatarStack userIds={team} size="xs" max={3} />}
        </div>
        {openTasks.length > 0 && (
          <ul className="space-y-0.5">
            {openTasks.slice(0, 2).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    open(t.id)
                  }}
                  className="flex w-full items-start gap-1.5 text-left text-[13px] text-muted-foreground hover:text-foreground"
                >
                  <ListChecks className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-2 underline decoration-border-strong underline-offset-2">{t.title}</span>
                </button>
              </li>
            ))}
            {openTasks.length > 2 && <li className="pl-5 text-xs text-subtle-foreground">+{openTasks.length - 2} more open tasks</li>}
          </ul>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
        {closed ? (
          <span className="flex-1">Completed {formatShortDate(project.completedAt)}</span>
        ) : (
          <span className={cn('flex-1 tabular', stats.schedule === 'late' && 'font-medium text-tone-red-fg')}>{due ? dueLabel(due) : 'No due date'}</span>
        )}
        {stats.taskCount > 0 ? (
          <span className="flex w-24 items-center gap-1.5">
            <ProgressBar value={stats.percentComplete} />
            <span className="tabular">{stats.percentComplete}%</span>
          </span>
        ) : closed ? (
          <ScheduleBadge health={stats.schedule} />
        ) : (
          <span>No tasks yet</span>
        )}
      </div>
    </article>
  )
}
