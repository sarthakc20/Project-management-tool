import { useMemo, useRef, useState } from 'react'
import { AtSign, PackageCheck, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Comment, User } from '@/types'
import { createComment, deleteComment } from '@/services/api'
import { useCan, useCurrentUser, useUsers } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/common/people'
import { RestrictedNotice } from '@/components/common/gate'
import { RichText } from './RichText'
import { FormatToolbar, handleFormatShortcut } from './FormatToolbar'
import type { Selection } from '@/lib/textFormat'
import {
  HANDOFF_SECTIONS,
  HandoffDetails,
  HandoffEditor,
  HandoffEnvironment,
  emptySection,
  finalizeHandoff,
  type HandoffDraft,
  type HandoffErrors,
  type HandoffSection,
} from './Handoff'

/** Branch and theme sit above the comment text; proof and QI steps below it. */
const TOP_SECTIONS: HandoffSection[] = ['git', 'theme']
const BOTTOM_SECTIONS: HandoffSection[] = ['video', 'image', 'qi']
import { formatDateTime, relativeTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { roleDef } from '@/lib/workflow'

export function CommentItem({ comment }: { comment: Comment }) {
  const users = useUsers()
  const me = useCurrentUser()
  const author = users.find((u) => u.id === comment.authorId)
  return (
    <li className="group flex gap-3 py-2.5">
      <UserAvatar user={author} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold">{author?.name ?? 'Former member'}</span>
          {author && <span className="text-[11px] text-subtle-foreground">{roleDef(author.role).label}</span>}
          <Tooltip content={formatDateTime(comment.createdAt)}>
            <span className="text-xs text-subtle-foreground">{relativeTime(comment.createdAt)}</span>
          </Tooltip>
          {comment.authorId === me.id && (
            <button
              type="button"
              onClick={() => {
                void deleteComment(comment.id)
                toast('Comment deleted')
              }}
              className="ml-auto rounded p-1 text-subtle-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-tone-red-fg focus-visible:opacity-100"
              aria-label="Delete comment"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        {comment.handoff && (
          <p className="mt-0.5 inline-flex items-center gap-1 rounded bg-tone-teal-bg px-1.5 py-px text-[11px] font-medium text-tone-teal-fg">
            <PackageCheck className="size-3" /> Dev handoff
          </p>
        )}
        {comment.handoff && <HandoffEnvironment handoff={comment.handoff} className="mt-1.5" />}
        {comment.body && <RichText body={comment.body} users={users} className="mt-2" />}
        {comment.handoff && <HandoffDetails handoff={comment.handoff} className="mt-2.5" />}
      </div>
    </li>
  )
}

/**
 * Comment composer with a simulated @mention picker and optional structured developer handoff
 * (git branch, theme, proof links, QI steps). Mentions create in-app notifications only.
 * TODO(NOTIFICATIONS): Mentions should notify via the server (email/Slack per user preference).
 */
export function CommentComposer({ projectId, taskId, placeholder = 'Write a comment… Use @ to mention a teammate' }: { projectId?: string; taskId?: string; placeholder?: string }) {
  const me = useCurrentUser()
  const users = useUsers()
  const { allowed, reason } = useCan('comment.create')
  const [body, setBody] = useState('')
  const [handoff, setHandoff] = useState<HandoffDraft>({})
  const [errors, setErrors] = useState<HandoffErrors>({})
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(0)
  const ref = useRef<HTMLTextAreaElement>(null)
  // Last known textarea selection, so toolbar popovers can act on it after focus moves away.
  const selRef = useRef({ start: 0, end: 0 })
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [linkOpen, setLinkOpen] = useState(false)

  const suggestions = useMemo(
    () => (mentionQuery === null ? [] : users.filter((u) => u.id !== me.id && u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)),
    [mentionQuery, users, me.id],
  )

  if (!allowed) return <RestrictedNotice>{reason}</RestrictedNotice>

  const openSections = HANDOFF_SECTIONS.filter((s) => handoff[s.id] !== undefined)
  const hasContent = Boolean(body.trim()) || openSections.length > 0

  const openSection = (id: keyof HandoffDraft) => {
    if (handoff[id] !== undefined) return
    setHandoff((h) => ({ ...h, [id]: emptySection(id) }))
  }
  const openAll = () => setHandoff((h) => Object.fromEntries(HANDOFF_SECTIONS.map((s) => [s.id, h[s.id] ?? emptySection(s.id)])) as HandoffDraft)

  const detectMention = (value: string, caret: number) => {
    const before = value.slice(0, caret)
    const m = before.match(/@([\w ]{0,20})$/)
    setMentionQuery(m ? m[1] : null)
    setHighlight(0)
  }

  const insertMention = (u: User) => {
    const el = ref.current
    if (!el) return
    const caret = el.selectionStart
    const before = body.slice(0, caret).replace(/@([\w ]{0,20})$/, `@${u.name} `)
    const next = before + body.slice(caret)
    setBody(next)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(before.length, before.length)
    })
  }

  const rememberSelection = () => {
    const el = ref.current
    if (el) selRef.current = { start: el.selectionStart, end: el.selectionEnd }
  }
  const getSelection = (): Selection => ({ value: body, ...selRef.current })
  const applyFormat = (next: Selection) => {
    setBody(next.value)
    selRef.current = { start: next.start, end: next.end }
    requestAnimationFrame(() => {
      ref.current?.focus()
      ref.current?.setSelectionRange(next.start, next.end)
    })
  }

  const submit = async () => {
    const text = body.trim()
    const result = finalizeHandoff(handoff)
    setErrors(result.errors)
    if (Object.keys(result.errors).length) {
      toast.error('Fix the highlighted handoff fields')
      return
    }
    if (!text && !result.handoff) {
      toast.error('Write a comment or fill in at least one handoff section')
      return
    }
    const mentionIds = users.filter((u) => text.includes(`@${u.name}`)).map((u) => u.id)
    await createComment({ body: text, projectId, taskId, mentionIds, handoff: result.handoff })
    setBody('')
    setHandoff({})
    setMode('write')
    setMentionQuery(null)
    const notes = [
      mentionIds.length ? `notified ${mentionIds.length} mentioned teammate${mentionIds.length > 1 ? 's' : ''}` : '',
      result.handoff?.qiSteps.length ? 'QI owner notified of QI steps' : '',
    ].filter(Boolean)
    toast.success(result.handoff ? 'Handoff posted' : 'Comment added', { description: notes.length ? `${notes.join(' · ')} (in-app only)` : undefined })
  }

  return (
    <div className="flex gap-3">
      <UserAvatar user={me} size="md" tooltip={false} />
      <div className="relative min-w-0 flex-1">
        <div className="rounded-lg border border-input bg-surface shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
          {(handoff.git !== undefined || handoff.theme !== undefined) && (
            <div className="px-2 pt-2">
              <HandoffEditor draft={handoff} onChange={setHandoff} errors={errors} only={TOP_SECTIONS} />
            </div>
          )}
          <FormatToolbar
            getSelection={getSelection}
            apply={applyFormat}
            linkOpen={linkOpen}
            onLinkOpenChange={setLinkOpen}
            disabled={mode === 'preview'}
            trailing={
              <div role="tablist" aria-label="Editor mode" className="flex rounded-md bg-muted p-0.5 text-xs font-medium">
                {(['write', 'preview'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={cn('rounded px-2 py-0.5 capitalize', mode === m ? 'bg-surface text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {m}
                  </button>
                ))}
              </div>
            }
          />
          {mode === 'preview' ? (
            <div className="min-h-[64px] px-3 py-2" aria-label="Comment preview">
              {body.trim() ? <RichText body={body} users={users} /> : <p className="text-[13px] text-subtle-foreground">Nothing to preview yet.</p>}
            </div>
          ) : (
          <textarea
            ref={ref}
            value={body}
            aria-label="Comment"
            placeholder={placeholder}
            rows={openSections.length ? 4 : 2}
            onChange={(e) => {
              setBody(e.target.value)
              detectMention(e.target.value, e.target.selectionStart)
              rememberSelection()
            }}
            onSelect={rememberSelection}
            onKeyDown={(e) => {
              if (suggestions.length) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => (h + 1) % suggestions.length); return }
                if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length); return }
                if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(suggestions[highlight]); return }
                if (e.key === 'Escape') { e.stopPropagation(); setMentionQuery(null); return }
              }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void submit()
                return
              }
              rememberSelection()
              handleFormatShortcut(e, getSelection(), applyFormat, () => setLinkOpen(true))
            }}
            className="block w-full resize-y bg-transparent px-3 py-2 text-[13px] leading-relaxed outline-none placeholder:text-subtle-foreground"
          />
          )}
          {openSections.some((s) => !TOP_SECTIONS.includes(s.id)) && (
            <div className="px-2 pb-2">
              <HandoffEditor draft={handoff} onChange={setHandoff} errors={errors} only={BOTTOM_SECTIONS} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1 border-t border-border px-2 py-1.5">
            <Tooltip content="Mention someone">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Mention someone"
                onClick={() => {
                  setBody((b) => `${b}${b && !b.endsWith(' ') ? ' ' : ''}@`)
                  setMentionQuery('')
                  ref.current?.focus()
                }}
              >
                <AtSign />
              </Button>
            </Tooltip>
            <span className="mx-1 h-4 w-px bg-border" aria-hidden />
            {HANDOFF_SECTIONS.map((s) => {
              const on = handoff[s.id] !== undefined
              return (
                <Tooltip key={s.id} content={on ? `${s.label} added` : `Add ${s.label.toLowerCase()}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={on}
                    onClick={() => openSection(s.id)}
                    className={cn('px-2 text-muted-foreground', on && 'bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft')}
                  >
                    <s.icon />
                    <span className="max-lg:sr-only">{s.label}</span>
                  </Button>
                </Tooltip>
              )
            })}
            {openSections.length < HANDOFF_SECTIONS.length && (
              <Tooltip content="Add branch, theme, proof and QI steps at once">
                <Button variant="ghost" size="sm" onClick={openAll} className="px-2 text-primary">
                  <PackageCheck /> <span className="max-sm:sr-only">Dev handoff</span>
                </Button>
              </Tooltip>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-subtle-foreground max-xl:hidden">Ctrl + Enter to send</span>
              <Button variant="primary" size="sm" disabled={!hasContent} onClick={() => void submit()}>
                <Send /> {openSections.length ? 'Post handoff' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
        {suggestions.length > 0 && (
          <div role="listbox" aria-label="Mention suggestions" className="animate-pop-in absolute bottom-full left-0 z-20 mb-1 w-64 rounded-lg border border-border bg-surface p-1 shadow-md">
            {suggestions.map((u, i) => (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(u)
                }}
                className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px]', i === highlight && 'bg-accent')}
              >
                <UserAvatar user={u} size="xs" tooltip={false} />
                <span className="flex-1 truncate">{u.name}</span>
                <span className="text-[11px] text-subtle-foreground">{roleDef(u.role).short}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
