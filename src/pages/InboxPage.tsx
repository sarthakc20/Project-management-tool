import { useState } from 'react'
import { BellOff, CheckCheck } from 'lucide-react'
import type { NotificationType } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { markAllNotificationsRead } from '@/services/api'
import { useCurrentUser, useNotifications } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/display'
import { Segmented, Select } from '@/components/ui/form'
import { NOTIFICATION_META, NotificationRow } from '@/components/activity/NotificationList'
import { toast } from 'sonner'

export function InboxPage() {
  useDocumentTitle('Inbox')
  useBreadcrumbs([{ label: 'Inbox' }])
  const me = useCurrentUser()
  const all = useNotifications()
  const [show, setShow] = useState<'all' | 'unread'>('all')
  const [type, setType] = useState<NotificationType | ''>('')
  const list = all.filter((n) => (show === 'all' || !n.read) && (!type || n.type === type))
  const unread = all.filter((n) => !n.read).length

  return (
    <div>
      <PageHeader
        title="Inbox"
        description={`${unread} unread of ${all.length} notifications for ${me.name}`}
        actions={
          <Button disabled={!unread} onClick={() => { void markAllNotificationsRead(me.id); toast.success('All notifications marked as read') }}>
            <CheckCheck /> Mark all read
          </Button>
        }
      />
      <PageBody className="max-w-3xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Show" value={show} onChange={setShow} options={[{ value: 'all', label: 'All' }, { value: 'unread', label: `Unread (${unread})` }]} />
          <Select aria-label="Notification type" value={type} onChange={(e) => setType(e.target.value as NotificationType | '')} className="w-48">
            <option value="">All types</option>
            {Object.entries(NOTIFICATION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <p className="ml-auto text-xs text-muted-foreground">In-app only · email & Slack delivery not connected</p>
        </div>
        {list.length ? (
          <div className="rounded-xl border border-border bg-surface p-1">
            {list.map((n) => <NotificationRow key={n.id} n={n} />)}
          </div>
        ) : (
          <EmptyState icon={BellOff} title={show === 'unread' ? 'No unread notifications' : 'No notifications'} description="Assignments, mentions, deadlines and QI results will appear here." />
        )}
      </PageBody>
    </div>
  )
}
