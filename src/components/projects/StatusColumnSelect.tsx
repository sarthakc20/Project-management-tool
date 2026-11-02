import { useMemo, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import type { ProjectStatus } from '@/types'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/menu'
import { ProjectStatusBadge } from '@/components/common/badges'
import { DEFAULT_PROJECT_STATUSES, PROJECT_STATUS_GROUPS, isProjectClosed, projectStatusDef } from '@/lib/workflow'
import { cn } from '@/lib/utils'

const ALL = DEFAULT_PROJECT_STATUSES.map((s) => s.id)
const COLLAPSED_CHIPS = 8

/** Keeps a selection in lifecycle order regardless of the order statuses were picked. */
const ordered = (ids: ProjectStatus[]) => ALL.filter((id) => ids.includes(id))

/**
 * Notion-style multi-select: chosen statuses appear as removable chips; the dropdown lists
 * every status by phase with the number of projects currently in it.
 */
export function StatusColumnSelect({
  value,
  onChange,
  counts,
}: {
  value: ProjectStatus[]
  onChange: (next: ProjectStatus[]) => void
  /** Projects per status, shown next to each option. */
  counts: Map<ProjectStatus, number>
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const selected = ordered(value)
  const visibleChips = expanded ? selected : selected.slice(0, COLLAPSED_CHIPS)
  const hiddenChipCount = selected.length - visibleChips.length

  const toggle = (id: ProjectStatus) => onChange(ordered(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]))
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PROJECT_STATUS_GROUPS.map((g) => ({ ...g, statuses: g.statuses.filter((id) => !q || projectStatusDef(id).label.toLowerCase().includes(q)) })).filter((g) => g.statuses.length)
  }, [query])

  const presets: { label: string; ids: ProjectStatus[] }[] = [
    { label: 'All', ids: ALL },
    { label: 'With projects', ids: ALL.filter((id) => (counts.get(id) ?? 0) > 0) },
    { label: 'Open work', ids: ALL.filter((id) => !isProjectClosed(id)) },
    { label: 'None', ids: [] },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex min-h-9 min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-surface px-2 py-1.5 shadow-xs focus-within:border-ring">
          {visibleChips.map((id) => (
            <span key={id} className="inline-flex items-center rounded-md">
              <ProjectStatusBadge status={id} className="rounded-r-none pr-1" />
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-label={`Hide ${projectStatusDef(id).label} column`}
                className="flex h-5 items-center rounded-r-md px-1 opacity-70 hover:opacity-100"
                style={{ backgroundColor: `var(--tone-${projectStatusDef(id).tone}-bg)`, color: `var(--tone-${projectStatusDef(id).tone}-fg)` }}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {hiddenChipCount > 0 && (
            <button type="button" onClick={() => setExpanded(true)} className="h-5 rounded-md bg-muted px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              +{hiddenChipCount} more
            </button>
          )}
          {expanded && selected.length > COLLAPSED_CHIPS && (
            <button type="button" onClick={() => setExpanded(false)} className="h-5 px-1 text-xs text-muted-foreground hover:text-foreground">
              Show less
            </button>
          )}
          {!selected.length && <span className="px-1 text-[13px] text-subtle-foreground">No status columns selected</span>}
          <PopoverTrigger
            className="ml-auto inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Choose status columns"
          >
            <Plus className="size-3.5" /> Status
            <ChevronDown className="size-3" />
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="end" className="w-[min(320px,calc(100vw-2rem))]">
        <div className="flex items-center gap-2 border-b border-border px-2.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search statuses…"
            aria-label="Search statuses"
            className="h-9 w-full bg-transparent text-[13px] outline-none placeholder:text-subtle-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
          {presets.map((p) => (
            <button key={p.label} type="button" onClick={() => onChange(p.ids)} className="rounded-md border border-border px-2 py-0.5 text-xs hover:bg-accent">
              {p.label}
            </button>
          ))}
        </div>
        <div className="scrollbar-thin max-h-[min(420px,60vh)] overflow-y-auto p-1" role="listbox" aria-multiselectable="true" aria-label="Status columns">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">{g.label}</p>
              {g.statuses.map((id) => {
                const on = selected.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => toggle(id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-accent"
                  >
                    <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}>
                      {on && <Check className="size-3" />}
                    </span>
                    <ProjectStatusBadge status={id} />
                    <span className="ml-auto text-xs text-muted-foreground tabular">{counts.get(id) ?? 0}</span>
                  </button>
                )
              })}
            </div>
          ))}
          {!groups.length && <p className="px-2 py-4 text-center text-xs text-muted-foreground">No status matches “{query}”</p>}
        </div>
        <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">{selected.length} of {ALL.length} statuses selected · columns follow the delivery lifecycle order</p>
      </PopoverContent>
    </Popover>
  )
}
