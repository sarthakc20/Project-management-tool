import { useState } from 'react'
import { toast } from 'sonner'
import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import { useBreadcrumbs } from '@/services/ui'
import { useSession, type ThemePreference } from '@/services/session'
import { resetDemoData } from '@/services/api'
import { useCan, useCurrentUser, useUsers } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { Badge, SectionHeader } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { ConfirmDialog } from '@/components/common/confirm'
import { UserAvatar } from '@/components/common/people'
import { roleDef } from '@/lib/workflow'
import { cn } from '@/lib/utils'

/** Planned integrations — listed so reviewers see what is intentionally not connected. */
const INTEGRATIONS = [
  { name: 'Notion (migration source)', tag: 'NOTION-MIGRATION', detail: 'One-time import of project cards, tasks and relations, then validation against the source.' },
  { name: 'Company SSO', tag: 'AUTH', detail: 'Sign-in, sessions and user provisioning. Replaces the role switcher.' },
  { name: 'Slack', tag: 'EMAIL-SLACK', detail: 'Mentions, assignments and QI results posted to client channels and DMs.' },
  { name: 'Email', tag: 'EMAIL-SLACK', detail: 'Daily digests and deadline reminders.' },
  { name: 'File storage', tag: 'FILE-STORAGE', detail: 'Secure uploads with signed URLs and access control.' },
  { name: 'Analytics / experimentation', tag: 'ANALYTICS', detail: 'GA4 and experimentation platform metrics for CRO and A/B tests.' },
  { name: 'Client portal', tag: 'CLIENT-PORTAL', detail: 'Sync project status and links to the external client portal.' },
]

export function SettingsPage() {
  useDocumentTitle('Settings')
  useBreadcrumbs([{ label: 'Administration' }, { label: 'Settings' }])
  const theme = useSession((s) => s.theme)
  const setTheme = useSession((s) => s.setTheme)
  const setCurrentUser = useSession((s) => s.setCurrentUser)
  const me = useCurrentUser()
  const users = useUsers()
  const isAdmin = useCan('admin.access')
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div>
      <PageHeader title="Settings" description="Personal preferences and prototype controls" />
      <PageBody className="max-w-3xl space-y-8">
        <section>
          <SectionHeader title="Appearance" description="Saved in this browser. “System” follows your OS setting." />
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
            {([
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
              ['system', 'System', Monitor],
            ] as [ThemePreference, string, typeof Sun][]).map(([v, l, Icon]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={theme === v}
                onClick={() => setTheme(v)}
                className={cn('flex flex-col items-center gap-2 rounded-xl border bg-surface px-3 py-4 text-[13px] font-medium hover:border-border-strong', theme === v ? 'border-primary ring-2 ring-primary/25' : 'border-border')}
              >
                <Icon className="size-5 text-muted-foreground" /> {l}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Preview as role" description="Prototype-only role switcher. Permissions affect the UI only and are not security controls." />
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <UserAvatar user={me} size="lg" tooltip={false} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">{me.name}</p>
              <p className="text-xs text-muted-foreground">{roleDef(me.role).label} · {roleDef(me.role).description}</p>
            </div>
            <Select
              aria-label="Preview as"
              value={me.id}
              onChange={(e) => {
                setCurrentUser(e.target.value)
                toast.success(`Now previewing as ${users.find((u) => u.id === e.target.value)?.name}`)
              }}
              className="w-64"
            >
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} — {roleDef(u.role).label}</option>)}
            </Select>
          </div>
        </section>

        <section>
          <SectionHeader title="Notifications" description="Delivery channels beyond the in-app inbox are not connected in the prototype." />
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {['In-app inbox', 'Email digest', 'Slack direct messages'].map((c, i) => (
              <li key={c} className="flex items-center justify-between px-3 py-2.5 text-[13px]">
                {c}
                {i === 0 ? <Badge tone="green" dot>On</Badge> : <Badge>Not connected</Badge>}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeader title="Integrations" description="Planned integration points. See docs/integration-roadmap.md for details and decisions needed." />
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {INTEGRATIONS.map((i) => (
              <li key={i.name} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.detail}</p>
                </div>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">TODO({i.tag})</code>
                <Badge>Not connected</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeader title="Demo data" description="All records live in memory and reset on reload. Reset restores the original sample dataset now." />
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <p className="flex-1 text-[13px] text-muted-foreground">Resets clients, projects, tasks, comments, notifications, QI records and experiments. Theme and role preferences are kept.</p>
            <Button variant="destructive-ghost" onClick={() => setConfirmReset(true)}><RotateCcw /> Reset demo data</Button>
          </div>
          {!isAdmin.allowed && <p className="mt-1 text-xs text-muted-foreground">Available to every role because it only affects your browser session.</p>}
        </section>
      </PageBody>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="Any projects, tasks or comments you created in this session will be lost."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          resetDemoData()
          toast.success('Demo data reset')
        }}
      />
    </div>
  )
}
