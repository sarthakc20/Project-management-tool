import { useMemo } from 'react'
import type { Project, Task } from '@/types'
import { useDb } from '@/services/store'
import { useSession } from '@/services/session'
import { byId } from '@/lib/utils'
import { computeProjectStats } from '@/lib/calculations'
import { matchProject, matchTask, type ProjectFilters, type TaskFilters } from '@/lib/filters'
import { can, deniedReason, type Permission } from '@/lib/permissions'

/**
 * Reactive read hooks over the mock store. Each hook selects a stable slice and derives
 * with useMemo so every view recomputes from the same records.
 * TODO(BACKEND): Swap for query hooks (e.g. TanStack Query) backed by the API client.
 */

export function useUsers() {
  return useDb((s) => s.users)
}
export function useUserMap() {
  const users = useUsers()
  return useMemo(() => byId(users), [users])
}
export function useUser(id?: string) {
  return useDb((s) => (id ? s.users.find((u) => u.id === id) : undefined))
}

export function useCurrentUser() {
  const id = useSession((s) => s.currentUserId)
  const users = useUsers()
  return users.find((u) => u.id === id) ?? users[0]
}

export function useCan(permission: Permission) {
  const user = useCurrentUser()
  return { allowed: can(user.role, permission), reason: deniedReason(user.role, permission), role: user.role }
}

export function useClients() {
  return useDb((s) => s.clients)
}
export function useClientMap() {
  const clients = useClients()
  return useMemo(() => byId(clients), [clients])
}
export function useClient(id?: string) {
  return useDb((s) => (id ? s.clients.find((c) => c.id === id) : undefined))
}

export function useAllProjects() {
  return useDb((s) => s.projects)
}
export function useProjectMap() {
  const projects = useAllProjects()
  return useMemo(() => byId(projects), [projects])
}
export function useProject(id?: string) {
  return useDb((s) => (id ? s.projects.find((p) => p.id === id) : undefined))
}

export function useProjects(filters: ProjectFilters = {}) {
  const projects = useAllProjects()
  const clientMap = useClientMap()
  const key = JSON.stringify(filters)
  return useMemo(
    () => projects.filter((p) => matchProject(p, filters, clientMap.get(p.clientId)?.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, clientMap, key],
  )
}

export function useAllTasks() {
  return useDb((s) => s.tasks)
}
export function useTask(id?: string | null) {
  return useDb((s) => (id ? s.tasks.find((t) => t.id === id) : undefined))
}

export function useTasks(filters: TaskFilters = {}) {
  const tasks = useAllTasks()
  const projectMap = useProjectMap()
  const key = JSON.stringify(filters)
  return useMemo(
    () => tasks.filter((t) => matchTask(t, filters, projectMap)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, projectMap, key],
  )
}

export function useQIRecords() {
  return useDb((s) => s.qiRecords)
}

/** Stats for one project, derived from its tasks and QI records. */
export function useProjectStats(project?: Project) {
  const tasks = useAllTasks()
  const qi = useQIRecords()
  return useMemo(() => (project ? computeProjectStats(project, tasks, qi) : null), [project, tasks, qi])
}

/** Stats for many projects keyed by project id. */
export function useProjectStatsMap(projects: Project[]) {
  const tasks = useAllTasks()
  const qi = useQIRecords()
  return useMemo(() => new Map(projects.map((p) => [p.id, computeProjectStats(p, tasks, qi)])), [projects, tasks, qi])
}

export function useSubtasks(task?: Task) {
  const tasks = useAllTasks()
  return useMemo(
    () => (task ? tasks.filter((t) => t.parentTaskId === task.id).sort((a, b) => a.order - b.order) : []),
    [task, tasks],
  )
}

export function useNotifications() {
  const userId = useSession((s) => s.currentUserId)
  const all = useDb((s) => s.notifications)
  return useMemo(
    () => all.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, userId],
  )
}
