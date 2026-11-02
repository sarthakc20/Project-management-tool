import { Dialog as D } from 'radix-ui'
import { ListChecks, X } from 'lucide-react'
import type { Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/display'
import { TaskTable } from './TaskTable'
import { pluralize } from '@/lib/utils'

/**
 * Side panel listing a set of tasks (e.g. a dashboard metric's tasks). Rows are editable
 * inline and open the task panel on click.
 */
export function TaskListSheet({
  open,
  onClose,
  title,
  description,
  tasks,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  tasks: Task[]
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <SheetContent title={title} className="max-w-[960px]">
          <header className="flex items-start gap-3 border-b border-border px-5 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {pluralize(tasks.length, 'task')}
                {description ? ` · ${description}` : ''}
              </p>
            </div>
            <D.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X />
              </Button>
            </D.Close>
          </header>
          <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
            <TaskTable
              tasks={tasks}
              nested={false}
              columns={['project', 'status', 'assignee', 'priority', 'due', 'estimate', 'actual']}
              emptyState={<EmptyState icon={ListChecks} title="No tasks here" description="Nothing matches this view right now." />}
            />
          </div>
        </SheetContent>
      )}
    </Dialog>
  )
}
