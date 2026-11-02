import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import type { ISODate, ISODateTime } from '@/types'

/**
 * Single source of "now" for the app. Every date-dependent label (overdue, due today,
 * on-time / late) is derived from this, never hardcoded into records.
 */
export function now() {
  return new Date()
}

export function today() {
  return startOfDay(now())
}

/** Date-only string (YYYY-MM-DD) offset from today. Used by seed data and quick pickers. */
export function dayOffset(days: number): ISODate {
  return format(addDays(today(), days), 'yyyy-MM-dd')
}

/** Timestamp offset from now by days (and optional hour of day). */
export function timestampOffset(days: number, hour = 10, minute = 0): ISODateTime {
  const d = addDays(today(), days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/** Timestamp a number of hours before now (seed data for "recent" events). */
export function hoursAgo(hours: number): ISODateTime {
  return new Date(now().getTime() - hours * 3_600_000).toISOString()
}

export function toISODate(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd')
}

export function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = parseISO(value)
  return isValid(d) ? d : null
}

export function formatDate(value?: string | null, pattern = 'MMM d, yyyy') {
  const d = parseDate(value)
  return d ? format(d, pattern) : '—'
}

export function formatShortDate(value?: string | null) {
  const d = parseDate(value)
  if (!d) return '—'
  return d.getFullYear() === now().getFullYear() ? format(d, 'MMM d') : format(d, 'MMM d, yyyy')
}

export function formatDateTime(value?: string | null) {
  const d = parseDate(value)
  return d ? format(d, "MMM d, yyyy 'at' h:mm a") : '—'
}

/** Hours as a Notion-style duration, e.g. 1.55 → "1h 33min", 0.25 → "15min". */
export function formatDuration(hours: number) {
  const total = Math.max(0, Math.round(hours * 60))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h) return `${m}min`
  return m ? `${h}h ${m}min` : `${h}h`
}

export function relativeTime(value?: string | null) {
  const d = parseDate(value)
  if (!d) return '—'
  const diffMin = (now().getTime() - d.getTime()) / 60000
  if (diffMin < 1 && diffMin > -1) return 'just now'
  return formatDistanceToNowStrict(d, { addSuffix: true })
}

/** Calendar days from today until the date (negative = in the past). */
export function daysUntil(value?: string | null) {
  const d = parseDate(value)
  if (!d) return null
  return differenceInCalendarDays(d, today())
}

export function isToday(value?: string | null) {
  const d = parseDate(value)
  return d ? isSameDay(d, today()) : false
}

/** Human label for a due date relative to today, e.g. "Due today", "3d overdue". */
export function dueLabel(value?: string | null) {
  const n = daysUntil(value)
  if (n === null) return 'No due date'
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  if (n === -1) return '1 day overdue'
  if (n < 0) return `${Math.abs(n)} days overdue`
  if (n < 7) return `Due in ${n} days`
  return `Due ${formatShortDate(value)}`
}

export function compareDates(a?: string | null, b?: string | null) {
  const da = parseDate(a)?.getTime() ?? Number.POSITIVE_INFINITY
  const db = parseDate(b)?.getTime() ?? Number.POSITIVE_INFINITY
  return da - db
}

export function greeting() {
  const h = now().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
