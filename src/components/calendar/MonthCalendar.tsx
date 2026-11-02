import { useMemo, useState } from 'react'
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import type { Tone } from '@/types'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/menu'
import { now, parseDate, toISODate, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { TONE_BADGE, TONE_DOT } from '@/lib/workflow'

export interface CalendarEvent {
  id: string
  date: string
  title: string
  kind: 'project' | 'task'
  tone: Tone
  subtitle?: string
  /** Shown as a strike-through when the work is closed. */
  done?: boolean
  overdue?: boolean
  onOpen: () => void
}

function EventChip({ e }: { e: CalendarEvent }) {
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation()
        e.onOpen()
      }}
      title={`${e.kind === 'project' ? 'Project deadline' : 'Task due'}: ${e.title}${e.subtitle ? ` · ${e.subtitle}` : ''}`}
      className={cn(
        'flex w-full min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight font-medium',
        e.kind === 'project' ? TONE_BADGE[e.tone] : 'border border-border bg-surface hover:bg-accent',
        e.overdue && 'ring-1 ring-tone-red-dot',
        e.done && 'opacity-60',
      )}
    >
      {e.kind === 'project' ? <Flag className="size-2.5 shrink-0" aria-label="Project deadline" /> : <span className={cn('size-1.5 shrink-0 rounded-full', TONE_DOT[e.tone])} aria-hidden />}
      <span className={cn('truncate', e.done && 'line-through')}>{e.title}</span>
    </button>
  )
}

export function MonthCalendar({ events, initialMonth }: { events: CalendarEvent[]; initialMonth?: Date }) {
  const [month, setMonth] = useState(() => startOfMonth(initialMonth ?? now()))
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const d = parseDate(e.date)
      if (!d) continue
      const k = toISODate(d)
      m.set(k, [...(m.get(k) ?? []), e])
    }
    for (const list of m.values()) list.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'project' ? -1 : 1))
    return m
  }, [events])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    const out: Date[] = []
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d)
    return out
  }, [month])

  const todayKey = toISODate(today())
  const monthEvents = days.filter((d) => isSameMonth(d, month)).flatMap((d) => (byDay.get(toISODate(d)) ?? []).map((e) => ({ d, e })))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-base font-semibold tabular" aria-live="polite">{format(month, 'MMMM yyyy')}</h2>
        <Button size="icon-sm" aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))}><ChevronLeft /></Button>
        <Button size="sm" onClick={() => setMonth(startOfMonth(now()))}>Today</Button>
        <Button size="icon-sm" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}><ChevronRight /></Button>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Flag className="size-3" /> Project deadline</span>
          <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-primary" /> Task due</span>
          <span className="inline-flex items-center gap-1"><span className="size-3 rounded ring-1 ring-tone-red-dot" /> Overdue</span>
        </div>
      </div>

      {/* Grid on md+; agenda list on small screens */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <div className="grid grid-cols-7 border-b border-border text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="px-2 py-1.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const key = toISODate(d)
            const list = byDay.get(key) ?? []
            const inMonth = isSameMonth(d, month)
            const shown = list.slice(0, 3)
            return (
              <div key={key} className={cn('min-h-[112px] border-border p-1', i % 7 !== 6 && 'border-r', i < days.length - 7 && 'border-b', !inMonth && 'bg-surface-2/60', (i % 7 >= 5) && inMonth && 'bg-surface-2/30')}>
                <div className="mb-1 flex justify-end">
                  <span className={cn('flex size-6 items-center justify-center rounded-full text-xs tabular', !inMonth && 'text-subtle-foreground', key === todayKey && 'bg-primary font-semibold text-primary-foreground')}>
                    {d.getDate()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {shown.map((e) => <EventChip key={`${e.kind}-${e.id}`} e={e} />)}
                  {list.length > 3 && (
                    <Popover>
                      <PopoverTrigger className="w-full rounded px-1.5 text-left text-[11px] text-muted-foreground hover:bg-accent">+{list.length - 3} more</PopoverTrigger>
                      <PopoverContent className="w-64 p-2">
                        <p className="mb-1.5 text-xs font-medium">{format(d, 'EEEE, MMM d')}</p>
                        <div className="space-y-1">{list.map((e) => <EventChip key={`${e.kind}-${e.id}`} e={e} />)}</div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-1 md:hidden">
        {monthEvents.length ? (
          monthEvents.map(({ d, e }) => (
            <div key={`${e.kind}-${e.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-2 py-1.5">
              <span className="w-12 text-xs text-muted-foreground tabular">{format(d, 'EEE d')}</span>
              <div className="min-w-0 flex-1"><EventChip e={e} /></div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-[13px] text-muted-foreground">Nothing scheduled this month.</p>
        )}
      </div>
    </div>
  )
}
