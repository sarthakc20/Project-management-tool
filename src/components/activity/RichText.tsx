import type { ReactNode } from 'react'
import type { User } from '@/types'
import { cn } from '@/lib/utils'
import { COLOR_IDS, colorDef } from '@/lib/textFormat'

/**
 * Lightweight formatter for comment text. Supports the markers in lib/textFormat.ts (bold, italic,
 * underline, strike, code, equation, links, text/background colour) plus bare URLs, @mentions,
 * "- " / "• " bullets (indent by two spaces to nest), "1. " numbered items, "===" rules and
 * "## " / "### " headings (used by long-form project briefs).
 * Output is built from React nodes only — no HTML injection.
 */

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const COLORS = COLOR_IDS.join('|')

/**
 * Inline markers, in priority order. Groups:
 * 1 bg flag · 2 colour · 3 coloured text · 4 link label · 5 link url · 6 bold · 7 underline ·
 * 8 strike · 9 code · 10 equation · 11 italic · 12 bare url · 13 mention
 */
function inlinePattern(users: User[]) {
  const names = users.map((u) => u.name).sort((a, b) => b.length - a.length).map(escapeRe)
  const mention = names.length ? `|@(${names.join('|')})` : ''
  return new RegExp(
    [
      `\\{(bg:)?(${COLORS})\\}(.+?)\\{\\/\\}`,
      `\\[([^\\]]+)\\]\\((https?:\\/\\/[^)\\s]+)\\)`,
      `\\*\\*(.+?)\\*\\*`,
      `\\+\\+(.+?)\\+\\+`,
      `~~(.+?)~~`,
      '`([^`]+)`',
      `\\$\\$(.+?)\\$\\$`,
      `\\*(?![\\s*])(.+?)(?<![\\s*])\\*`,
      `(https?:\\/\\/[^\\s)]+)`,
    ].join('|') + mention,
    'g',
  )
}

function inline(text: string, users: User[], keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  const nested = (s: string, k: string) => inline(s, users, k)
  for (const m of text.matchAll(inlinePattern(users))) {
    if (m.index! > last) out.push(text.slice(last, m.index))
    const k = `${keyBase}-${i++}`
    if (m[2] !== undefined) {
      const c = colorDef(m[2])!
      out.push(
        <span key={k} className={m[1] ? cn('rounded px-0.5 py-px', c.bg) : c.text}>
          {nested(m[3], k)}
        </span>,
      )
    } else if (m[4] !== undefined)
      out.push(
        <a key={k} href={m[5]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">
          {nested(m[4], k)}
        </a>,
      )
    else if (m[6] !== undefined) out.push(<strong key={k} className="font-semibold">{nested(m[6], k)}</strong>)
    else if (m[7] !== undefined) out.push(<u key={k} className="underline-offset-2">{nested(m[7], k)}</u>)
    else if (m[8] !== undefined) out.push(<s key={k}>{nested(m[8], k)}</s>)
    else if (m[9] !== undefined)
      out.push(
        <code key={k} className="rounded bg-tone-red-bg px-1 py-px font-mono text-[12px] text-tone-red-fg">
          {m[9]}
        </code>,
      )
    else if (m[10] !== undefined)
      // Shown as styled math text; a LaTeX renderer (e.g. KaTeX) can replace this if needed.
      out.push(
        <span key={k} className="rounded bg-muted px-1 font-serif text-[14px] italic" title="Equation">
          {m[10]}
        </span>,
      )
    else if (m[11] !== undefined) out.push(<em key={k}>{nested(m[11], k)}</em>)
    else if (m[12] !== undefined)
      out.push(
        <a key={k} href={m[12]} target="_blank" rel="noreferrer" className="break-all text-muted-foreground underline underline-offset-2 hover:text-foreground">
          {m[12]}
        </a>,
      )
    else if (m[13] !== undefined)
      out.push(
        <span key={k} className="rounded bg-primary-soft px-0.5 font-medium text-primary-soft-foreground">
          @{m[13]}
        </span>,
      )
    last = m.index! + m[0].length
  }
  out.push(text.slice(last))
  return out
}

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'gap' }
  | { kind: 'rule' }
  | { kind: 'h'; level: 2 | 3; text: string }
  | { kind: 'ul'; items: { level: number; text: string }[] }
  | { kind: 'ol'; items: { n: string; text: string }[] }

function parse(body: string): Block[] {
  const blocks: Block[] = []
  for (const raw of body.replace(/\r/g, '').split('\n')) {
    const line = raw.replace(/\s+$/, '')
    const bullet = line.match(/^(\s*)[-•◦*]\s+(.*)$/)
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/)
    const heading = line.match(/^(#{2,3})\s+(.*)$/)
    const prev = blocks[blocks.length - 1]
    if (!line.trim()) {
      if (prev && prev.kind !== 'gap') blocks.push({ kind: 'gap' })
    } else if (/^\s*(={3,}|-{3,})\s*$/.test(line)) {
      blocks.push({ kind: 'rule' })
    } else if (heading) {
      blocks.push({ kind: 'h', level: heading[1].length as 2 | 3, text: heading[2] })
    } else if (bullet) {
      const item = { level: Math.min(2, Math.floor(bullet[1].replace(/\t/g, '  ').length / 2)), text: bullet[2] }
      if (prev?.kind === 'ul') prev.items.push(item)
      else blocks.push({ kind: 'ul', items: [item] })
    } else if (numbered) {
      const item = { n: numbered[1], text: numbered[2] }
      if (prev?.kind === 'ol') prev.items.push(item)
      else blocks.push({ kind: 'ol', items: [item] })
    } else {
      blocks.push({ kind: 'p', text: line })
    }
  }
  while (blocks[blocks.length - 1]?.kind === 'gap') blocks.pop()
  return blocks
}

const MARKERS = ['•', '◦', '▪']

export function RichText({ body, users, className }: { body: string; users: User[]; className?: string }) {
  const blocks = parse(body)
  return (
    <div className={cn('text-[13px] leading-relaxed break-words', className)}>
      {blocks.map((b, i) => {
        const key = `b${i}`
        switch (b.kind) {
          case 'gap':
            return <div key={key} className="h-2.5" aria-hidden />
          case 'rule':
            return <hr key={key} className="my-2 border-border" />
          case 'h':
            return b.level === 2 ? (
              <h3 key={key} className="mt-3 mb-1 text-[15px] font-semibold first:mt-0">{inline(b.text, users, key)}</h3>
            ) : (
              <h4 key={key} className="mt-2 mb-0.5 text-[13px] font-semibold first:mt-0">{inline(b.text, users, key)}</h4>
            )
          case 'p':
            return <p key={key}>{inline(b.text, users, key)}</p>
          case 'ul':
            return (
              <ul key={key} className="space-y-0.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2" style={{ paddingLeft: it.level * 18 }}>
                    <span className="shrink-0 text-muted-foreground" aria-hidden>{MARKERS[it.level]}</span>
                    <span className="min-w-0">{inline(it.text, users, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={key} className="space-y-0.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="w-4 shrink-0 text-right text-muted-foreground tabular">{it.n}.</span>
                    <span className="min-w-0">{inline(it.text, users, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            )
        }
      })}
    </div>
  )
}
