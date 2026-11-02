import { useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink, FileUp, Globe, GitPullRequest, Image, Link2, Paperclip, PenTool, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import type { Attachment, AttachmentKind } from '@/types'
import { createAttachment, deleteAttachment, updateAttachment } from '@/services/api'
import { useDb } from '@/services/store'
import { useCan, useUserMap } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/display'
import { Field, Input, Select } from '@/components/ui/form'
import { FormDialog } from '@/components/forms/FormDialog'
import { ConfirmDialog } from '@/components/common/confirm'
import { RestrictedNotice } from '@/components/common/gate'
import { relativeTime } from '@/lib/dates'
import { formatFileSize, isValidUrl } from '@/lib/utils'

export const ATTACHMENT_KINDS: { id: AttachmentKind; label: string; icon: LucideIcon }[] = [
  { id: 'figma', label: 'Figma', icon: PenTool },
  { id: 'github', label: 'GitHub / pull request', icon: GitPullRequest },
  { id: 'client_portal', label: 'Client portal', icon: Globe },
  { id: 'design_reference', label: 'Design reference', icon: Image },
  { id: 'link', label: 'Other link', icon: Link2 },
  { id: 'file', label: 'File (placeholder)', icon: Paperclip },
]


/**
 * Links and file placeholders for a project.
 * TODO(FILE-STORAGE): Connect secure file uploads and downloads to the approved storage provider.
 * Real uploads need signed upload URLs, size/type limits, malware scanning and per-project
 * access control; downloads should use short-lived signed URLs.
 */
export function ProjectFiles({ projectId }: { projectId: string }) {
  const all = useDb((s) => s.attachments)
  const users = useUserMap()
  const can = useCan('link.manage')
  const items = all.filter((a) => a.projectId === projectId)
  const [editing, setEditing] = useState<Attachment | 'new' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState<Attachment | null>(null)

  const groups = ATTACHMENT_KINDS.map((k) => ({ ...k, items: items.filter((i) => i.kind === k.id) })).filter((g) => g.items.length)

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[13px] text-muted-foreground">{items.length} links & files</p>
        {can.allowed && (
          <>
            <Button onClick={() => setUploading(true)}><FileUp /> Add file placeholder</Button>
            <Button variant="primary" onClick={() => setEditing('new')}><Plus /> Add link</Button>
          </>
        )}
      </div>
      {!can.allowed && <div className="mb-4"><RestrictedNotice>{can.reason}</RestrictedNotice></div>}

      {groups.length ? (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.id} aria-label={g.label}>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <g.icon className="size-3.5" /> {g.label}
              </h3>
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                {g.items.map((a) => (
                  <li key={a.id} className="group flex items-center gap-3 px-3 py-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><g.icon className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-[13px] font-medium hover:underline">
                          <span className="truncate">{a.title}</span> <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                        </a>
                      ) : (
                        <span className="text-[13px] font-medium">{a.title}</span>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {a.kind === 'file' ? `${a.fileName} · ${formatFileSize(a.fileSizeBytes)} · not stored (prototype)` : a.url} · {users.get(a.addedById)?.name ?? 'Unknown'} · {relativeTime(a.createdAt)}
                      </p>
                    </div>
                    {can.allowed && (
                      <div className="flex gap-1 opacity-70 group-hover:opacity-100">
                        {a.kind !== 'file' && <Button size="icon-sm" variant="ghost" aria-label={`Edit ${a.title}`} onClick={() => setEditing(a)}><Pencil /></Button>}
                        <Button size="icon-sm" variant="destructive-ghost" aria-label={`Remove ${a.title}`} onClick={() => setRemoving(a)}><Trash2 /></Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon={Link2} title="No links or files yet" description="Add Figma files, pull requests, client portal pages and design references so the team has one place to find them." action={can.allowed && <Button variant="primary" onClick={() => setEditing('new')}><Plus /> Add link</Button>} />
      )}

      {editing && <LinkForm projectId={projectId} existing={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {uploading && <FilePlaceholderForm projectId={projectId} onClose={() => setUploading(false)} />}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove this item?"
        description={removing ? `“${removing.title}” will be removed from the project.` : ''}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removing) void deleteAttachment(removing.id)
          toast.success('Removed')
        }}
      />
    </div>
  )
}

function LinkForm({ projectId, existing, onClose }: { projectId: string; existing?: Attachment; onClose: () => void }) {
  const initial = { kind: existing?.kind ?? ('figma' as AttachmentKind), title: existing?.title ?? '', url: existing?.url ?? '' }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  return (
    <FormDialog
      open
      onClose={onClose}
      title={existing ? 'Edit link' : 'Add link'}
      dirty={JSON.stringify(form) !== JSON.stringify(initial)}
      size="md"
      submitLabel={existing ? 'Save' : 'Add link'}
      onSubmit={() => {
        const e: Record<string, string> = {}
        if (!form.title.trim()) e.title = 'Enter a title.'
        if (!isValidUrl(form.url.trim())) e.url = 'Enter a full URL starting with https://'
        setErrors(e)
        if (Object.keys(e).length) return
        if (existing) void updateAttachment(existing.id, { kind: form.kind, title: form.title.trim(), url: form.url.trim() })
        else void createAttachment({ projectId, kind: form.kind, title: form.title.trim(), url: form.url.trim() })
        toast.success(existing ? 'Link updated' : 'Link added')
        onClose()
      }}
    >
      <div className="space-y-3">
        <Field label="Type">
          {(p) => (
            <Select {...p} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as AttachmentKind })}>
              {ATTACHMENT_KINDS.filter((k) => k.id !== 'file').map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Title" required error={errors.title}>
          {(p) => <Input {...p} autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. PR #418 — Cart drawer" />}
        </Field>
        <Field label="URL" required error={errors.url}>
          {(p) => <Input {...p} type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />}
        </Field>
      </div>
    </FormDialog>
  )
}

function FilePlaceholderForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  return (
    <FormDialog
      open
      onClose={onClose}
      title="Add file placeholder"
      description="Files are not uploaded in this prototype. Only the file name and size are recorded."
      dirty={Boolean(file || title)}
      size="md"
      submitLabel="Add placeholder"
      onSubmit={() => {
        if (!file) {
          setError('Choose a file.')
          return
        }
        // TODO(FILE-STORAGE): Upload `file` to storage via a signed URL and save the returned object key.
        void createAttachment({ projectId, kind: 'file', title: title.trim() || file.name, fileName: file.name, fileSizeBytes: file.size })
        toast.success('File placeholder added', { description: 'The file itself was not uploaded (prototype).' })
        onClose()
      }}
    >
      <div className="space-y-3">
        <Field label="File" required error={error}>
          {(p) => (
            <input
              {...p}
              type="file"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setError('')
              }}
              className="block w-full text-[13px] file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-2.5 file:py-1 file:text-[13px] file:text-foreground"
            />
          )}
        </Field>
        <Field label="Display title" hint="Defaults to the file name">
          {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} />}
        </Field>
      </div>
    </FormDialog>
  )
}
