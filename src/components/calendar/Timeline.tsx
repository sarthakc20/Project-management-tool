import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, differenceInCalendarDays, format, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Diamond } from 'lucide-react'
import type { Project, Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/form'
import { Tooltip } from '@/components/ui/tooltip'
import { useAllTasks, useProjectStatsMap } from '@/hooks/useData'
import { useTaskPanel } from '@/hooks/useTaskPanel'
import { ClientAvatar } from '@/components/common/people'
import { useClientMap } from '@/hooks/useData'
import { isTaskOverdue, projectDueDate } from '@/lib/calculations'
import { daysUntil, formatShortDate, parseDate, today } from '@/lib/dates'
import { isProjectClosed, projectStatusDef, taskStatusDef } from '@/lib/workflow'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/routes'

type BarState = 'done' | 'active' | 'blocked' | 'overdue' | 'planned'

const BAR: Record<BarState, string> = {
  done: 'bg-tone-green-dot/70',
  active: 'bg-primary',
  blocked: 'bg-tone-red-dot',
  overdue: 'bg-tone-red-dot/80 bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(255_255_255/0.25)_4px_6px)]',
  planned: 'bg-tone-gray-dot/60',
}
const LEGEND: { state: BarState; label: string }[] = [
  { state: 'active', label: 'Active' },
  { state: 'done', label: 'Completed' },
  { state: 'blocked', label: 'Blocked / on hold' },
  { state: 'overdue', label: 'Overdue' },
  { state: 'planned', label: 'Not started' },
]

function projectState(p: Project): BarState {
  const cat = projectStatusDef(p.status).category
  if (cat === 'done') return 'done'
  if (cat === 'paused') return 'blocked'
  const n = daysUntil(projectDueDate(p))
  if (n !== null && n < 0 && !isProjectClosed(p.status)) return 'overdue'
  return cat === 'todo' ? 'planned' : 'active'
}
function taskState(t: Task): BarState {
  const cat = taskStatusDef(t.status).category
  if (cat === 'done') return 'done'
  if (cat === 'paused') return 'blocked'
  if (isTaskOverdue(t)) return 'overdue'
  return cat === 'todo' ? 'planned' : 'active'
}

/**
 * Gantt-style roadmap. The visible window is fitted to the container width (percentage
 * positioning) so there is no horizontal scrolling; navigate the window instead.
 */
export function Timeline({ projects, defaultExpanded, focusDate }: { projects: Project[]; defaultExpanded?: boolean; focusDate?: string }) {
  const tasks = useAllTasks()
  const clients = useClientMap()
  const stats = useProjectStatsMap(projects)
  const { open } = useTaskPanel()
  const [weeks, setWeeks] = useState<'4' | '8' | '12'>('8')
  const [start, setStart] = useState(() => addDays(startOfWeek(parseDate(focusDate) ?? today(), { weekStartsOn: 1 }), focusDate ? -7 : -14))
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded ? projects.map((p) => p.id) : []))
  const span = Number(weeks) * 7
  const end = addDays(start, span)

  const pos = (date?: string) => {
    const d = parseDate(date)
    if (!d) return null
    return (differenceInCalendarDays(d, start) / span) * 100
  }

  const rows = useMemo(
    () =>
      projects
        .filter((p) => p.startDate || projectDueDate(p))
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '')),
    [projects],
  )

  const weekTicks = Array.from({ length: Number(weeks) + 1 }, (_, i) => addDays(start, i * 7))
  const todayPct = pos(format(today(), 'yyyy-MM-dd'))

  const Bar = ({ from, to, state, label, onClick, href, thin }: { from?: string; to?: string; state: BarState; label: string; onClick?: () => void; href?: string; thin?: boolean }) => {
    const a = pos(from ?? to)
    const b = pos(to ?? from)
    if (a === null || b === null) return null
    const left = Math.max(0, Math.min(a, b))
    const right = Math.min(100, Math.max(a, b) + 100 / span)
    if (right <= 0 || left >= 100) {
      return <span className="absolute inset-y-0 flex items-center text-[11px] text-subtle-foreground" style={a >= 100 ? { right: 4 } : { left: 4 }}>{a >= 100 ? `→ ${formatShortDate(to)}` : `← ${formatShortDate(to)}`}</span>
    }
    const cls = cn('absolute rounded-md transition-opacity hover:opacity-85', thin ? 'top-1/2 h-2 -translate-y-1/2' : 'top-1/2 h-4 -translate-y-1/2', BAR[state])
    const style = { left: `${left}%`, width: `${Math.max(0.8, right - left)}%` }
    const tip = `${label} · ${formatShortDate(from)} → ${formatShortDate(to)}`
    return (
      <Tooltip content={tip}>
        {href ? <Link to={href} className={cls} style={style} aria-label={tip} /> : <button type="button" onClick={onClick} className={cls} style={style} aria-label={tip} />}
      </Tooltip>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-base font-semibold tabular">{format(start, 'MMM d')} – {format(addDays(end, -1), 'MMM d, yyyy')}</h2>
        <Button size="icon-sm" aria-label="Earlier" onClick={() => setStart((s) => addDays(s, -7 * Math.max(1, Number(weeks) / 2)))}><ChevronLeft /></Button>
        <Button size="sm" onClick={() => setStart(addDays(startOfWeek(today(), { weekStartsOn: 1 }), -14))}>Today</Button>
        <Button size="icon-sm" aria-label="Later" onClick={() => setStart((s) => addDays(s, 7 * Math.max(1, Number(weeks) / 2)))}><ChevronRight /></Button>
        <Segmented label="Range" value={weeks} onChange={setWeeks} options={[{ value: '4', label: '4 weeks' }, { value: '8', label: '8 weeks' }, { value: '12', label: '12 weeks' }]} />
        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {LEGEND.map((l) => (
            <span key={l.state} className="inline-flex items-center gap-1.5"><span className={cn('h-2.5 w-4 rounded-sm', BAR[l.state])} />{l.label}</span>
          ))}
          <span className="inline-flex items-center gap-1"><Diamond className="size-3 fill-tone-amber-dot text-tone-amber-dot" /> Due ≤ 7 days</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[150px_1fr] sm:grid-cols-[260px_1fr] border-b border-border text-[11px] text-muted-foreground">
          <div className="px-3 py-1.5 font-medium tracking-wide uppercase">Project</div>
          <div className="relative h-7">
            {weekTicks.slice(0, -1).map((d, i) => (
              <span key={i} className="absolute top-1.5 pl-1 tabular max-sm:[&:nth-child(odd)]:hidden" style={{ left: `${(i * 7 * 100) / span}%` }}>{format(d, 'MMM d')}</span>
            ))}
          </div>
        </div>
        <div className="relative">
          {/* week gridlines + today marker, positioned over the timeline column */}
          <div className="pointer-events-none absolute inset-y-0 right-0 left-[150px] sm:left-[260px]" aria-hidden>
            {weekTicks.map((_, i) => <span key={i} className="absolute inset-y-0 w-px bg-border" style={{ left: `${(i * 7 * 100) / span}%` }} />)}
            {todayPct !== null && todayPct >= 0 && todayPct <= 100 && (
              <span className="absolute inset-y-0 z-10 w-0.5 bg-tone-red-dot" style={{ left: `${todayPct}%` }}>
                <span className="absolute -top-0 left-1 rounded bg-tone-red-dot px-1 text-[10px] font-medium text-white">Today</span>
              </span>
            )}
          </div>
          {rows.length === 0 && <p className="py-10 text-center text-[13px] text-muted-foreground">No scheduled projects match the filters.</p>}
          {rows.map((p) => {
            const due = projectDueDate(p)
            const n = daysUntil(due)
            const isOpen = expanded.has(p.id)
            const projectTasks = tasks.filter((t) => t.projectId === p.id && !t.parentTaskId && (t.startDate || t.dueDate))
            const s = stats.get(p.id)
            return (
              <div key={p.id} className="border-b border-border last:border-0">
                <div className="grid grid-cols-[150px_1fr] sm:grid-cols-[260px_1fr] items-center hover:bg-surface-2/60">
                  <div className="flex min-w-0 items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => { const x = new Set(e); if (x.has(p.id)) x.delete(p.id); else x.add(p.id); return x })}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? 'Hide tasks' : 'Show tasks'}
                      disabled={!projectTasks.length}
                      className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
                    </button>
                    <ClientAvatar client={clients.get(p.clientId)} size="xs" />
                    <Link to={paths.project(p.id)} className="min-w-0">
                      <span className="block truncate text-[13px] font-medium hover:underline">{p.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{p.key} · {s?.percentComplete ?? 0}%</span>
                    </Link>
                  </div>
                  <div className="relative h-11">
                    <Bar from={p.startDate} to={due} state={projectState(p)} label={p.title} href={paths.project(p.id)} />
                    {n !== null && n >= 0 && n <= 7 && !isProjectClosed(p.status) && pos(due) !== null && pos(due)! <= 100 && (
                      <Diamond className="absolute top-1/2 z-10 size-3.5 -translate-x-1/2 -translate-y-1/2 fill-tone-amber-dot text-surface" style={{ left: `${pos(due)! + 100 / span}%` }} aria-label="Upcoming deadline" />
                    )}
                  </div>
                </div>
                {isOpen &&
                  projectTasks.map((t) => (
                    <div key={t.id} className="grid grid-cols-[150px_1fr] sm:grid-cols-[260px_1fr] items-center bg-surface-2/40">
                      <button type="button" onClick={() => open(t.id)} className="min-w-0 truncate py-1 pr-3 pl-12 text-left text-xs text-muted-foreground hover:text-foreground hover:underline">
                        {t.title}
                      </button>
                      <div className="relative h-7">
                        <Bar from={t.startDate ?? t.dueDate} to={t.dueDate ?? t.startDate} state={taskState(t)} label={t.title} onClick={() => open(t.id)} thin />
                      </div>
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
