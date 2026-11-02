import { useMemo, useState, type ReactNode } from 'react'
import { CalendarDays, Check, ChevronDown, Lock, Search, X } from 'lucide-react'
import type { Priority, ProjectStatus, Role, TaskStatus, User } from '@/types'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger, Popover, PopoverContent, PopoverTrigger } from '@/components/ui/menu'
import { Tooltip } from '@/components/ui/tooltip'
import { useUsers } from '@/hooks/useData'
import { cn, includesText } from '@/lib/utils'
import { dayOffset, dueLabel, formatShortDate, daysUntil } from '@/lib/dates'
import { DEFAULT_TASK_STATUSES, PRIORITIES, PROJECT_STATUS_GROUPS, projectStatusDef, roleDef } from '@/lib/workflow'
import { PriorityBadge, ProjectStatusBadge, TaskStatusBadge, StatusIcon, PriorityIcon } from './badges'
import { UserAvatar } from './people'

interface Restrictable {
  disabled?: boolean
  disabledReason?: string
}

function Locked({ reason, children }: { reason?: string; children: ReactNode }) {
  return (
    <Tooltip content={reason ?? 'Not available for your role'}>
      <span className="inline-flex cursor-not-allowed items-center gap-1 opacity-90" tabIndex={0} aria-label={reason}>
        {children}
        <Lock className="size-3 text-subtle-foreground" aria-hidden />
      </span>
    </Tooltip>
  )
}

const triggerCls =
  'group inline-flex items-center gap-1 rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-accent'

// ───────────────────────────── Status ─────────────────────────────

export function TaskStatusPicker({ value, onChange, disabled, disabledReason, align = 'start' }: { value: TaskStatus; onChange: (s: TaskStatus) => void; align?: 'start' | 'end' } & Restrictable) {
  if (disabled) return <Locked reason={disabledReason}><TaskStatusBadge status={value} /></Locked>
  const main = DEFAULT_TASK_STATUSES.filter((s) => !['blocked', 'on_hold', 'cancelled'].includes(s.id))
  const side = DEFAULT_TASK_STATUSES.filter((s) => ['blocked', 'on_hold', 'cancelled'].includes(s.id))
  return (
    <Menu>
      <MenuTrigger className={cn(triggerCls, 'p-0.5')} aria-label={`Status: ${value}. Change status`} onClick={(e) => e.stopPropagation()}>
        <TaskStatusBadge status={value} />
      </MenuTrigger>
      <MenuContent align={align} onClick={(e) => e.stopPropagation()}>
        <MenuLabel>Workflow</MenuLabel>
        {main.map((s) => (
          <MenuItem key={s.id} onSelect={() => onChange(s.id)}>
            <StatusIcon status={s.id} kind="task" />
            {s.label}
            {s.id === value && <Check className="ml-auto" />}
          </MenuItem>
        ))}
        <MenuSeparator />
        {side.map((s) => (
          <MenuItem key={s.id} onSelect={() => onChange(s.id)}>
            <StatusIcon status={s.id} kind="task" />
            {s.label}
            {s.id === value && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

export function ProjectStatusPicker({ value, onChange, disabled, disabledReason, align = 'start' }: { value: ProjectStatus; onChange: (s: ProjectStatus) => void; align?: 'start' | 'end' } & Restrictable) {
  if (disabled) return <Locked reason={disabledReason}><ProjectStatusBadge status={value} /></Locked>
  return (
    <Menu>
      <MenuTrigger className={cn(triggerCls, 'p-0.5')} aria-label="Change project status" onClick={(e) => e.stopPropagation()}>
        <ProjectStatusBadge status={value} />
        <ChevronDown className="size-3 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent align={align} onClick={(e) => e.stopPropagation()} className="w-56">
        {PROJECT_STATUS_GROUPS.map((g, i) => (
          <div key={g.label}>
            {i > 0 && <MenuSeparator />}
            <MenuLabel>{g.label}</MenuLabel>
            {g.statuses.map((id) => (
              <MenuItem key={id} onSelect={() => onChange(id)}>
                <StatusIcon status={id} kind="project" />
                {projectStatusDef(id).label}
                {id === value && <Check className="ml-auto" />}
              </MenuItem>
            ))}
          </div>
        ))}
      </MenuContent>
    </Menu>
  )
}

// ───────────────────────────── Priority ─────────────────────────────

export function PriorityPicker({ value, onChange, disabled, disabledReason, compact }: { value: Priority; onChange: (p: Priority) => void; compact?: boolean } & Restrictable) {
  if (disabled) return <Locked reason={disabledReason}><PriorityBadge priority={value} showLabel={!compact} /></Locked>
  return (
    <Menu>
      <MenuTrigger className={cn(triggerCls, 'px-1 py-0.5')} aria-label="Change priority" onClick={(e) => e.stopPropagation()}>
        <PriorityBadge priority={value} showLabel={!compact} />
      </MenuTrigger>
      <MenuContent onClick={(e) => e.stopPropagation()}>
        {PRIORITIES.map((p) => (
          <MenuItem key={p.id} onSelect={() => onChange(p.id)}>
            <PriorityIcon priority={p.id} />
            {p.label}
            {p.id === value && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

// ───────────────────────────── People ─────────────────────────────

function UserList({
  users,
  selected,
  onToggle,
  allowNone,
  onNone,
}: {
  users: User[]
  selected: string[]
  onToggle: (id: string) => void
  allowNone?: boolean
  onNone?: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = users.filter((u) => includesText([u.name, roleDef(u.role).label], q))
  return (
    <div className="w-64">
      <div className="flex items-center gap-2 border-b border-border px-2.5">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people…"
          aria-label="Search people"
          className="h-9 w-full bg-transparent text-[13px] outline-none placeholder:text-subtle-foreground"
        />
      </div>
      <div className="scrollbar-thin max-h-64 overflow-y-auto p-1">
        {allowNone && (
          <button type="button" onClick={onNone} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-accent">
            <UserAvatar size="xs" tooltip={false} />
            <span className="text-muted-foreground">Unassigned</span>
            {selected.length === 0 && <Check className="ml-auto size-3.5" />}
          </button>
        )}
        {filtered.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onToggle(u.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-accent"
          >
            <UserAvatar user={u} size="xs" tooltip={false} />
            <span className="min-w-0 flex-1 truncate">{u.name}</span>
            <span className="text-[11px] text-subtle-foreground">{roleDef(u.role).short}</span>
            {selected.includes(u.id) && <Check className="size-3.5" />}
          </button>
        ))}
        {!filtered.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matching people</p>}
      </div>
    </div>
  )
}

export function UserPicker({
  value,
  onChange,
  disabled,
  disabledReason,
  roles,
  placeholder = 'Unassigned',
  allowNone = true,
  variant = 'inline',
  id,
}: {
  value?: string
  onChange: (id: string | undefined) => void
  roles?: Role[]
  placeholder?: string
  allowNone?: boolean
  variant?: 'inline' | 'field' | 'avatar'
  id?: string
} & Restrictable) {
  const users = useUsers()
  const [open, setOpen] = useState(false)
  const options = useMemo(() => {
    const active = users.filter((u) => u.active)
    if (!roles) return active
    return [...active].sort((a, b) => Number(roles.includes(b.role)) - Number(roles.includes(a.role)))
  }, [users, roles])
  const current = users.find((u) => u.id === value)
  const display =
    variant === 'avatar' ? (
      <UserAvatar user={current} size="sm" tooltip={false} />
    ) : (
      <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px]">
        <UserAvatar user={current} size="xs" tooltip={false} />
        <span className={cn('truncate', !current && 'text-subtle-foreground')}>{current?.name ?? placeholder}</span>
      </span>
    )
  if (disabled) return <Locked reason={disabledReason}>{display}</Locked>
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        onClick={(e) => e.stopPropagation()}
        aria-label={current ? `Assigned to ${current.name}. Change` : 'Assign'}
        className={cn(
          triggerCls,
          variant === 'field' ? 'h-8 w-full justify-between rounded-md border border-input bg-surface px-2.5 shadow-xs hover:bg-surface hover:border-border-strong' : 'px-1 py-0.5',
          variant === 'avatar' && 'rounded-full p-0',
        )}
      >
        {display}
        {variant === 'field' && <ChevronDown className="size-3.5 text-muted-foreground" />}
      </PopoverTrigger>
      <PopoverContent onClick={(e) => e.stopPropagation()}>
        <UserList
          users={options}
          selected={value ? [value] : []}
          allowNone={allowNone}
          onNone={() => {
            onChange(undefined)
            setOpen(false)
          }}
          onToggle={(id) => {
            onChange(id)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export function MultiUserPicker({
  value,
  onChange,
  disabled,
  disabledReason,
  roles,
  placeholder = 'Add people',
  id,
}: { value: string[]; onChange: (ids: string[]) => void; roles?: Role[]; placeholder?: string; id?: string } & Restrictable) {
  const users = useUsers()
  const options = useMemo(() => {
    const active = users.filter((u) => u.active)
    if (!roles) return active
    return [...active].sort((a, b) => Number(roles.includes(b.role)) - Number(roles.includes(a.role)))
  }, [users, roles])
  const selected = users.filter((u) => value.includes(u.id))
  const display = (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {selected.length ? (
        selected.map((u) => (
          <span key={u.id} className="inline-flex items-center gap-1 rounded-md bg-muted py-0.5 pr-1.5 pl-0.5 text-xs">
            <UserAvatar user={u} size="xs" tooltip={false} />
            {u.name}
          </span>
        ))
      ) : (
        <span className="text-[13px] text-subtle-foreground">{placeholder}</span>
      )}
    </span>
  )
  if (disabled) return <Locked reason={disabledReason}>{display}</Locked>
  return (
    <Popover>
      <PopoverTrigger id={id} className={cn(triggerCls, 'min-h-8 w-full justify-between rounded-md border border-input bg-surface px-1.5 py-1 shadow-xs hover:bg-surface hover:border-border-strong')}>
        {display}
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent>
        <UserList users={options} selected={value} onToggle={(uid) => onChange(value.includes(uid) ? value.filter((x) => x !== uid) : [...value, uid])} />
      </PopoverContent>
    </Popover>
  )
}

// ───────────────────────────── Date ─────────────────────────────

export function DatePicker({
  value,
  onChange,
  disabled,
  disabledReason,
  placeholder = 'Set date',
  showRelative,
  variant = 'inline',
  id,
  closed,
}: {
  value?: string
  onChange: (d: string | undefined) => void
  placeholder?: string
  showRelative?: boolean
  variant?: 'inline' | 'field'
  id?: string
  /** When true the relative "overdue" styling is suppressed (e.g. completed tasks). */
  closed?: boolean
} & Restrictable) {
  const [open, setOpen] = useState(false)
  const n = daysUntil(value)
  const overdue = !closed && n !== null && n < 0
  const label = value ? (showRelative && !closed ? dueLabel(value) : formatShortDate(value)) : placeholder
  const display = (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap tabular', !value && 'text-subtle-foreground', overdue && 'font-medium text-tone-red-fg', !closed && n === 0 && 'font-medium text-tone-amber-fg')}>
      <CalendarDays className="size-3.5 opacity-70" aria-hidden />
      {label}
    </span>
  )
  if (disabled) return <Locked reason={disabledReason}>{display}</Locked>
  const pick = (d?: string) => {
    onChange(d)
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        onClick={(e) => e.stopPropagation()}
        aria-label={value ? `Date ${formatShortDate(value)}. Change` : 'Set date'}
        className={cn(triggerCls, variant === 'field' ? 'h-8 w-full justify-between rounded-md border border-input bg-surface px-2.5 shadow-xs hover:bg-surface hover:border-border-strong' : 'px-1 py-0.5')}
      >
        {display}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="date"
          aria-label="Pick a date"
          value={value ?? ''}
          onChange={(e) => pick(e.target.value || undefined)}
          className="h-8 w-full rounded-md border border-input bg-surface px-2 text-[13px]"
        />
        <div className="mt-2 grid grid-cols-2 gap-1">
          {[
            ['Today', 0],
            ['Tomorrow', 1],
            ['In 3 days', 3],
            ['Next week', 7],
          ].map(([l, d]) => (
            <button key={l} type="button" onClick={() => pick(dayOffset(d as number))} className="rounded-md px-2 py-1 text-left text-xs hover:bg-accent">
              {l}
            </button>
          ))}
        </div>
        {value && (
          <button type="button" onClick={() => pick(undefined)} className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-tone-red-fg hover:bg-tone-red-bg">
            <X className="size-3" /> Clear date
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ───────────────────────────── Number ─────────────────────────────

/** Click-to-edit number used for hours. Commits on blur / Enter, Esc cancels. */
export function InlineNumber({
  value,
  onChange,
  disabled,
  disabledReason,
  suffix = 'h',
  label,
  step = 0.5,
}: { value?: number; onChange: (v: number | undefined) => void; suffix?: string; label: string; step?: number } & Restrictable) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const text = value === undefined || value === null ? '—' : `${value}${suffix}`
  if (disabled) return <Locked reason={disabledReason}><span className="text-[13px] tabular">{text}</span></Locked>
  if (editing)
    return (
      <input
        autoFocus
        type="number"
        min={0}
        step={step}
        aria-label={label}
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          const v = draft === '' ? undefined : Math.max(0, Number(draft))
          if (v !== value && !Number.isNaN(v)) onChange(v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="h-6 w-16 rounded border border-ring bg-surface px-1.5 text-[13px] tabular outline-none"
      />
    )
  return (
    <button
      type="button"
      aria-label={`${label}: ${text}. Edit`}
      onClick={(e) => {
        e.stopPropagation()
        setDraft(value?.toString() ?? '')
        setEditing(true)
      }}
      className={cn('rounded px-1 py-0.5 text-[13px] tabular hover:bg-accent', value === undefined && 'text-subtle-foreground')}
    >
      {text}
    </button>
  )
}
