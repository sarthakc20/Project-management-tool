import { useNavigate } from 'react-router-dom'
import { AlarmClock, ArrowRightLeft, AtSign, CalendarClock, MessageSquare, RotateCcw, UserPlus, type LucideIcon } from 'lucide-react'
import type { Notification, NotificationType } from '@/types'
import { updateNotification } from '@/services/api'
import { useDb } from '@/services/store'
import { refPath } from '@/lib/routes'
import { relativeTime } from '@/lib/dates'
import { cn } from '@/lib/utils'

export const NOTIFICATION_META: Record<NotificationType, { icon: LucideIcon; label: string; tone: string }> = {
  task_assigned: { icon: UserPlus, label: 'Assignment', tone: 'text-tone-blue-fg bg-tone-blue-bg' },
  comment: { icon: MessageSquare, label: 'Comment', tone: 'text-tone-gray-fg bg-tone-gray-bg' },
  mention: { icon: AtSign, label: 'Mention', tone: 'text-tone-violet-fg bg-tone-violet-bg' },
  deadline_approaching: { icon: CalendarClock, label: 'Deadline', tone: 'text-tone-amber-fg bg-tone-amber-bg' },
  overdue: { icon: AlarmClock, label: 'Overdue', tone: 'text-tone-red-fg bg-tone-red-bg' },
  qi_returned: { icon: RotateCcw, label: 'Returned from QI', tone: 'text-tone-orange-fg bg-tone-orange-bg' },
  status_changed: { icon: ArrowRightLeft, label: 'Status change', tone: 'text-tone-teal-fg bg-tone-teal-bg' },
}

export function NotificationRow({ n, onNavigate, dense }: { n: Notification; onNavigate?: () => void; dense?: boolean }) {
  const navigate = useNavigate()
  const tasks = useDb((s) => s.tasks)
  const meta = NOTIFICATION_META[n.type]
  return (
    <div className={cn('group relative flex gap-3 rounded-lg px-2.5 transition-colors hover:bg-accent', dense ? 'py-2' : 'py-2.5')}>
      <button
        type="button"
        onClick={() => {
          void updateNotification(n.id, { read: true })
          navigate(refPath(n.ref, { tasks }))
          onNavigate?.()
        }}
        className="absolute inset-0 rounded-lg"
        aria-label={`Open: ${n.title}`}
      />
      <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md', meta.tone)}>
        <meta.icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[13px] leading-snug', !n.read ? 'font-semibold' : 'text-foreground')}>{n.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
        <p className="mt-0.5 text-[11px] text-subtle-foreground">
          {meta.label} · {relativeTime(n.createdAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void updateNotification(n.id, { read: !n.read })}
        className="relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        aria-label={n.read ? 'Mark as unread' : 'Mark as read'}
        title={n.read ? 'Mark as unread' : 'Mark as read'}
      >
        <span className={cn('size-2 rounded-full', n.read ? 'border border-border-strong' : 'bg-primary')} />
      </button>
    </div>
  )
}
