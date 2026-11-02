/**
 * Comment formatting. Comments are stored as plain text with lightweight markers so the data
 * stays portable; the composer toolbar inserts markers and RichText renders them.
 *
 *   **bold**   *italic*   ++underline++   ~~strike~~   `code`   $$equation$$
 *   [label](https://…)   {blue}coloured text{/}   {bg:yellow}highlighted text{/}
 */

export type TextColor = 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'
export type ColorKind = 'text' | 'bg'

/** Notion's palette order. Literal classes so Tailwind generates them; both themes covered. */
export const TEXT_COLORS: { id: TextColor; label: string; text: string; bg: string }[] = [
  { id: 'gray', label: 'Gray', text: 'text-tone-gray-fg', bg: 'bg-tone-gray-bg' },
  { id: 'brown', label: 'Brown', text: 'text-[oklch(0.5_0.07_50)] dark:text-[oklch(0.78_0.07_55)]', bg: 'bg-[oklch(0.94_0.025_55)] dark:bg-[oklch(0.33_0.04_55)]' },
  { id: 'orange', label: 'Orange', text: 'text-tone-orange-fg', bg: 'bg-tone-orange-bg' },
  { id: 'yellow', label: 'Yellow', text: 'text-tone-amber-fg', bg: 'bg-tone-amber-bg' },
  { id: 'green', label: 'Green', text: 'text-tone-green-fg', bg: 'bg-tone-green-bg' },
  { id: 'blue', label: 'Blue', text: 'text-tone-blue-fg', bg: 'bg-tone-blue-bg' },
  { id: 'purple', label: 'Purple', text: 'text-tone-violet-fg', bg: 'bg-tone-violet-bg' },
  { id: 'pink', label: 'Pink', text: 'text-tone-pink-fg', bg: 'bg-tone-pink-bg' },
  { id: 'red', label: 'Red', text: 'text-tone-red-fg', bg: 'bg-tone-red-bg' },
]

export const COLOR_IDS = TEXT_COLORS.map((c) => c.id)
export function colorDef(id: string) {
  return TEXT_COLORS.find((c) => c.id === id)
}

/** A textarea value with its current selection. */
export interface Selection {
  value: string
  start: number
  end: number
}

/**
 * Wraps the selection in markers, or removes them if the selection is already wrapped.
 * With no selection, inserts a placeholder and selects it so the user can type over it.
 */
export function toggleWrap(s: Selection, open: string, close: string, placeholder: string): Selection {
  const { value, start, end } = s
  const before = value.slice(0, start)
  const selected = value.slice(start, end)
  const after = value.slice(end)
  // Don't mistake the inner "*" of **bold** for an italic marker.
  const surrounded =
    before.endsWith(open) && after.startsWith(close) && !(open === '*' && (before.endsWith('**') || after.startsWith('**')))
  if (surrounded)
    return { value: before.slice(0, -open.length) + selected + after.slice(close.length), start: start - open.length, end: end - open.length }
  if (selected.length > open.length + close.length && selected.startsWith(open) && selected.endsWith(close)) {
    const inner = selected.slice(open.length, selected.length - close.length)
    return { value: before + inner + after, start, end: start + inner.length }
  }
  const text = selected || placeholder
  return { value: before + open + text + close + after, start: start + open.length, end: start + open.length + text.length }
}

const COLOR_OPEN = /\{(?:bg:)?[a-z]+\}$/

/** Applies (or with `color` null, removes) a text or background colour around the selection. */
export function applyColor(s: Selection, kind: ColorKind, color: TextColor | null): Selection {
  const { value, start, end } = s
  let before = value.slice(0, start)
  const selected = value.slice(start, end) || (color ? 'text' : '')
  let after = value.slice(end)
  let offset = 0
  // Replace an existing colour wrapper that exactly surrounds the selection.
  const existing = before.match(COLOR_OPEN)
  if (existing && after.startsWith('{/}')) {
    before = before.slice(0, -existing[0].length)
    after = after.slice(3)
    offset = -existing[0].length
  }
  if (!color) return { value: before + selected + after, start: start + offset, end: start + offset + selected.length }
  const open = kind === 'bg' ? `{bg:${color}}` : `{${color}}`
  const newStart = before.length + open.length
  return { value: before + open + selected + '{/}' + after, start: newStart, end: newStart + selected.length }
}

/** Inserts a markdown link using the selection as the label (or the URL when nothing is selected). */
export function insertLink(s: Selection, url: string): Selection {
  const { value, start, end } = s
  const label = value.slice(start, end) || url
  const text = `[${label}](${url})`
  return { value: value.slice(0, start) + text + value.slice(end), start: start + text.length, end: start + text.length }
}
