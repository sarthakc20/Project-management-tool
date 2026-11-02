import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bookmark, Columns3, ListFilter, Search, X } from 'lucide-react'
import type { Project, ProjectStatus, ProjectType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { Menu, MenuCheckboxItem, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { StatusIcon } from '@/components/common/badges'
import { useClients, useCurrentUser, useUsers } from '@/hooks/useData'
import { useSession } from '@/services/session'
import { DEFAULT_PROJECT_STATUSES, PROJECT_TYPES, isProjectClosed } from '@/lib/workflow'
import { isProjectActive, isProjectOverdue } from '@/lib/calculations'
import { projectMembers } from '@/lib/filters'
import { includesText } from '@/lib/utils'
import { PROJECT_COLUMNS } from './ProjectTable'

export type ProjectScope = 'all' | 'active' | 'mine' | 'overdue' | 'closed'

/** Saved-view examples. Each is just a URL query, so they can be bookmarked or shared. */
export const SAVED_VIEWS: { label: string; query: string }[] = [
  { label: 'All active projects', query: 'scope=active' },
  { label: 'My projects', query: 'scope=mine' },
  { label: 'Overdue', query: 'scope=overdue' },
  { label: 'In QI or with the client', query: 'status=quality_inspection,ready_for_client,client_reviewing' },
  { label: 'Release pipeline', query: 'status=prep_for_deployment,ready_to_deploy,deployment' },
  { label: 'Needs support or paused', query: 'status=need_support,pause' },
  { label: 'Theme migrations', query: 'type=theme_migration' },
  { label: 'Urgent & high priority', query: 'scope=active&priority=urgent,high' },
  { label: 'Completed', query: 'status=done' },
]

/** Reads project filters from the URL and applies them. */
export function useProjectFilterState(fixedClientId?: string) {
  const [params, setParams] = useSearchParams()
  const me = useCurrentUser()
  const f = {
    q: params.get('q') ?? '',
    client: fixedClientId ?? params.get('client') ?? '',
    status: (params.get('status')?.split(',').filter(Boolean) ?? []) as ProjectStatus[],
    type: (params.get('type') ?? '') as ProjectType | '',
    owner: params.get('owner') ?? '',
    priority: params.get('priority')?.split(',').filter(Boolean) ?? [],
    scope: (params.get('scope') ?? 'all') as ProjectScope,
    archived: params.get('archived') === '1',
  }
  const set = (key: string, value: string) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p)
        if (value) n.set(key, value)
        else n.delete(key)
        return n
      },
      { replace: true },
    )
  const apply = (projects: Project[], clientName: (id: string) => string | undefined) =>
    projects.filter((p) => {
      if (!f.archived && p.archived) return false
      if (f.client && p.clientId !== f.client) return false
      if (f.status.length && !f.status.includes(p.status)) return false
      if (f.type && p.type !== f.type) return false
      if (f.owner && p.ownerId !== f.owner) return false
      if (f.priority.length && !f.priority.includes(p.priority)) return false
      if (f.scope === 'active' && !isProjectActive(p)) return false
      if (f.scope === 'mine' && !projectMembers(p).includes(me.id)) return false
      if (f.scope === 'overdue' && !isProjectOverdue(p)) return false
      if (f.scope === 'closed' && !isProjectClosed(p.status)) return false
      if (f.q && !includesText([p.title, p.key, clientName(p.clientId), ...p.tags], f.q)) return false
      return true
    })
  const activeCount = [f.q, !fixedClientId && f.client, f.status.length, f.type, f.owner, f.priority.length, f.scope !== 'all', f.archived].filter(Boolean).length
  const clear = () =>
    setParams(
      (p) => {
        const n = new URLSearchParams()
        const tab = p.get('tab')
        if (tab) n.set('tab', tab)
        return n
      },
      { replace: true },
    )
  const applyView = (query: string) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(query)
        const tab = p.get('tab')
        if (tab) n.set('tab', tab)
        return n
      },
      { replace: true },
    )
  return { f, set, apply, activeCount, clear, applyView }
}

export function ProjectFilterBar({ state, hideClient, showColumns }: { state: ReturnType<typeof useProjectFilterState>; hideClient?: boolean; showColumns?: boolean }) {
  const { f, set, activeCount, clear, applyView } = state
  const clients = useClients()
  const users = useUsers()
  const hidden = useSession((s) => s.hiddenProjectColumns)
  const toggleColumn = useSession((s) => s.toggleProjectColumn)
  const owners = useMemo(() => users.filter((u) => ['account_manager', 'admin', 'lead', 'designer', 'cro', 'ab_testing', 'qi'].includes(u.role)), [users])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-60">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search projects" placeholder="Search projects…" value={f.q} onChange={(e) => set('q', e.target.value)} className="pl-8" />
      </div>
      <Select aria-label="Scope" value={f.scope} onChange={(e) => set('scope', e.target.value === 'all' ? '' : e.target.value)} className="w-36">
        <option value="all">All projects</option>
        <option value="active">Active</option>
        <option value="mine">I'm involved</option>
        <option value="overdue">Overdue</option>
        <option value="closed">Closed</option>
      </Select>
      {!hideClient && (
        <Select aria-label="Client" value={f.client} onChange={(e) => set('client', e.target.value)} className="w-40">
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      )}
      <Menu>
        <MenuTrigger asChild>
          <Button size="md" aria-label="Filter by status">
            <ListFilter /> Status{f.status.length ? ` · ${f.status.length}` : ''}
          </Button>
        </MenuTrigger>
        <MenuContent>
          {DEFAULT_PROJECT_STATUSES.map((s) => (
            <MenuCheckboxItem
              key={s.id}
              checked={f.status.includes(s.id)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(c) => set('status', (c ? [...f.status, s.id] : f.status.filter((x) => x !== s.id)).join(','))}
            >
              <StatusIcon status={s.id} kind="project" /> {s.label}
            </MenuCheckboxItem>
          ))}
        </MenuContent>
      </Menu>
      <Select aria-label="Project type" value={f.type} onChange={(e) => set('type', e.target.value)} className="w-40">
        <option value="">All types</option>
        {PROJECT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </Select>
      <Select aria-label="Owner" value={f.owner} onChange={(e) => set('owner', e.target.value)} className="w-36">
        <option value="">Any owner</option>
        {owners.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <input type="checkbox" checked={f.archived} onChange={(e) => set('archived', e.target.checked ? '1' : '')} className="accent-[var(--primary)]" />
        Archived
      </label>
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clear}>
          <X /> Clear {activeCount}
        </Button>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Menu>
          <MenuTrigger asChild>
            <Button size="md"><Bookmark /> Views</Button>
          </MenuTrigger>
          <MenuContent align="end">
            <MenuLabel>Saved views</MenuLabel>
            {SAVED_VIEWS.map((v) => (
              <MenuItem key={v.label} onSelect={() => applyView(v.query)}>{v.label}</MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem disabled>
              Save current view <span className="ml-auto text-[11px]">Needs backend</span>
            </MenuItem>
          </MenuContent>
        </Menu>
        {showColumns && (
          <Menu>
            <MenuTrigger asChild>
              <Button size="md" aria-label="Columns"><Columns3 /> <span className="max-md:sr-only">Columns</span></Button>
            </MenuTrigger>
            <MenuContent align="end">
              <MenuLabel>Visible columns</MenuLabel>
              {PROJECT_COLUMNS.filter((c) => !(hideClient && c.id === 'client')).map((c) => (
                <MenuCheckboxItem key={c.id} checked={!hidden.includes(c.id)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => toggleColumn(c.id)}>
                  {c.label}
                </MenuCheckboxItem>
              ))}
            </MenuContent>
          </Menu>
        )}
      </div>
    </div>
  )
}
