import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Bold, ChevronDown, Code, Italic, Link2, Radical, Strikethrough, Underline, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/menu'
import { Tooltip } from '@/components/ui/tooltip'
import { useSession } from '@/services/session'
import { applyColor, colorDef, insertLink, TEXT_COLORS, toggleWrap, type ColorKind, type Selection, type TextColor } from '@/lib/textFormat'
import { cn, isValidUrl } from '@/lib/utils'

type WrapAction = { id: string; label: string; icon: LucideIcon; open: string; close: string; placeholder: string; shortcut: string; match: (e: KeyboardEvent) => boolean }

const mod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey

const WRAPS: WrapAction[] = [
  { id: 'bold', label: 'Bold', icon: Bold, open: '**', close: '**', placeholder: 'bold text', shortcut: 'Ctrl+B', match: (e) => mod(e) && !e.shiftKey && e.key.toLowerCase() === 'b' },
  { id: 'italic', label: 'Italic', icon: Italic, open: '*', close: '*', placeholder: 'italic text', shortcut: 'Ctrl+I', match: (e) => mod(e) && !e.shiftKey && e.key.toLowerCase() === 'i' },
  { id: 'underline', label: 'Underline', icon: Underline, open: '++', close: '++', placeholder: 'underlined text', shortcut: 'Ctrl+U', match: (e) => mod(e) && !e.shiftKey && e.key.toLowerCase() === 'u' },
  { id: 'strike', label: 'Strikethrough', icon: Strikethrough, open: '~~', close: '~~', placeholder: 'struck text', shortcut: 'Ctrl+Shift+X', match: (e) => mod(e) && e.shiftKey && e.key.toLowerCase() === 'x' },
  { id: 'code', label: 'Inline code', icon: Code, open: '`', close: '`', placeholder: 'code', shortcut: 'Ctrl+E', match: (e) => mod(e) && !e.shiftKey && e.key.toLowerCase() === 'e' },
  { id: 'equation', label: 'Equation', icon: Radical, open: '$$', close: '$$', placeholder: 'x^2', shortcut: 'Ctrl+Shift+E', match: (e) => mod(e) && e.shiftKey && e.key.toLowerCase() === 'e' },
]

/**
 * Handles formatting shortcuts in the comment textarea. Returns true when the key was used.
 * Ctrl/⌘+K opens the link popover (and is kept from triggering global search).
 */
export function handleFormatShortcut(e: KeyboardEvent, sel: Selection, apply: (s: Selection) => void, openLink: () => void) {
  const action = WRAPS.find((w) => w.match(e))
  if (action) {
    e.preventDefault()
    apply(toggleWrap(sel, action.open, action.close, action.placeholder))
    return true
  }
  if (mod(e) && !e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    e.stopPropagation()
    openLink()
    return true
  }
  return false
}

function ToolButton({ label, shortcut, onClick, disabled, children }: { label: string; shortcut?: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip content={shortcut ? `${label} · ${shortcut}` : label}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        disabled={disabled}
        // Keep the textarea selection when clicking a toolbar button.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
      >
        {children}
      </Button>
    </Tooltip>
  )
}

function Swatch({ kind, color, onPick }: { kind: ColorKind; color: TextColor | null; onPick: () => void }) {
  const def = color ? colorDef(color) : undefined
  const label = `${def?.label ?? 'Default'} ${kind === 'bg' ? 'background' : 'text'}`
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onPick}
        className={cn(
          'flex size-8 items-center justify-center rounded-md border text-[15px] font-medium transition-shadow hover:ring-2 hover:ring-ring/40',
          kind === 'text' ? 'border-border-strong bg-surface' : 'border-border-strong/70',
          kind === 'text' ? def?.text : (def?.bg ?? 'bg-surface'),
        )}
      >
        {kind === 'text' ? 'A' : ''}
      </button>
    </Tooltip>
  )
}

/** Notion-style colour picker: recently used, text colours, background colours. */
function ColorPicker({ onPick, disabled }: { onPick: (kind: ColorKind, color: TextColor | null) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const recent = useSession((s) => s.recentTextStyles)
  const pick = (kind: ColorKind, color: TextColor | null) => {
    onPick(kind, color)
    setOpen(false)
  }
  const recentParsed = recent
    .map((r) => {
      const [kind, color] = r.split(':') as [ColorKind, TextColor]
      return colorDef(color) ? { kind, color } : null
    })
    .filter((x): x is { kind: ColorKind; color: TextColor } => Boolean(x))
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip content="Text or background colour">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="px-1.5" aria-label="Colour" disabled={disabled} onMouseDown={(e) => e.preventDefault()}>
            <span className="flex size-5 items-center justify-center rounded border border-border-strong text-[12px] font-semibold">A</span>
            <ChevronDown className="!size-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-[228px] p-3" onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
        {recentParsed.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Recently used</p>
            <div className="flex gap-1.5">
              {recentParsed.map((r) => (
                <Swatch key={`${r.kind}:${r.color}`} kind={r.kind} color={r.color} onPick={() => pick(r.kind, r.color)} />
              ))}
            </div>
          </div>
        )}
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Text color</p>
        <div className="mb-3 grid grid-cols-5 gap-1.5">
          <Swatch kind="text" color={null} onPick={() => pick('text', null)} />
          {TEXT_COLORS.map((c) => <Swatch key={c.id} kind="text" color={c.id} onPick={() => pick('text', c.id)} />)}
        </div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Background color</p>
        <div className="grid grid-cols-5 gap-1.5">
          <Swatch kind="bg" color={null} onPick={() => pick('bg', null)} />
          {TEXT_COLORS.map((c) => <Swatch key={c.id} kind="bg" color={c.id} onPick={() => pick('bg', c.id)} />)}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function LinkPopover({ open, onOpenChange, onApply, disabled }: { open: boolean; onOpenChange: (o: boolean) => void; onApply: (url: string) => void; disabled?: boolean }) {
  const [url, setUrl] = useState('https://')
  const [error, setError] = useState('')
  const apply = () => {
    if (!isValidUrl(url.trim())) {
      setError('Enter a full URL starting with https://')
      return
    }
    onApply(url.trim())
    setUrl('https://')
    setError('')
  }
  return (
    <Popover open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setError('') }}>
      <Tooltip content="Link · Ctrl+K">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="px-1.5" aria-label="Link" disabled={disabled} onMouseDown={(e) => e.preventDefault()}>
            <Link2 />
            <ChevronDown className="!size-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-72 p-2.5" onCloseAutoFocus={(e) => e.preventDefault()}>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Link the selected text</p>
        <div className="flex gap-1.5">
          <Input
            autoFocus
            type="url"
            aria-label="Link URL"
            aria-invalid={Boolean(error)}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                apply()
              }
            }}
            className="h-7"
          />
          <Button size="sm" variant="primary" onClick={apply}>Add</Button>
        </div>
        {error && <p className="mt-1 text-[11px] text-tone-red-fg">{error}</p>}
        <p className="mt-1.5 text-[11px] text-subtle-foreground">With nothing selected, the URL itself becomes the link text.</p>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Formatting toolbar for the comment composer. Operates on the textarea selection supplied by
 * `getSelection` and writes the result through `apply`.
 */
export function FormatToolbar({
  getSelection,
  apply,
  linkOpen,
  onLinkOpenChange,
  disabled,
  trailing,
}: {
  getSelection: () => Selection
  apply: (s: Selection) => void
  linkOpen: boolean
  onLinkOpenChange: (open: boolean) => void
  disabled?: boolean
  trailing?: ReactNode
}) {
  const pushRecent = useSession((s) => s.pushRecentTextStyle)
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
      {WRAPS.map((w) => (
        <ToolButton key={w.id} label={w.label} shortcut={w.shortcut} disabled={disabled} onClick={() => apply(toggleWrap(getSelection(), w.open, w.close, w.placeholder))}>
          <w.icon />
        </ToolButton>
      ))}
      <LinkPopover open={linkOpen} onOpenChange={onLinkOpenChange} disabled={disabled} onApply={(url) => { apply(insertLink(getSelection(), url)); onLinkOpenChange(false) }} />
      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
      <ColorPicker
        disabled={disabled}
        onPick={(kind, color) => {
          apply(applyColor(getSelection(), kind, color))
          if (color) pushRecent(`${kind}:${color}`)
        }}
      />
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  )
}
