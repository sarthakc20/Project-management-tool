import type { Department, Priority, Project, ProjectStatus, ProjectType, Task, TaskStatus } from '@/types'
import { daysUntil } from './dates'
import { isTaskOverdue } from './calculations'
import { isTaskClosed, taskTypeDef } from './workflow'
import { includesText } from './utils'

/**
 * Filter predicates shared by the mock API (`getProjects`, `getTasks`) and reactive hooks,
 * so the same query semantics apply everywhere.
 * TODO(SEARCH): Move text search to a server-side index (Postgres FTS / Algolia / Typesense)
 * once data no longer fits in the client.
 */

export interface ProjectFilters {
  clientId?: string
  status?: ProjectStatus[]
  type?: ProjectType[]
  ownerId?: string
  memberId?: string
  priority?: Priority[]
  search?: string
  includeArchived?: boolean
}

export interface TaskFilters {
  projectId?: string
  clientId?: string
  assigneeId?: string
  status?: TaskStatus[]
  priority?: Priority[]
  department?: Department
  due?: 'overdue' | 'today' | 'week' | 'none' | 'any'
  search?: string
  topLevelOnly?: boolean
  includeClosed?: boolean
}

export function projectMembers(p: Project) {
  return [
    p.ownerId, p.accountManagerId, p.leadId, p.qiOwnerId, p.croOwnerId, p.abOwnerId,
    ...p.developerIds, ...p.designerIds,
  ].filter((x): x is string => Boolean(x))
}

export function matchProject(p: Project, f: ProjectFilters, clientName?: string) {
  if (!f.includeArchived && p.archived) return false
  if (f.clientId && p.clientId !== f.clientId) return false
  if (f.status?.length && !f.status.includes(p.status)) return false
  if (f.type?.length && !f.type.includes(p.type)) return false
  if (f.priority?.length && !f.priority.includes(p.priority)) return false
  if (f.ownerId && p.ownerId !== f.ownerId) return false
  if (f.memberId && !projectMembers(p).includes(f.memberId)) return false
  if (f.search && !includesText([p.title, p.key, clientName, ...p.tags], f.search)) return false
  return true
}

export function matchTask(t: Task, f: TaskFilters, projectById: Map<string, Project>) {
  const project = projectById.get(t.projectId)
  if (!project || project.archived) return false
  if (f.projectId && t.projectId !== f.projectId) return false
  if (f.clientId && project.clientId !== f.clientId) return false
  if (f.assigneeId && t.assigneeId !== f.assigneeId) return false
  if (f.topLevelOnly && t.parentTaskId) return false
  if (f.status?.length && !f.status.includes(t.status)) return false
  if (!f.status?.length && f.includeClosed === false && isTaskClosed(t.status)) return false
  if (f.priority?.length && !f.priority.includes(t.priority)) return false
  if (f.department && taskTypeDef(t.type).department !== f.department) return false
  if (f.due && f.due !== 'any') {
    const n = daysUntil(t.dueDate)
    if (f.due === 'none' && n !== null) return false
    if (f.due === 'overdue' && !isTaskOverdue(t)) return false
    if (f.due === 'today' && n !== 0) return false
    if (f.due === 'week' && (n === null || n < 0 || n > 7)) return false
  }
  if (f.search && !includesText([t.title, t.key, t.description], f.search)) return false
  return true
}
