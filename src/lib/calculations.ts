import type { Project, QIRecord, QITimeEntry, Task, Tone } from '@/types'
import { daysUntil, now, parseDate } from './dates'
import { TASK_PROGRESS_WEIGHT, isProjectClosed, isTaskClosed, projectStatusDef } from './workflow'
import { sum } from './utils'

/**
 * Derived metrics. Everything here is computed from records at render time so that a
 * single status change flows through tables, boards, dashboards and project totals.
 *
 * TODO(BACKEND): Heavy aggregates (workload, portfolio rollups) should move to server-side
 * queries or materialised views once data volume grows beyond what the client holds.
 */

export function childrenOf(taskId: string, tasks: Task[]) {
  return tasks.filter((t) => t.parentTaskId === taskId).sort((a, b) => a.order - b.order)
}

export function isTaskOverdue(task: Task) {
  if (isTaskClosed(task.status)) return false
  const n = daysUntil(task.dueDate)
  return n !== null && n < 0
}

export function isTaskDueToday(task: Task) {
  return !isTaskClosed(task.status) && daysUntil(task.dueDate) === 0
}

/** 0–100. Subtasks drive progress when present; otherwise the status weight is used. */
export function taskProgress(task: Task, allTasks: Task[]): number {
  if (task.status === 'done') return 100
  const kids = childrenOf(task.id, allTasks).filter((k) => k.status !== 'cancelled')
  if (kids.length > 0) {
    return Math.round(sum(kids.map((k) => taskProgress(k, allTasks))) / kids.length)
  }
  return TASK_PROGRESS_WEIGHT[task.status]
}

export function projectDueDate(project: Project) {
  return project.revisedDueDate ?? project.originalDueDate
}

export type ScheduleHealth = 'on_time' | 'at_risk' | 'late' | 'completed_on_time' | 'completed_late' | 'no_due_date'

export const SCHEDULE_META: Record<ScheduleHealth, { label: string; tone: Tone }> = {
  on_time: { label: 'On time', tone: 'green' },
  at_risk: { label: 'At risk', tone: 'amber' },
  late: { label: 'Late', tone: 'red' },
  completed_on_time: { label: 'Delivered on time', tone: 'green' },
  completed_late: { label: 'Delivered late', tone: 'orange' },
  no_due_date: { label: 'No due date', tone: 'gray' },
}

export interface ProjectStats {
  /** Top-level tasks, excluding cancelled */
  taskCount: number
  doneCount: number
  openCount: number
  overdueCount: number
  blockedCount: number
  subtaskCount: number
  /** Sum of estimates on leaf tasks (tasks without subtasks) */
  estimatedHours: number
  actualHours: number
  /** Leaf estimate hours of dev/bug tasks */
  devTaskHours: number
  bufferTaskHours: number
  qiTaskHours: number
  percentComplete: number
  /** Share of development scope (by hours) that has reached QI or later */
  derivedPushedToQi: number | null
  /** Manual projection total = dev + buffer + QI (the Notion "Total project hours") */
  projectedTotalHours: number | null
  schedule: ScheduleHealth
  qiStatus: 'none' | 'awaiting' | 'in_progress' | 'passed' | 'rework'
}

export function leafTasks(projectTasks: Task[]) {
  const parents = new Set(projectTasks.filter((t) => t.parentTaskId).map((t) => t.parentTaskId))
  return projectTasks.filter((t) => !parents.has(t.id) && t.status !== 'cancelled')
}

export function scheduleHealth(project: Project, percentComplete: number): ScheduleHealth {
  const due = projectDueDate(project)
  if (isProjectClosed(project.status)) {
    const done = parseDate(project.completedAt)
    const original = parseDate(project.originalDueDate)
    if (!done || !original) return 'completed_on_time'
    return done.getTime() > original.getTime() ? 'completed_late' : 'completed_on_time'
  }
  if (!due) return 'no_due_date'
  if (isProjectClosed(project.status)) return 'on_time'
  const n = daysUntil(due)!
  if (n < 0) return 'late'
  if (n <= 3 && percentComplete < 70) return 'at_risk'
  if (project.status === 'need_support') return 'at_risk'
  return 'on_time'
}

export function computeProjectStats(project: Project, allTasks: Task[], qiRecords: QIRecord[] = []): ProjectStats {
  const projectTasks = allTasks.filter((t) => t.projectId === project.id)
  const top = projectTasks.filter((t) => !t.parentTaskId && t.status !== 'cancelled')
  const leaves = leafTasks(projectTasks)
  const isDev = (t: Task) => t.type === 'development' || t.type === 'bug' || t.type === 'design'
  const devLeaves = leaves.filter(isDev)
  const devHours = sum(devLeaves.map((t) => t.estimatedHours))
  const pushedHours = sum(
    devLeaves
      .filter((t) => t.status === 'ready_for_qi' || t.status === 'done' || qiRecords.some((q) => q.taskId === t.id))
      .map((t) => t.estimatedHours),
  )

  // Hours-weighted completion; tasks without estimates count as 1h so they still matter.
  const weights = top.map((t) => {
    const kids = projectTasks.filter((k) => k.parentTaskId === t.id && k.status !== 'cancelled')
    const est = kids.length ? sum(kids.map((k) => k.estimatedHours)) : t.estimatedHours
    return est && est > 0 ? est : 1
  })
  const totalWeight = sum(weights)
  const percentComplete =
    isProjectClosed(project.status)
      ? 100
      : top.length === 0
        ? 0
        : Math.round(sum(top.map((t, i) => taskProgress(t, allTasks) * weights[i])) / totalWeight)

  const manualParts = [project.projectedDevHours, project.bufferHours, project.projectedQiHours]
  const projectedTotalHours = manualParts.some((v) => v !== undefined) ? sum(manualParts) : null

  const projectQi = qiRecords.filter((q) => q.projectId === project.id)
  let qiStatus: ProjectStats['qiStatus'] = 'none'
  if (projectQi.length) {
    const latestByTask = new Map<string, QIRecord>()
    for (const q of projectQi) {
      const prev = latestByTask.get(q.taskId)
      if (!prev || q.round > prev.round) latestByTask.set(q.taskId, q)
    }
    const latest = [...latestByTask.values()]
    if (latest.some((q) => q.status === 'failed' || q.status === 'changes_requested')) qiStatus = 'rework'
    else if (latest.some((q) => q.status === 'in_progress')) qiStatus = 'in_progress'
    else if (latest.some((q) => q.status === 'awaiting')) qiStatus = 'awaiting'
    else qiStatus = 'passed'
  }

  return {
    taskCount: top.length,
    doneCount: top.filter((t) => t.status === 'done').length,
    openCount: top.filter((t) => !isTaskClosed(t.status)).length,
    overdueCount: projectTasks.filter(isTaskOverdue).length,
    blockedCount: projectTasks.filter((t) => t.status === 'blocked').length,
    subtaskCount: projectTasks.filter((t) => t.parentTaskId).length,
    estimatedHours: sum(leaves.map((t) => t.estimatedHours)),
    actualHours: sum(leaves.map((t) => t.actualHours)),
    devTaskHours: devHours,
    bufferTaskHours: sum(leaves.filter((t) => t.type === 'buffer').map((t) => t.estimatedHours)),
    qiTaskHours: sum(leaves.filter((t) => t.type === 'quality_inspection').map((t) => t.estimatedHours)),
    percentComplete,
    derivedPushedToQi: devHours > 0 ? Math.round((pushedHours / devHours) * 100) : null,
    projectedTotalHours,
    schedule: scheduleHealth(project, percentComplete),
    qiStatus,
  }
}

export function isProjectActive(project: Project) {
  if (project.archived) return false
  const c = projectStatusDef(project.status).category
  return c === 'active' || c === 'review' || c === 'todo' || project.status === 'need_support'
}

export function isProjectOverdue(project: Project) {
  if (isProjectClosed(project.status) || project.archived) return false
  const n = daysUntil(projectDueDate(project))
  return n !== null && n < 0
}

/**
 * Notion "Task Health" formula: a one-glance flag per task row on the project card.
 * Status is always shown as a label next to the dot, never colour alone.
 */
export type TaskHealth = 'done' | 'missing_date' | 'overdue' | 'due_soon' | 'on_track' | 'cancelled'

export const TASK_HEALTH: Record<TaskHealth, { label: string; tone: Tone }> = {
  done: { label: 'Done', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
  missing_date: { label: 'Missing date', tone: 'red' },
  overdue: { label: 'Overdue', tone: 'red' },
  due_soon: { label: 'Due soon', tone: 'amber' },
  on_track: { label: 'On track', tone: 'blue' },
}

export function taskHealth(task: Task): TaskHealth {
  if (task.status === 'cancelled') return 'cancelled'
  if (isTaskClosed(task.status)) return 'done'
  if (!task.dueDate) return 'missing_date'
  const n = daysUntil(task.dueDate)!
  if (n < 0) return 'overdue'
  return n <= 2 ? 'due_soon' : 'on_track'
}

/** Hours of one QI session; a running session counts up to now. */
export function qiEntryHours(e: QITimeEntry) {
  const end = e.endedAt ? new Date(e.endedAt).getTime() : now().getTime()
  return Math.max(0, (end - new Date(e.startedAt).getTime()) / 3_600_000)
}

/** Notion "Total QI Hours": sum of every QI Start → QI End session on the project. */
export function qiTrackedHours(entries: QITimeEntry[], projectId: string) {
  return sum(entries.filter((e) => e.projectId === projectId).map(qiEntryHours))
}
