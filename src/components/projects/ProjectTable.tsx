import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Archive, ArrowDown, ArrowUp, ChevronsUpDown, X } from 'lucide-react'
import type { Project, ProjectStatus } from '@/types'
import { useClientMap, useCan, useProjectStatsMap, useUserMap } from '@/hooks/useData'
import { useSession } from '@/services/session'
import { archiveProject, updateProject } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/form'
import { ProgressBar } from '@/components/ui/display'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu'
import { Tooltip } from '@/components/ui/tooltip'
import { ProjectStatusPicker, PriorityPicker } from '@/components/common/pickers'
import { ClientChip, UserChip } from '@/components/common/people'
import { ScheduleBadge, StatusIcon, ProjectTypeLabel } from '@/components/common/badges'
import { projectDueDate, type ProjectStats } from '@/lib/calculations'
import { DEFAULT_PROJECT_STATUSES, priorityDef } from '@/lib/workflow'
import { compareDates, formatShortDate } from '@/lib/dates'
import { cn, formatHours } from '@/lib/utils'
import { paths } from '@/lib/routes'

export const PROJECT_COLUMNS = [
  { id: 'client', label: 'Client' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'owner', label: 'Owner' },
  { id: 'due', label: 'Due date' },
  { id: 'progress', label: 'Progress' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'hours', label: 'Est. hours' },
] as const
export type ProjectColumnId = (typeof PROJECT_COLUMNS)[number]['id']

type SortKey = 'title' | ProjectColumnId
const statusOrder = new Map(DEFAULT_PROJECT_STATUSES.map((s, i) => [s.id, i]))

export function ProjectTable({ projects, hideClient }: { projects: Project[]; hideClient?: boolean }) {
  const navigate = useNavigate()
  const clients = useClientMap()
  const users = useUserMap()
  const stats = useProjectStatsMap(projects)
  const hidden = useSession((s) => s.hiddenProjectColumns)
  const canStatus = useCan('project.changeStatus')
  const canEdit = useCan('project.edit')
  const canArchive = useCan('project.archive')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'due', dir: 1 })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const columns = PROJECT_COLUMNS.filter((c) => !hidden.includes(c.id) && !(hideClient && c.id === 'client'))

  const sorted = useMemo(() => {
    const val = (p: Project, s: ProjectStats) => {
      switch (sort.key) {
        case 'title': return p.title
        case 'client': return clients.get(p.clientId)?.name ?? ''
        case 'type': return p.type
        case 'status': return statusOrder.get(p.status) ?? 0
        case 'priority': return priorityDef(p.priority).rank
        case 'owner': return users.get(p.ownerId)?.name ?? ''
        case 'due': return projectDueDate(p) ?? '9999'
        case 'progress': return s.percentComplete
        case 'tasks': return s.taskCount
        case 'hours': return s.projectedTotalHours ?? s.estimatedHours
      }
    }
    return [...projects].sort((a, b) => {
      const va = val(a, stats.get(a.id)!)
      const vb = val(b, stats.get(b.id)!)
      if (sort.key === 'due') return compareDates(va as string, vb as string) * sort.dir
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir
    })
  }, [projects, sort, stats, clients, users])

  const visibleSelected = sorted.filter((p) => selected.has(p.id))
  const allChecked = sorted.length > 0 && visibleSelected.length === sorted.length

  const bulkStatus = async (status: ProjectStatus) => {
    for (const p of visibleSelected) await updateProject(p.id, { status })
    toast.success(`Updated ${visibleSelected.length} project${visibleSelected.length > 1 ? 's' : ''}`, { description: `Status → ${DEFAULT_PROJECT_STATUSES.find((s) => s.id === status)?.label}` })
    setSelected(new Set())
  }

  const header = (key: SortKey, label: string, className?: string) => (
    <th key={key} scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cn("px-2 py-2 font-medium whitespace-nowrap", className)}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))}
        className="inline-flex items-center gap-1 rounded hover:text-foreground"
      >
        {label}
        {sort.key === key ? sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
      </button>
    </th>
  )

  return (
    <div>
      {visibleSelected.length > 0 && (
        <div className="animate-pop-in mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5" role="region" aria-label="Bulk actions">
          <span className="text-[13px] font-medium">{visibleSelected.length} selected</span>
          <Menu>
            <MenuTrigger asChild>
              <Button size="sm" disabled={!canStatus.allowed} title={canStatus.allowed ? undefined : canStatus.reason}>Change status</Button>
            </MenuTrigger>
            <MenuContent>
              {DEFAULT_PROJECT_STATUSES.map((s) => (
                <MenuItem key={s.id} onSelect={() => void bulkStatus(s.id)}>
                  <StatusIcon status={s.id} kind="project" /> {s.label}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
          <Button
            size="sm"
            variant="ghost"
            disabled={!canArchive.allowed}
            onClick={async () => {
              for (const p of visibleSelected) await archiveProject(p.id, true)
              toast.success(`Archived ${visibleSelected.length} project${visibleSelected.length > 1 ? 's' : ''}`)
              setSelected(new Set())
            }}
          >
            <Archive /> Archive
          </Button>
          {(!canStatus.allowed || !canArchive.allowed) && <span className="text-xs text-muted-foreground">Some bulk actions are restricted for your role.</span>}
          <Button size="icon-sm" variant="ghost" className="ml-auto" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
            <X />
          </Button>
        </div>
      )}
      <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="w-9 py-2 pl-3">
                <Checkbox
                  label="Select all projects"
                  checked={allChecked}
                  indeterminate={visibleSelected.length > 0 && !allChecked}
                  onChange={(c) => setSelected(c ? new Set(sorted.map((p) => p.id)) : new Set())}
                />
              </th>
              {header('title', 'Project', 'pl-1')}
              {columns.map((c) => header(c.id, c.label, c.id === 'hours' || c.id === 'tasks' ? 'text-right' : undefined))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const s = stats.get(p.id)!
              const due = projectDueDate(p)
              return (
                <tr
                  key={p.id}
                  onClick={() => navigate(paths.project(p.id))}
                  className={cn('cursor-pointer border-b border-border last:border-0 hover:bg-surface-2', selected.has(p.id) && 'bg-primary-soft/40', p.archived && 'opacity-60')}
                >
                  <td className="py-2 pl-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      label={`Select ${p.title}`}
                      checked={selected.has(p.id)}
                      onChange={(c) =>
                        setSelected((prev) => {
                          const n = new Set(prev)
                          if (c) n.add(p.id)
                          else n.delete(p.id)
                          return n
                        })
                      }
                    />
                  </td>
                  <td className="max-w-[380px] py-2 pr-2 pl-1">
                    <a href={paths.project(p.id)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(paths.project(p.id)) }} className="block truncate text-[13px] font-medium hover:underline">
                      {p.title}
                    </a>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{p.key}</span>
                      {p.archived && <span>· Archived</span>}
                      {p.tags.slice(0, 2).map((t) => <span key={t}>· {t}</span>)}
                    </span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className={cn('px-2 py-2 whitespace-nowrap', (c.id === 'hours' || c.id === 'tasks') && 'text-right')}>
                      {c.id === 'client' && <ClientChip clientId={p.clientId} />}
                      {c.id === 'type' && <ProjectTypeLabel type={p.type} />}
                      {c.id === 'status' && <ProjectStatusPicker value={p.status} onChange={(st) => { void updateProject(p.id, { status: st }); toast.success(`${p.key} status updated`) }} disabled={!canStatus.allowed} disabledReason={canStatus.reason} />}
                      {c.id === 'priority' && <PriorityPicker value={p.priority} onChange={(pr) => void updateProject(p.id, { priority: pr })} disabled={!canEdit.allowed} disabledReason={canEdit.reason} />}
                      {c.id === 'owner' && <UserChip userId={p.ownerId} />}
                      {c.id === 'due' && (
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] tabular">{formatShortDate(due)}</span>
                          {(s.schedule === 'late' || s.schedule === 'at_risk' || s.schedule === 'completed_late') && <ScheduleBadge health={s.schedule} />}
                        </span>
                      )}
                      {c.id === 'progress' && (
                        <span className="flex w-28 items-center gap-2">
                          <ProgressBar value={s.percentComplete} />
                          <span className="w-8 text-right text-xs text-muted-foreground tabular">{s.percentComplete}%</span>
                        </span>
                      )}
                      {c.id === 'tasks' && (
                        <span className="text-[13px] tabular">
                          {s.doneCount}/{s.taskCount}
                          {s.overdueCount > 0 && <span className="ml-1 text-xs text-tone-red-fg">({s.overdueCount} late)</span>}
                        </span>
                      )}
                      {c.id === 'hours' && (
                        <Tooltip content={`Projected ${formatHours(s.projectedTotalHours)} (manual) · ${formatHours(s.estimatedHours)} from tasks`}>
                          <span className="text-[13px] tabular">{formatHours(s.projectedTotalHours ?? s.estimatedHours)}</span>
                        </Tooltip>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
