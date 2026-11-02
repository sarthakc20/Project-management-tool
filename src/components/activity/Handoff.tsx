import { useRef, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Copy, ExternalLink, GitBranch, ImageIcon, Paintbrush, Plus, Video, X, type LucideIcon } from 'lucide-react'
import type { CommentHandoff } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { Tooltip } from '@/components/ui/tooltip'
import { cn, isValidUrl } from '@/lib/utils'

// ───────────────────────────── Display ─────────────────────────────

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error('Clipboard unavailable', { description: text })
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <Tooltip content={`Copy ${label.toLowerCase()}`}>
      <button type="button" onClick={() => void copy(value, label)} aria-label={`Copy ${label.toLowerCase()}`} className="rounded p-0.5 text-subtle-foreground hover:bg-accent hover:text-foreground">
        <Copy className="size-3.5" />
      </button>
    </Tooltip>
  )
}

function linkLabel(url: string) {
  try {
    const u = new URL(url)
    const tail = u.pathname.split('/').filter(Boolean).pop()
    return `${u.hostname.replace(/^www\./, '')}${tail ? ` / ${decodeURIComponent(tail)}` : ''}`
  } catch {
    return url
  }
}

function Row({ icon: Icon, label, children, labelClassName }: { icon: LucideIcon; label: string; children: ReactNode; labelClassName?: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[132px_1fr] sm:gap-3">
      <dt className={cn('flex items-center gap-1.5 self-start pt-0.5 text-xs font-medium text-muted-foreground', labelClassName)}>
        <Icon className="size-3.5 shrink-0" aria-hidden /> {label}
      </dt>
      <dd className="min-w-0 text-[13px]">{children}</dd>
    </div>
  )
}

function ProofLinks({ urls, icon: Icon, noun }: { urls: string[]; icon: LucideIcon; noun: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {urls.map((url, i) => (
        <li key={url + i}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title={url}
            className="inline-flex max-w-[280px] items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs hover:border-border-strong hover:bg-accent"
          >
            <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="shrink-0 font-medium whitespace-nowrap">{noun} {i + 1}</span>
            <span className="truncate text-muted-foreground">{linkLabel(url)}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

const panel = 'divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface-2/60'
/** Blue tint sets the branch/theme block apart from comment text and the neutral proof/QI panel. */
const envPanel = 'divide-y divide-tone-blue-dot/20 overflow-hidden rounded-lg border border-tone-blue-dot/30 dark:border-tone-blue-dot/50 bg-tone-blue-bg/60 dark:bg-tone-blue-bg'
const envLabel = 'text-tone-blue-fg'

/** Git branch and theme details — always rendered at the top of the comment, above the text. */
export function HandoffEnvironment({ handoff, className }: { handoff: CommentHandoff; className?: string }) {
  const { gitBranch, theme } = handoff
  if (!gitBranch && !theme) return null
  return (
    <dl className={cn(envPanel, className)} aria-label="Branch and theme">
      {gitBranch && (
        <Row icon={GitBranch} label="Git branch" labelClassName={envLabel}>
          <span className="flex min-w-0 items-center gap-1.5">
            {gitBranch.url ? (
              <a href={gitBranch.url} target="_blank" rel="noreferrer" className="truncate font-mono text-[12px] underline decoration-border-strong underline-offset-2 hover:text-primary">
                {gitBranch.name}
              </a>
            ) : (
              <span className="truncate font-mono text-[12px]">{gitBranch.name}</span>
            )}
            <CopyButton value={gitBranch.name} label="Branch name" />
          </span>
        </Row>
      )}
      {theme && (
        <Row icon={Paintbrush} label="Theme" labelClassName={envLabel}>
          <div className="space-y-0.5">
            <p className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-semibold">{theme.name}</span>
              <CopyButton value={theme.name} label="Theme name" />
            </p>
            {theme.themeId && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                Theme ID <span className="font-mono text-[12px] text-foreground">{theme.themeId}</span>
                <CopyButton value={theme.themeId} label="Theme ID" />
              </p>
            )}
            {theme.previewUrl && (
              <a href={theme.previewUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-primary hover:underline">
                <ExternalLink className="size-3.5 shrink-0" /> <span className="truncate">Open preview</span>
                <span className="truncate text-xs text-muted-foreground">{linkLabel(theme.previewUrl)}</span>
              </a>
            )}
          </div>
        </Row>
      )}
    </dl>
  )
}

/** Proof links and QI steps — rendered below the comment text. */
export function HandoffDetails({ handoff, className }: { handoff: CommentHandoff; className?: string }) {
  const { videoProofs, imageProofs, qiSteps } = handoff
  if (!videoProofs.length && !imageProofs.length && !qiSteps.length) return null
  return (
    <dl className={cn(panel, className)} aria-label="Proof and QI steps">
      {videoProofs.length > 0 && (
        <Row icon={Video} label={`Video proof (${videoProofs.length})`}>
          <ProofLinks urls={videoProofs} icon={Video} noun="Video" />
        </Row>
      )}
      {imageProofs.length > 0 && (
        <Row icon={ImageIcon} label={`Image proof (${imageProofs.length})`}>
          <ProofLinks urls={imageProofs} icon={ImageIcon} noun="Image" />
        </Row>
      )}
      {qiSteps.length > 0 && (
        <Row icon={ClipboardList} label={`QI steps (${qiSteps.length})`}>
          <ol className="space-y-1">
            {qiSteps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-tone-amber-bg text-[11px] font-semibold text-tone-amber-fg tabular">{i + 1}</span>
                <span className="min-w-0 pt-px leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        </Row>
      )}
    </dl>
  )
}

// ───────────────────────────── Editor ─────────────────────────────

/** Draft state; a key being present means that section is open in the composer. */
export interface HandoffDraft {
  git?: { name: string; url: string }
  theme?: { name: string; themeId: string; previewUrl: string }
  video?: string[]
  image?: string[]
  qi?: string[]
}

export type HandoffSection = keyof HandoffDraft

export const HANDOFF_SECTIONS: { id: HandoffSection; label: string; icon: LucideIcon }[] = [
  { id: 'git', label: 'Git branch', icon: GitBranch },
  { id: 'theme', label: 'Theme', icon: Paintbrush },
  { id: 'video', label: 'Video proof', icon: Video },
  { id: 'image', label: 'Image proof', icon: ImageIcon },
  { id: 'qi', label: 'QI steps', icon: ClipboardList },
]

export function emptySection(id: HandoffSection): HandoffDraft[HandoffSection] {
  switch (id) {
    case 'git': return { name: '', url: '' }
    case 'theme': return { name: '', themeId: '', previewUrl: '' }
    default: return ['']
  }
}

export type HandoffErrors = Record<string, string>

/** Validates a draft and converts it to the stored shape (undefined when nothing was entered). */
export function finalizeHandoff(d: HandoffDraft): { handoff?: CommentHandoff; errors: HandoffErrors } {
  const errors: HandoffErrors = {}
  const urls = (list: string[] | undefined, key: string) =>
    (list ?? []).map((u) => u.trim()).filter((u, i) => {
      if (!u) return false
      if (!isValidUrl(u)) errors[`${key}.${i}`] = 'Enter a full URL starting with https://'
      return true
    })
  let gitBranch: CommentHandoff['gitBranch']
  if (d.git && (d.git.name.trim() || d.git.url.trim())) {
    if (!d.git.name.trim()) errors['git.name'] = 'Enter the branch name.'
    if (d.git.url.trim() && !isValidUrl(d.git.url.trim())) errors['git.url'] = 'Enter a full URL starting with https://'
    gitBranch = { name: d.git.name.trim(), url: d.git.url.trim() || undefined }
  }
  let theme: CommentHandoff['theme']
  if (d.theme && (d.theme.name.trim() || d.theme.themeId.trim() || d.theme.previewUrl.trim())) {
    if (!d.theme.name.trim()) errors['theme.name'] = 'Enter the theme name.'
    if (d.theme.themeId.trim() && !/^\d+$/.test(d.theme.themeId.trim())) errors['theme.themeId'] = 'Theme ID is numeric.'
    if (d.theme.previewUrl.trim() && !isValidUrl(d.theme.previewUrl.trim())) errors['theme.previewUrl'] = 'Enter a full URL starting with https://'
    theme = { name: d.theme.name.trim(), themeId: d.theme.themeId.trim() || undefined, previewUrl: d.theme.previewUrl.trim() || undefined }
  }
  const videoProofs = urls(d.video, 'video')
  const imageProofs = urls(d.image, 'image')
  const qiSteps = (d.qi ?? []).map((s) => s.trim()).filter(Boolean)
  const has = gitBranch || theme || videoProofs.length || imageProofs.length || qiSteps.length
  return { handoff: has ? { gitBranch, theme, videoProofs, imageProofs, qiSteps } : undefined, errors }
}

function SectionCard({ icon: Icon, title, onRemove, children, tinted }: { icon: LucideIcon; title: string; onRemove: () => void; children: ReactNode; tinted?: boolean }) {
  return (
    <fieldset className={cn('rounded-lg border p-2.5', tinted ? 'border-tone-blue-dot/30 dark:border-tone-blue-dot/50 bg-tone-blue-bg/60 dark:bg-tone-blue-bg' : 'border-border bg-surface-2/60')}>
      <legend className="sr-only">{title}</legend>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden /> {title}
        <button type="button" onClick={onRemove} aria-label={`Remove ${title}`} className="ml-auto rounded p-0.5 text-subtle-foreground hover:bg-accent hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
      {children}
    </fieldset>
  )
}

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-0.5 text-[11px] text-tone-red-fg">{msg}</p> : null
}

function ListEditor({
  values,
  onChange,
  placeholder,
  errorKey,
  errors,
  addLabel,
  numbered,
  type = 'url',
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder: string
  errorKey: string
  errors: HandoffErrors
  addLabel: string
  numbered?: boolean
  type?: 'url' | 'text'
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const add = () => {
    onChange([...values, ''])
    requestAnimationFrame(() => refs.current[values.length]?.focus())
  }
  return (
    <div className="space-y-1.5">
      {values.map((v, i) => (
        <div key={i}>
          <div className="flex items-center gap-1.5">
            {numbered && <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular">{i + 1}.</span>}
            <Input
              ref={(el) => {
                refs.current[i] = el
              }}
              type={type}
              value={v}
              aria-label={`${placeholder} ${i + 1}`}
              aria-invalid={Boolean(errors[`${errorKey}.${i}`])}
              placeholder={placeholder}
              onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (i === values.length - 1 && v.trim()) add()
                }
              }}
              className="h-7"
            />
            <Button size="icon-xs" variant="ghost" aria-label={`Remove ${placeholder.toLowerCase()} ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))} disabled={values.length === 1 && !v}>
              <X />
            </Button>
          </div>
          <Err msg={errors[`${errorKey}.${i}`]} />
        </div>
      ))}
      <button type="button" onClick={add} className={cn('inline-flex items-center gap-1 text-xs text-primary hover:underline', numbered && 'ml-6')}>
        <Plus className="size-3" /> {addLabel}
      </button>
    </div>
  )
}

/** Composer sections for the structured handoff. */
export function HandoffEditor({ draft, onChange, errors, only }: { draft: HandoffDraft; onChange: (d: HandoffDraft) => void; errors: HandoffErrors; only?: HandoffSection[] }) {
  const show = (id: HandoffSection) => draft[id] !== undefined && (!only || only.includes(id))
  const close = (id: HandoffSection) => {
    const next = { ...draft }
    delete next[id]
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {show('git') && draft.git && (
        <SectionCard tinted icon={GitBranch} title="Git branch" onRemove={() => close('git')}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Input className="h-7 font-mono text-[12px]" aria-label="Branch name" placeholder="Branch name, e.g. 153.15790/Project-…" value={draft.git.name} aria-invalid={Boolean(errors['git.name'])} onChange={(e) => onChange({ ...draft, git: { ...draft.git!, name: e.target.value } })} />
              <Err msg={errors['git.name']} />
            </div>
            <div>
              <Input className="h-7" type="url" aria-label="Branch link" placeholder="Branch link (GitHub URL)" value={draft.git.url} aria-invalid={Boolean(errors['git.url'])} onChange={(e) => onChange({ ...draft, git: { ...draft.git!, url: e.target.value } })} />
              <Err msg={errors['git.url']} />
            </div>
          </div>
        </SectionCard>
      )}
      {show('theme') && draft.theme && (
        <SectionCard tinted icon={Paintbrush} title="Theme details" onRemove={() => close('theme')}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px]">
            <div>
              <Input className="h-7" aria-label="Theme name" placeholder="Theme name" value={draft.theme.name} aria-invalid={Boolean(errors['theme.name'])} onChange={(e) => onChange({ ...draft, theme: { ...draft.theme!, name: e.target.value } })} />
              <Err msg={errors['theme.name']} />
            </div>
            <div>
              <Input className="h-7 font-mono text-[12px]" inputMode="numeric" aria-label="Theme ID" placeholder="Theme ID" value={draft.theme.themeId} aria-invalid={Boolean(errors['theme.themeId'])} onChange={(e) => onChange({ ...draft, theme: { ...draft.theme!, themeId: e.target.value } })} />
              <Err msg={errors['theme.themeId']} />
            </div>
            <div className="sm:col-span-2">
              <Input className="h-7" type="url" aria-label="Preview URL" placeholder="Preview URL (…?preview_theme_id=…)" value={draft.theme.previewUrl} aria-invalid={Boolean(errors['theme.previewUrl'])} onChange={(e) => onChange({ ...draft, theme: { ...draft.theme!, previewUrl: e.target.value } })} />
              <Err msg={errors['theme.previewUrl']} />
            </div>
          </div>
        </SectionCard>
      )}
      {show('video') && draft.video && (
        <SectionCard icon={Video} title="Video proof" onRemove={() => close('video')}>
          <ListEditor values={draft.video} onChange={(v) => onChange({ ...draft, video: v })} placeholder="Video link (Loom, Drive…)" errorKey="video" errors={errors} addLabel="Add another video" />
        </SectionCard>
      )}
      {show('image') && draft.image && (
        <SectionCard icon={ImageIcon} title="Image proof" onRemove={() => close('image')}>
          <ListEditor values={draft.image} onChange={(v) => onChange({ ...draft, image: v })} placeholder="Image / screenshot link" errorKey="image" errors={errors} addLabel="Add another image" />
        </SectionCard>
      )}
      {show('qi') && draft.qi && (
        <SectionCard icon={ClipboardList} title="QI steps" onRemove={() => close('qi')}>
          <ListEditor values={draft.qi} onChange={(v) => onChange({ ...draft, qi: v })} placeholder="Step for the QI team" errorKey="qi" errors={errors} addLabel="Add step" numbered type="text" />
          <p className="mt-1.5 ml-6 text-[11px] text-subtle-foreground">Press Enter to add the next step. The project's QI owner is notified.</p>
        </SectionCard>
      )}
    </div>
  )
}
