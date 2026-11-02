import type { ReactNode } from 'react'
import { Tabs as T } from 'radix-ui'
import type { LucideIcon } from 'lucide-react'
import type { Tone } from '@/types'
import { cn, initials } from '@/lib/utils'
import { TONE_BADGE, TONE_DOT } from '@/lib/workflow'

export function Badge({
  tone = 'gray',
  children,
  className,
  dot,
  icon: Icon,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  dot?: boolean
  icon?: LucideIcon
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap',
        TONE_BADGE[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', TONE_DOT[tone])} aria-hidden />}
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  )
}

export function Avatar({
  name,
  hue,
  size = 'md',
  className,
  square,
}: {
  name: string
  hue: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  square?: boolean
}) {
  const dims = {
    xs: 'size-5 text-[9px]',
    sm: 'size-6 text-[10px]',
    md: 'size-7 text-[11px]',
    lg: 'size-9 text-[13px]',
    xl: 'size-12 text-base',
  }[size]
  return (
    <span
      aria-hidden
      style={{ ['--h' as string]: hue }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold ring-2 ring-surface select-none',
        'bg-[oklch(0.9_0.05_var(--h))] text-[oklch(0.38_0.12_var(--h))] dark:bg-[oklch(0.34_0.07_var(--h))] dark:text-[oklch(0.88_0.07_var(--h))]',
        square ? 'rounded-md' : 'rounded-full',
        dims,
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

export function ProgressBar({ value, className, tone }: { value: number; className?: string; tone?: Tone }) {
  const v = Math.max(0, Math.min(100, value))
  const color = tone ? TONE_DOT[tone] : v === 100 ? 'bg-tone-green-dot' : 'bg-primary'
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-300', color)} style={{ width: `${v}%` }} />
    </div>
  )
}

export function ProgressRing({ value, size = 36 }: { value: number; size?: number }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(v)}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={3.5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={v === 100 ? 'var(--tone-green-dot)' : 'var(--primary)'}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (v / 100) * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.27} fontWeight={600} fill="currentColor">
        {Math.round(v)}
      </text>
    </svg>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-14', className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const Tabs = T.Root

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <T.List className={cn('scrollbar-thin -mb-px flex gap-1 overflow-x-auto border-b border-border', className)}>{children}</T.List>
  )
}

export function TabsTrigger({ value, children, count }: { value: string; children: ReactNode; count?: number }) {
  return (
    <T.Trigger
      value={value}
      className="relative inline-flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary [&_svg]:size-3.5"
    >
      {children}
      {count !== undefined && (
        <span className="rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground tabular">{count}</span>
      )}
    </T.Trigger>
  )
}

export const TabsContent = T.Content

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded border border-border bg-surface-2 px-1.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </kbd>
  )
}

/** Section header used inside pages instead of wrapping every block in a card. */
export function SectionHeader({
  title,
  description,
  action,
  className,
  icon: Icon,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  icon?: LucideIcon
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-border bg-surface', className)}>{children}</div>
}

export function DemoTag({ children = 'Demo data', className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded border border-dashed border-border-strong px-1.5 py-px text-[10px] font-medium tracking-wide text-muted-foreground uppercase', className)}>
      {children}
    </span>
  )
}
