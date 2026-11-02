import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog as D } from 'radix-ui'
import { Bug, Building2, CornerDownLeft, FolderKanban, ListChecks, Search, UsersRound, type LucideIcon } from 'lucide-react'
import { useUI } from '@/services/ui'
import { useDb } from '@/services/store'
import { Kbd } from '@/components/ui/display'
import { TaskStatusBadge, ProjectStatusBadge } from '@/components/common/badges'
import { ClientAvatar, UserAvatar } from '@/components/common/people'
import { byId, cn, includesText } from '@/lib/utils'
import { paths } from '@/lib/routes'
import { roleDef } from '@/lib/workflow'
import type { ReactNode } from 'react'

interface Result {
  id: string
  group: 'Clients' | 'Projects' | 'Tasks' | 'Bugs' | 'Team members'
  title: string
  subtitle: string
  to: string
  leading: ReactNode
  trailing?: ReactNode
}

const GROUP_ICON: Record<Result['group'], LucideIcon> = {
  Clients: Building2,
  Projects: FolderKanban,
  Tasks: ListChecks,
  Bugs: Bug,
  'Team members': UsersRound,
}

/**
 * Client-side search over the mock store.
 * TODO(SEARCH): Replace with a server-side search endpoint backed by a search index,
 * scoped to records the user is authorised to see.
 */
export function GlobalSearch() {
  const open = useUI((s) => s.searchOpen)
  const setOpen = useUI((s) => s.setSearchOpen)
  const data = useDb()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!open) {
      setQ('')
      setActive(0)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const clients = byId(data.clients)
    const projects = byId(data.projects)
    const query = q.trim()
    const limit = query ? 6 : 4
    const out: Result[] = []
    data.clients
      .filter((c) => includesText([c.name, c.industry, c.code], query))
      .slice(0, limit)
      .forEach((c) =>
        out.push({ id: c.id, group: 'Clients', title: c.name, subtitle: c.industry, to: paths.client(c.id), leading: <ClientAvatar client={c} size="xs" /> }),
      )
    data.projects
      .filter((p) => !p.archived && includesText([p.title, p.key, clients.get(p.clientId)?.name, ...p.tags], query))
      .slice(0, limit)
      .forEach((p) =>
        out.push({
          id: p.id, group: 'Projects', title: p.title, subtitle: `${p.key} · ${clients.get(p.clientId)?.name ?? ''}`,
          to: paths.project(p.id), leading: <FolderKanban className="size-4 text-muted-foreground" />, trailing: <ProjectStatusBadge status={p.status} />,
        }),
      )
    data.tasks
      .filter((t) => projects.has(t.projectId) && includesText([t.title, t.key], query))
      .slice(0, limit)
      .forEach((t) =>
        out.push({
          id: t.id, group: 'Tasks', title: t.title, subtitle: `${t.key} · ${projects.get(t.projectId)?.title ?? ''}`,
          to: paths.task(t.projectId, t.id), leading: <ListChecks className="size-4 text-muted-foreground" />, trailing: <TaskStatusBadge status={t.status} />,
        }),
      )
    data.bugs
      .filter((b) => includesText([b.title, b.key], query))
      .slice(0, query ? limit : 2)
      .forEach((b) =>
        out.push({ id: b.id, group: 'Bugs', title: b.title, subtitle: `${b.key} · ${b.severity}`, to: paths.bug(b.id), leading: <Bug className="size-4 text-muted-foreground" /> }),
      )
    data.users
      .filter((u) => includesText([u.name, u.title, roleDef(u.role).label], query))
      .slice(0, query ? limit : 3)
      .forEach((u) =>
        out.push({ id: u.id, group: 'Team members', title: u.name, subtitle: u.title, to: `/admin/team?user=${u.id}`, leading: <UserAvatar user={u} size="xs" tooltip={false} /> }),
      )
    return out
  }, [data, q])

  const go = (r: Result) => {
    setOpen(false)
    navigate(r.to)
  }

  const groups = useMemo(() => {
    const g = new Map<Result['group'], Result[]>()
    results.forEach((r) => g.set(r.group, [...(g.get(r.group) ?? []), r]))
    return [...g.entries()]
  }, [results])

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Portal>
        <D.Overlay className="animate-fade-in fixed inset-0 z-50 bg-overlay" />
        <D.Content
          className="animate-pop-in fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(results.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(0, a - 1))
            } else if (e.key === 'Enter' && results[active]) {
              e.preventDefault()
              go(results[active])
            }
          }}
        >
          <D.Title className="sr-only">Search</D.Title>
          <D.Description className="sr-only">Search clients, projects, tasks, bugs and team members</D.Description>
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActive(0)
              }}
              placeholder="Search clients, projects, tasks, bugs, people…"
              aria-label="Search"
              role="combobox"
              aria-expanded
              aria-controls="search-results"
              aria-activedescendant={results[active] ? `sr-${results[active].group}-${results[active].id}` : undefined}
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-subtle-foreground"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div id="search-results" role="listbox" className="scrollbar-thin max-h-[55vh] overflow-y-auto p-1.5">
            {!results.length && <p className="py-10 text-center text-[13px] text-muted-foreground">No results for “{q}”</p>}
            {groups.map(([group, items]) => {
              const Icon = GROUP_ICON[group]
              return (
                <div key={group} className="mb-1">
                  <p className="flex items-center gap-1.5 px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
                    <Icon className="size-3" /> {group}
                  </p>
                  {items.map((r) => {
                    const idx = results.indexOf(r)
                    return (
                      <div
                        key={r.id}
                        id={`sr-${r.group}-${r.id}`}
                        role="option"
                        aria-selected={idx === active}
                        onMouseMove={() => setActive(idx)}
                        onClick={() => go(r)}
                        className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2', idx === active && 'bg-accent')}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center">{r.leading}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{r.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>
                        </span>
                        {r.trailing}
                        {idx === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
