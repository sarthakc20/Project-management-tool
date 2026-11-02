import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let counter = 0
/**
 * Client-side ID generator for records created in the prototype.
 * TODO(BACKEND): IDs must be issued by the server (UUID/ULID) once records are persisted.
 */
export function uid(prefix: string) {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function firstName(name: string) {
  return name.split(' ')[0]
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatHours(hours: number | undefined | null, empty = '—') {
  if (hours === undefined || hours === null || Number.isNaN(hours)) return empty
  const rounded = Math.round(hours * 10) / 10
  return `${rounded}h`
}

export function formatPercent(value: number | undefined | null, empty = '—') {
  if (value === undefined || value === null || Number.isNaN(value)) return empty
  return `${Math.round(value)}%`
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function sum(values: (number | undefined)[]) {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0)
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K) {
  return items.reduce(
    (acc, item) => {
      const k = key(item)
      ;(acc[k] ??= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export function byId<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>()
  for (const item of items) map.set(item.id, item)
  return map
}

export function includesText(haystack: (string | undefined)[], needle: string) {
  const q = needle.trim().toLowerCase()
  if (!q) return true
  return haystack.some((h) => h?.toLowerCase().includes(q))
}

export function isValidUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Short simulated latency so loading states are visible without slowing the UI. */
export function delay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
