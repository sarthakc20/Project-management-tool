import { Fragment, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Minus } from 'lucide-react'
import type { Role } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { updateUser } from '@/services/api'
import { useCan } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { RestrictedNotice } from '@/components/common/gate'
import { UserAvatar } from '@/components/common/people'
import { PERMISSION_GROUPS, PERMISSION_LABELS, PERMISSION_MATRIX } from '@/lib/permissions'
import { ROLES, departmentDef, isTaskClosed, roleDef } from '@/lib/workflow'
import { cn } from '@/lib/utils'

export function TeamPage() {
  useDocumentTitle('Team Members')
  useBreadcrumbs([{ label: 'Administration' }, { label: 'Team Members' }])
  const { users, teams, tasks } = useDb()
  const can = useCan('admin.users')
  const [params, setParams] = useSearchParams()
  const highlight = params.get('user')
  const tab = params.get('tab') ?? 'members'

  const load = useMemo(
    () =>
      new Map(
        users.map((u) => {
          const open = tasks.filter((t) => t.assigneeId === u.id && !isTaskClosed(t.status))
          return [u.id, { count: open.length, hours: open.reduce((a, t) => a + Math.max(0, (t.estimatedHours ?? 0) - (t.actualHours ?? 0)), 0) }]
        }),
      ),
    [users, tasks],
  )

  return (
    <div>
      <PageHeader title="Team Members" description={`${users.length} members across ${teams.length} teams`} />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <div className="px-4 sm:px-6">
          <TabsList>
            <TabsTrigger value="members" count={users.length}>Members</TabsTrigger>
            <TabsTrigger value="permissions">Roles & permissions</TabsTrigger>
          </TabsList>
        </div>
        <PageBody className="space-y-4">
          <TabsContent value="members" className="space-y-4">
            {!can.allowed && <RestrictedNotice>Read-only: {can.reason}.</RestrictedNotice>}
            <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                    {['Member', 'Role', 'Department', 'Team', 'Open work', 'Capacity', 'Timezone', 'Status'].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const l = load.get(u.id)!
                    return (
                      <tr key={u.id} className={cn('border-b border-border last:border-0', highlight === u.id && 'bg-primary-soft/50')}>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2.5">
                            <UserAvatar user={u} size="md" tooltip={false} />
                            <span>
                              <span className="block text-[13px] font-medium">{u.name}</span>
                              <span className="block text-xs text-muted-foreground">{u.email}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {can.allowed ? (
                            <Select
                              aria-label={`Role for ${u.name}`}
                              value={u.role}
                              onChange={(e) => {
                                // TODO(RBAC): Role changes must be persisted and enforced server-side, with an audit entry.
                                void updateUser(u.id, { role: e.target.value as Role })
                                toast.success(`${u.name} is now ${roleDef(e.target.value as Role).label}`, { description: 'Prototype only — permissions update immediately in the UI.' })
                              }}
                              className="w-44 [&_select]:h-7"
                            >
                              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </Select>
                          ) : (
                            <span className="text-[13px]">{roleDef(u.role).label}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[13px] text-muted-foreground">{departmentDef(u.department).label}</td>
                        <td className="px-3 py-2 text-[13px] text-muted-foreground">{teams.find((t) => t.id === u.teamId)?.name}</td>
                        <td className="px-3 py-2 text-[13px] tabular">{l.count} tasks · {Math.round(l.hours * 10) / 10}h</td>
                        <td className="px-3 py-2 text-[13px] tabular">{u.weeklyCapacityHours}h / wk</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{u.timezone}</td>
                        <td className="px-3 py-2">
                          <label className={cn('flex items-center gap-1.5 text-[13px]', !can.allowed && 'opacity-70')}>
                            <input type="checkbox" checked={u.active} disabled={!can.allowed} onChange={(e) => { void updateUser(u.id, { active: e.target.checked }); toast.success(e.target.checked ? 'Member activated' : 'Member deactivated') }} className="accent-[var(--primary)]" />
                            {u.active ? 'Active' : 'Inactive'}
                          </label>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {/* TODO(AUTH): Provision members from company SSO (SCIM) instead of manual records. */}
              Members will be provisioned from company SSO in production; inviting users is not available in the prototype.
            </p>
          </TabsContent>
          <TabsContent value="permissions" className="space-y-3">
            <p className="max-w-3xl text-[13px] text-muted-foreground">
              Central permission matrix used by every screen (<code className="font-mono text-xs">src/lib/permissions.ts</code>). In the prototype it only shapes the UI — the backend must enforce the same rules.
            </p>
            <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th scope="col" className="sticky left-0 bg-surface px-3 py-2 font-medium">Permission</th>
                    {ROLES.map((r) => <th key={r.id} scope="col" className="px-2 py-2 text-center font-medium">{r.short}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.map((g) => (
                    <Fragment key={g.label}>
                      <tr className="bg-surface-2"><th scope="rowgroup" colSpan={ROLES.length + 1} className="px-3 py-1.5 text-xs font-semibold">{g.label}</th></tr>
                      {g.permissions.map((p) => (
                        <tr key={p} className="border-b border-border">
                          <th scope="row" className="sticky left-0 bg-surface px-3 py-1.5 text-[13px] font-normal capitalize">{PERMISSION_LABELS[p]}</th>
                          {ROLES.map((r) => (
                            <td key={r.id} className="px-2 py-1.5 text-center">
                              {PERMISSION_MATRIX[r.id].includes(p) ? <Check className="mx-auto size-4 text-tone-green-fg" aria-label="Allowed" /> : <Minus className="mx-auto size-4 text-subtle-foreground" aria-label="Not allowed" />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </PageBody>
      </Tabs>
    </div>
  )
}
