import { Link } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import type { Client, User } from '@/types'
import { Avatar } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/tooltip'
import { useClient, useUser, useUserMap } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { roleDef } from '@/lib/workflow'

export function UserAvatar({ user, size = 'sm', tooltip = true }: { user?: User; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; tooltip?: boolean }) {
  if (!user)
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-subtle-foreground',
          { xs: 'size-5', sm: 'size-6', md: 'size-7', lg: 'size-9', xl: 'size-12' }[size],
        )}
        aria-label="Unassigned"
      >
        <UserRound className="size-3" />
      </span>
    )
  const a = <Avatar name={user.name} hue={user.avatarHue} size={size} />
  return tooltip ? (
    <Tooltip content={`${user.name} · ${roleDef(user.role).label}`}>
      <span className="inline-flex">{a}</span>
    </Tooltip>
  ) : (
    a
  )
}

export function UserChip({ userId, size = 'xs', className, muted }: { userId?: string; size?: 'xs' | 'sm'; className?: string; muted?: boolean }) {
  const user = useUser(userId)
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5 text-[13px]', className)}>
      <UserAvatar user={user} size={size} tooltip={false} />
      <span className={cn('truncate', !user && 'text-subtle-foreground', muted && 'text-muted-foreground')}>{user?.name ?? 'Unassigned'}</span>
    </span>
  )
}

export function AvatarStack({ userIds, max = 4, size = 'sm' }: { userIds: string[]; max?: number; size?: 'xs' | 'sm' | 'md' }) {
  const map = useUserMap()
  const unique = [...new Set(userIds)].map((id) => map.get(id)).filter((u): u is User => Boolean(u))
  const shown = unique.slice(0, max)
  const rest = unique.length - shown.length
  if (!unique.length) return <span className="text-[13px] text-subtle-foreground">—</span>
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((u) => (
        <UserAvatar key={u.id} user={u} size={size} />
      ))}
      {rest > 0 && (
        <Tooltip content={unique.slice(max).map((u) => u.name).join(', ')}>
          <span className={cn('inline-flex items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-surface', size === 'xs' ? 'size-5' : size === 'sm' ? 'size-6' : 'size-7')}>
            +{rest}
          </span>
        </Tooltip>
      )}
    </span>
  )
}

export function ClientAvatar({ client, size = 'sm' }: { client?: Client; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  if (!client) return null
  return <Avatar name={client.name} hue={client.avatarHue} size={size} square />
}

export function ClientChip({ clientId, link = true, className }: { clientId: string; link?: boolean; className?: string }) {
  const client = useClient(clientId)
  if (!client) return <span className="text-subtle-foreground">Unknown client</span>
  const inner = (
    <>
      <ClientAvatar client={client} size="xs" />
      <span className="truncate">{client.name}</span>
    </>
  )
  return link ? (
    <Link
      to={`/clients/${client.id}`}
      onClick={(e) => e.stopPropagation()}
      className={cn('inline-flex min-w-0 items-center gap-1.5 text-[13px] hover:underline', className)}
    >
      {inner}
    </Link>
  ) : (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5 text-[13px]', className)}>{inner}</span>
  )
}
