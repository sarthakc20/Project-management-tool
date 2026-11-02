import { SignalHigh, SignalLow, SignalMedium, TriangleAlert } from 'lucide-react'
import type { Priority, ProjectStatus, ProjectType, TaskStatus, TaskType, Tone } from '@/types'
import { Badge } from '@/components/ui/display'
import { cn } from '@/lib/utils'
import { SCHEDULE_META, type ScheduleHealth } from '@/lib/calculations'
import { findMeta, priorityDef, PROJECT_STATUS_ICON, projectStatusDef, projectTypeDef, taskStatusDef, taskTypeDef, TONE_DOT, TONE_TEXT } from '@/lib/workflow'

/** Status shapes are distinct per category so status never relies on colour alone. */
function StatusGlyph({ category, tone }: { category: string; tone: Tone }) {
  const dot = TONE_DOT[tone]
  if (category === 'done')
    return (
      <span className={cn('flex size-3 items-center justify-center rounded-full', dot)} aria-hidden>
        <svg viewBox="0 0 12 12" className="size-2.5 text-surface"><path d="M3 6.2 5 8l4-4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    )
  if (category === 'todo') return <span className={cn('size-3 rounded-full border-[1.5px] border-dashed', TONE_TEXT[tone])} style={{ borderColor: 'currentColor' }} aria-hidden />
  if (category === 'active')
    return (
      <span className="relative size-3 overflow-hidden rounded-full border-[1.5px]" style={{ borderColor: `var(--tone-${tone}-dot)` }} aria-hidden>
        <span className={cn('absolute inset-y-0 left-0 w-1/2', dot)} />
      </span>
    )
  if (category === 'review')
    return (
      <span className="relative size-3 overflow-hidden rounded-full border-[1.5px]" style={{ borderColor: `var(--tone-${tone}-dot)` }} aria-hidden>
        <span className={cn('absolute inset-0 [clip-path:polygon(50%_50%,50%_0,100%_0,100%_100%,0_100%)]', dot)} />
      </span>
    )
  if (category === 'paused')
    return (
      <span className={cn('flex size-3 items-center justify-center rounded-full', dot)} aria-hidden>
        <span className="h-[1.5px] w-1.5 bg-surface" />
      </span>
    )
  return <span className={cn('size-3 rounded-full opacity-60', dot)} aria-hidden />
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const s = taskStatusDef(status)
  return (
    <Badge tone={s.tone} className={cn('gap-1.5', className)}>
      <StatusGlyph category={s.category} tone={s.tone} />
      {s.label}
    </Badge>
  )
}

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const s = projectStatusDef(status)
  const Icon = PROJECT_STATUS_ICON[status]
  return (
    <Badge tone={s.tone} className={cn('gap-1', className)}>
      <Icon className="size-3 shrink-0" aria-hidden />
      {s.label}
    </Badge>
  )
}

export function StatusIcon({ status, kind }: { status: string; kind: 'task' | 'project' }) {
  if (kind === 'project') {
    const s = projectStatusDef(status as ProjectStatus)
    const Icon = PROJECT_STATUS_ICON[s.id]
    return <Icon className={cn('size-3.5 shrink-0', TONE_TEXT[s.tone])} aria-hidden />
  }
  const s = taskStatusDef(status as TaskStatus)
  return <StatusGlyph category={s.category} tone={s.tone} />
}

const PRIORITY_ICON = { urgent: TriangleAlert, high: SignalHigh, medium: SignalMedium, low: SignalLow }

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const p = priorityDef(priority)
  const Icon = PRIORITY_ICON[priority]
  return <Icon className={cn('size-4', TONE_TEXT[p.tone], className)} aria-label={`${p.label} priority`} />
}

export function PriorityBadge({ priority, showLabel = true }: { priority: Priority; showLabel?: boolean }) {
  const p = priorityDef(priority)
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap">
      <PriorityIcon priority={priority} />
      {showLabel && <span className="text-foreground">{p.label}</span>}
    </span>
  )
}

export function ScheduleBadge({ health }: { health: ScheduleHealth }) {
  const m = SCHEDULE_META[health]
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  )
}

export function ProjectTypeLabel({ type, className }: { type: ProjectType; className?: string }) {
  const t = projectTypeDef(type)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-muted-foreground', className)}>
      <t.icon className="size-3.5" aria-hidden />
      {t.label}
    </span>
  )
}

export function TaskTypeLabel({ type, className }: { type: TaskType; className?: string }) {
  const t = taskTypeDef(type)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-muted-foreground', className)}>
      <t.icon className="size-3.5" aria-hidden />
      {t.label}
    </span>
  )
}

export function MetaBadge<T extends { id: string; label: string; tone: Tone }>({ list, id, dot = true }: { list: T[]; id: string; dot?: boolean }) {
  const m = findMeta(list, id)
  return (
    <Badge tone={m.tone} dot={dot}>
      {m.label}
    </Badge>
  )
}
