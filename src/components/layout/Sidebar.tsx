import { NavLink } from 'react-router-dom'
import {
  Bug,
  Building2,
  CalendarDays,
  ChartGantt,
  CircleUserRound,
  ClipboardCheck,
  CodeXml,
  FolderKanban,
  Handshake,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LineChart,
  ListTodo,
  Lock,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shuffle,
  UsersRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { useSession } from '@/services/session'
import { useUI } from '@/services/ui'
import { useCan, useNotifications } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import type { Permission } from '@/lib/permissions'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: 'inbox'
  /** Visible to everyone, but locked for roles without this permission. */
  lockedWithout?: Permission
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/my-work', label: 'My Work', icon: CircleUserRound },
      { to: '/inbox', label: 'Inbox', icon: Inbox, badge: 'inbox' },
    ],
  },
  {
    section: 'Project Management',
    items: [
      { to: '/clients', label: 'All Clients', icon: Building2 },
      { to: '/projects', label: 'All Projects', icon: FolderKanban },
      { to: '/tasks/mine', label: 'My Tasks', icon: ListTodo },
      { to: '/bugs', label: 'Bugs', icon: Bug },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
      { to: '/timeline', label: 'Timeline', icon: ChartGantt },
    ],
  },
  {
    section: 'Departments',
    items: [
      { to: '/departments/development', label: 'Development', icon: CodeXml },
      { to: '/departments/design', label: 'Design', icon: Palette },
      { to: '/departments/account-management', label: 'Account Management', icon: Handshake },
      { to: '/qi', label: 'Quality Inspection', icon: ClipboardCheck },
      { to: '/cro', label: 'CRO', icon: LineChart },
      { to: '/experiments', label: 'A/B Testing', icon: Shuffle },
    ],
  },
  {
    section: 'Administration',
    items: [
      { to: '/admin/team', label: 'Team Members', icon: UsersRound },
      { to: '/admin/workflows', label: 'Workflows & Statuses', icon: Workflow, lockedWithout: 'admin.workflows' },
      { to: '/admin/templates', label: 'Project Templates', icon: LayoutTemplate, lockedWithout: 'admin.templates' },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function NavRow({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const unread = useNotifications().filter((n) => !n.read).length
  const lock = useCan(item.lockedWithout ?? 'comment.create')
  const locked = Boolean(item.lockedWithout) && !lock.allowed
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground',
          isActive && 'bg-sidebar-active text-foreground',
          collapsed && 'justify-center px-0',
        )
      }
    >
      <item.icon className="size-4 shrink-0 opacity-80" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && locked && <Lock className="ml-auto size-3 text-subtle-foreground" aria-label="Read-only for your role" />}
      {item.badge === 'inbox' && unread > 0 && (
        <span
          className={cn(
            'rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular',
            collapsed ? 'absolute top-0.5 right-0.5 size-2 text-[0px]' : 'ml-auto px-1.5 py-px',
          )}
          aria-label={`${unread} unread`}
        >
          {unread}
        </span>
      )}
    </NavLink>
  )
  return collapsed ? (
    <Tooltip content={item.label} side="right">
      <div className="relative">{link}</div>
    </Tooltip>
  ) : (
    link
  )
}

export function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
      {NAV.map((group) => (
        <div key={group.section} className="mt-4 first:mt-2">
          {!collapsed ? (
            <p className="mb-1 px-2 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">{group.section}</p>
          ) : (
            <div className="mx-2 mb-2 h-px bg-border" />
          )}
          <div className="space-y-px">
            {group.items.map((item) => (
              <NavRow key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function WorkspaceMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
          <path d="M4 4.5h8M4 8h5M4 11.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold">Ecom Workspace</p>
          <p className="truncate text-[11px] text-muted-foreground">Shopify Plus agency</p>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const collapsed = useSession((s) => s.sidebarCollapsed)
  const toggle = useSession((s) => s.toggleSidebar)
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex',
        collapsed ? 'w-[56px]' : 'w-[244px]',
      )}
    >
      <div className={cn('flex h-12 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'px-3')}>
        <WorkspaceMark collapsed={collapsed} />
      </div>
      <SidebarNav collapsed={collapsed} />
      <div className={cn('border-t border-border p-2', collapsed && 'flex justify-center')}>
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && 'Collapse'}
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}

/** Off-canvas navigation for small screens. */
export function MobileNav() {
  const open = useUI((s) => s.mobileNavOpen)
  const setOpen = useUI((s) => s.setMobileNavOpen)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="animate-fade-in absolute inset-0 bg-overlay" onClick={() => setOpen(false)} />
      <aside className="animate-slide-in-right absolute inset-y-0 left-0 flex w-[264px] flex-col border-r border-border bg-sidebar shadow-lg">
        <div className="flex h-12 items-center border-b border-border px-3">
          <WorkspaceMark />
        </div>
        <SidebarNav collapsed={false} onNavigate={() => setOpen(false)} />
      </aside>
    </div>
  )
}
