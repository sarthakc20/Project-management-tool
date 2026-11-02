import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { useDb } from '@/services/store'
import { Segmented } from '@/components/ui/form'
import { ActivityItem } from '@/components/activity/ActivityFeed'
import { CommentComposer, CommentItem } from '@/components/activity/Comments'

type Filter = 'all' | 'comments' | 'updates'

/**
 * Chronological project feed mixing comments and activity events, with a composer.
 * `mode` pins the feed to comments (with composer) or updates (read-only history).
 */
export function ProjectActivity({ projectId, mode }: { projectId: string; mode?: 'comments' | 'updates' }) {
  const comments = useDb((s) => s.comments)
  const activity = useDb((s) => s.activity)
  const tasks = useDb((s) => s.tasks)
  const [chosen, setFilter] = useState<Filter>('all')
  const filter: Filter = mode ?? chosen

  const items = useMemo(() => {
    const c = comments.filter((x) => x.projectId === projectId).map((x) => ({ kind: 'comment' as const, at: x.createdAt, comment: x }))
    // comment_added events are represented by the comment itself
    const a = activity.filter((x) => x.projectId === projectId && x.type !== 'comment_added').map((x) => ({ kind: 'event' as const, at: x.createdAt, event: x }))
    const all = filter === 'comments' ? c : filter === 'updates' ? a : [...c, ...a]
    return all.sort((x, y) => x.at.localeCompare(y.at))
  }, [comments, activity, projectId, filter])

  const taskTitle = (id?: string) => tasks.find((t) => t.id === id)?.title

  return (
    <div className="max-w-3xl">
      {!mode && <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Feed filter"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All' }, { value: 'comments', label: 'Comments' }, { value: 'updates', label: 'Updates' }]}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" /> Local prototype data — resets on reload
          {/* TODO(REALTIME): Stream new comments/events from the server so teammates see updates live. */}
        </p>
      </div>}
      {items.length ? (
        <ol className="relative mb-4 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-border">
          {items.map((i) =>
            i.kind === 'event' ? (
              <ActivityItem key={i.event.id} event={i.event} />
            ) : (
              <li key={i.comment.id} className="relative -ml-0.5 list-none rounded-xl border border-border bg-surface px-3 my-2">
                {i.comment.taskId && <p className="pt-2 text-[11px] text-muted-foreground">On task: {taskTitle(i.comment.taskId)}</p>}
                <ul><CommentItem comment={i.comment} /></ul>
              </li>
            ),
          )}
        </ol>
      ) : (
        <p className="mb-4 py-8 text-center text-[13px] text-muted-foreground">{filter === 'comments' ? 'No comments yet.' : 'Nothing here yet.'}</p>
      )}
      {filter !== 'updates' && <CommentComposer projectId={projectId} />}
    </div>
  )
}
