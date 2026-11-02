import { Fragment, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Bug,
  CheckCheck,
  ChevronRight,
  FolderPlus,
  ListPlus,
  LogOut,
  Menu as MenuIcon,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserRoundCog,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/menu'
import { UserAvatar } from '@/components/common/people'
import { NotificationRow } from '@/components/activity/NotificationList'
import { useSession, type ThemePreference } from '@/services/session'
import { useUI } from '@/services/ui'
import { markAllNotificationsRead } from '@/services/api'
import { useCan, useCurrentUser, useNotifications, useUsers } from '@/hooks/useData'
import { useResolvedTheme } from '@/hooks/useTheme'
import { roleDef } from '@/lib/workflow'
import { toast } from 'sonner'

function Breadcrumbs() {
  const crumbs = useUI((s) => s.breadcrumbs)
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((c, i) => (
          <Fragment key={`${c.label}-${i}`}>
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground max-sm:hidden" aria-hidden />}
            <li className={i < crumbs.length - 1 ? 'shrink-0 max-sm:hidden' : 'min-w-0'}>
              {c.to && i < crumbs.length - 1 ? (
                <Link to={c.to} className="text-muted-foreground hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="block truncate font-medium">
                  {c.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

function QuickCreate() {
  const openProject = useUI((s) => s.openCreateProject)
  const openTask = useUI((s) => s.openCreateTask)
  const navigate = useNavigate()
  const canProject = useCan('project.create')
  const canTask = useCan('task.create')
  const canBug = useCan('bug.create')
  if (!canProject.allowed && !canTask.allowed && !canBug.allowed) return null
  return (
    <Menu>
      <Tooltip content="Create">
        <MenuTrigger asChild>
          <Button variant="primary" size="sm" aria-label="Quick create">
            <Plus />
            <span className="max-sm:hidden">New</span>
          </Button>
        </MenuTrigger>
      </Tooltip>
      <MenuContent align="end">
        <MenuLabel>Create</MenuLabel>
        {canProject.allowed && (
          <MenuItem onSelect={() => openProject()}>
            <FolderPlus /> Project
          </MenuItem>
        )}
        {canTask.allowed && (
          <MenuItem onSelect={() => openTask()}>
            <ListPlus /> Task
          </MenuItem>
        )}
        {canBug.allowed && (
          <MenuItem onSelect={() => navigate('/bugs?new=1')}>
            <Bug /> Bug report
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  )
}

function Notifications() {
  const notifications = useNotifications()
  const user = useCurrentUser()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <Popover>
      <Tooltip content="Notifications">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
            <Bell />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground tabular">
                {unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-1rem))]">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-[13px] font-semibold">Notifications</p>
          <Button variant="ghost" size="xs" disabled={!unread} onClick={() => void markAllNotificationsRead(user.id)}>
            <CheckCheck /> Mark all read
          </Button>
        </div>
        <div className="scrollbar-thin max-h-[420px] overflow-y-auto p-1">
          {notifications.length ? (
            notifications.slice(0, 8).map((n) => <NotificationRow key={n.id} n={n} dense />)
          ) : (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">You're all caught up.</p>
          )}
        </div>
        <div className="border-t border-border p-1">
          <Link to="/inbox" className="block rounded-md px-2 py-1.5 text-center text-[13px] text-primary hover:bg-accent">
            View all in Inbox
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ThemeToggle() {
  const theme = useSession((s) => s.theme)
  const setTheme = useSession((s) => s.setTheme)
  const resolved = useResolvedTheme()
  return (
    <Menu>
      <Tooltip content="Theme">
        <MenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Theme: ${theme}`}>
            {resolved === 'dark' ? <Moon /> : <Sun />}
          </Button>
        </MenuTrigger>
      </Tooltip>
      <MenuContent align="end">
        <MenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemePreference)}>
          <MenuRadioItem value="light">
            <Sun /> Light
          </MenuRadioItem>
          <MenuRadioItem value="dark">
            <Moon /> Dark
          </MenuRadioItem>
          <MenuRadioItem value="system">
            <Monitor /> System
          </MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  )
}

function UserMenu() {
  const user = useCurrentUser()
  const users = useUsers()
  const setCurrentUser = useSession((s) => s.setCurrentUser)
  const navigate = useNavigate()
  return (
    <Menu>
      <MenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-accent" aria-label={`Account: ${user.name}`}>
        <UserAvatar user={user} size="sm" tooltip={false} />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-[13px] font-medium">{user.name}</span>
          <span className="block text-[11px] text-muted-foreground">{roleDef(user.role).label}</span>
        </span>
      </MenuTrigger>
      <MenuContent align="end" className="w-64">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <UserAvatar user={user} size="md" tooltip={false} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>
            <UserRoundCog /> Preview as role…
          </MenuSubTrigger>
          <MenuSubContent className="w-64">
            <MenuLabel>Prototype role switcher</MenuLabel>
            {/* TODO(AUTH): Remove in production — the role comes from the authenticated session. */}
            <MenuRadioGroup
              value={user.id}
              onValueChange={(id) => {
                setCurrentUser(id)
                const u = users.find((x) => x.id === id)
                if (u) toast.success(`Now previewing as ${u.name}`, { description: `${roleDef(u.role).label} permissions applied (UI only).` })
              }}
            >
              {users.map((u) => (
                <MenuRadioItem key={u.id} value={u.id}>
                  <span className="min-w-0 flex-1 truncate">{u.name}</span>
                  <span className="text-[11px] text-muted-foreground">{roleDef(u.role).label}</span>
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuSubContent>
        </MenuSub>
        <MenuItem onSelect={() => navigate('/my-work')}>
          <ListPlus /> My work
        </MenuItem>
        <MenuItem onSelect={() => navigate('/settings')}>
          <Settings /> Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem disabled>
          <LogOut /> Sign out <span className="ml-auto text-[11px]">SSO not connected</span>
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

export function Topbar() {
  const setSearchOpen = useUI((s) => s.setSearchOpen)
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen])

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur sm:px-4">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
        <MenuIcon />
      </Button>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-[13px] text-muted-foreground shadow-xs hover:border-border-strong max-sm:w-8 max-sm:justify-center max-sm:px-0 sm:w-56 lg:w-72"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left max-sm:hidden">Search…</span>
        <span className="max-sm:hidden">
          <Kbd>Ctrl K</Kbd>
        </span>
      </button>
      <QuickCreate />
      <Notifications />
      <ThemeToggle />
      <UserMenu />
    </header>
  )
}
