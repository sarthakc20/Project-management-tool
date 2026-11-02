import { ArrowRight } from 'lucide-react'
import type { StatusCategory } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useDb } from '@/services/store'
import { useCan } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { SectionHeader } from '@/components/ui/display'
import { RestrictedNotice } from '@/components/common/gate'
import { ProjectStatusBadge, TaskStatusBadge } from '@/components/common/badges'
import { TASK_LIFECYCLE, TASK_SIDE_STATUSES, TASK_PROGRESS_WEIGHT } from '@/lib/workflow'

const CATEGORY_LABEL: Record<StatusCategory, string> = {
  todo: 'To do', active: 'Active', review: 'Review', done: 'Done', paused: 'Paused', cancelled: 'Cancelled',
}

/**
 * Read-only view of workflow configuration.
 * TODO(BACKEND): Workflow editing (custom statuses per project type, transitions, required
 * fields) needs a server-side workflow service; views already rely on status categories so
 * new statuses can be added without code changes.
 */
export function WorkflowsPage() {
  useDocumentTitle('Workflows & Statuses')
  useBreadcrumbs([{ label: 'Administration' }, { label: 'Workflows & Statuses' }])
  const { projectStatuses, taskStatuses } = useDb()
  const can = useCan('admin.workflows')
  return (
    <div>
      <PageHeader title="Workflows & Statuses" description="Status definitions used by projects and tasks" />
      <PageBody className="max-w-5xl space-y-8">
        {can.allowed ? (
          <p className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
            Editing workflows requires the workflow service (planned). This screen shows the active configuration that every view reads from.
          </p>
        ) : (
          <RestrictedNotice>{can.reason}. Showing the configuration read-only.</RestrictedNotice>
        )}
        <section>
          <SectionHeader title="Task lifecycle" description="Main path shown on Kanban boards, plus side statuses that can be entered from any step" />
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-4">
            {TASK_LIFECYCLE.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <TaskStatusBadge status={s} />
                {i < TASK_LIFECYCLE.length - 1 && <ArrowRight className="size-3.5 text-subtle-foreground" />}
              </span>
            ))}
            <span className="mx-2 h-5 w-px bg-border" />
            {TASK_SIDE_STATUSES.map((s) => <TaskStatusBadge key={s} status={s} />)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Moving a task to <strong>Ready for QI</strong> opens a QI round automatically. A failed or rejected QI round returns the task to <strong>In progress</strong>.</p>
        </section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <SectionHeader title="Task statuses" />
            <table className="w-full rounded-xl border border-border bg-surface text-left">
              <thead><tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase"><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Category</th><th className="px-3 py-2 text-right font-medium">Progress weight</th></tr></thead>
              <tbody>
                {taskStatuses.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2"><TaskStatusBadge status={s.id} /><p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p></td>
                    <td className="px-3 py-2 text-[13px]">{CATEGORY_LABEL[s.category]}</td>
                    <td className="px-3 py-2 text-right text-[13px] tabular">{TASK_PROGRESS_WEIGHT[s.id]}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <SectionHeader title="Project statuses" />
            <table className="w-full rounded-xl border border-border bg-surface text-left">
              <thead><tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase"><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Category</th></tr></thead>
              <tbody>
                {projectStatuses.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2"><ProjectStatusBadge status={s.id} /><p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p></td>
                    <td className="px-3 py-2 text-[13px]">{CATEGORY_LABEL[s.category]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </PageBody>
    </div>
  )
}
