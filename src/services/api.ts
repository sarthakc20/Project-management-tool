import type {
  ABTestExperiment,
  ActivityEvent,
  Attachment,
  Bug,
  Client,
  Comment,
  CROExperiment,
  ID,
  Notification,
  Project,
  QIRecord,
  QIStatus,
  QITimeEntry,
  Task,
  User,
} from '@/types'
import { db } from './store'
import { useSession } from './session'
import { byId, delay, uid } from '@/lib/utils'
import { formatDuration, now, toISODate } from '@/lib/dates'
import { matchProject, matchTask, type ProjectFilters, type TaskFilters } from '@/lib/filters'
import { makeChecklist } from '@/data/quality'
import { isProjectClosed } from '@/lib/workflow'

/**
 * Mock API. Function names and signatures follow the shape of the future REST API so this
 * module can be replaced by a real client without touching components.
 *
 * Writes apply synchronously to the in-memory store (behaving like an optimistic update)
 * and resolve a Promise; reads add a short simulated latency.
 *
 * TODO(BACKEND): Replace each function body with a call to the production API
 * (e.g. GET /projects?clientId=…, PATCH /tasks/:id) and keep the same return types.
 * TODO(API-ERRORS): Surface API failures (network, 4xx validation, 409 conflicts) as typed
 * errors; callers already show toasts and should roll back optimistic updates on failure.
 * TODO(SECURITY): Add server-side input validation, authorization, and rate limiting.
 * The client-side validation in forms is for UX only.
 */

const nowIso = () => now().toISOString()
const actor = () => useSession.getState().currentUserId

export class NotFoundError extends Error {}

// ───────────────────────────── Activity & notifications ─────────────────────────────

/**
 * TODO(AUDIT): Persist activity events and enforce audit-log access rules.
 * Events should be written server-side in the same transaction as the change they describe.
 */
export function logActivity(event: Omit<ActivityEvent, 'id' | 'createdAt' | 'actorId'> & { actorId?: ID }) {
  const entry: ActivityEvent = { id: uid('a'), createdAt: nowIso(), actorId: event.actorId ?? actor(), ...event }
  db.set((s) => ({ activity: [entry, ...s.activity] }))
  return entry
}

/**
 * TODO(NOTIFICATIONS): Replace local notifications with persistent server-side events.
 * TODO(REALTIME): Push to recipients via WebSocket / SSE.
 * TODO(EMAIL-SLACK): Deliver via email and Slack according to user preferences.
 * TODO(JOBS): Deadline-approaching and overdue notifications should come from a scheduled
 * background job rather than being created on the client.
 */
function notify(n: Omit<Notification, 'id' | 'createdAt' | 'read' | 'actorId'>) {
  const me = actor()
  if (n.userId === me) return
  const entry: Notification = { id: uid('n'), createdAt: nowIso(), read: false, actorId: me, ...n }
  db.set((s) => ({ notifications: [entry, ...s.notifications] }))
}

function actorName() {
  return db.get().users.find((u) => u.id === actor())?.name ?? 'Someone'
}

// ───────────────────────────── Clients ─────────────────────────────

export async function getClients(): Promise<Client[]> {
  await delay()
  return db.get().clients
}

export async function getClientById(id: ID): Promise<Client> {
  await delay()
  const c = db.get().clients.find((x) => x.id === id)
  if (!c) throw new NotFoundError(`Client ${id} not found`)
  return c
}

export async function updateClient(id: ID, updates: Partial<Client>) {
  db.set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)) }))
  return db.get().clients.find((c) => c.id === id)!
}

// ───────────────────────────── Projects ─────────────────────────────

export async function getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  await delay()
  const { projects, clients } = db.get()
  const clientMap = byId(clients)
  return projects.filter((p) => matchProject(p, filters, clientMap.get(p.clientId)?.name))
}

export async function getProjectById(id: ID): Promise<Project> {
  await delay()
  const p = db.get().projects.find((x) => x.id === id)
  if (!p) throw new NotFoundError(`Project ${id} not found`)
  return p
}

export type CreateProjectInput = Omit<
  Project,
  'id' | 'key' | 'createdAt' | 'updatedAt' | 'archived' | 'customFields' | 'pmStatus'
> & { customFields?: Project['customFields']; createDefaultTasks?: boolean }

function nextProjectKey(clientId: ID) {
  const { clients, projects } = db.get()
  const code = clients.find((c) => c.id === clientId)?.code ?? 'PR'
  const nums = projects
    .filter((p) => p.key.startsWith(`${code}-`))
    .map((p) => Number(p.key.split('-')[1]) || 0)
  return `${code}-${Math.max(0, ...nums) + 1}`
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { createDefaultTasks, ...rest } = input
  const ts = nowIso()
  const project: Project = {
    ...rest,
    id: uid('p'),
    key: nextProjectKey(input.clientId),
    createdAt: ts,
    updatedAt: ts,
    archived: false,
    pmStatus: 'not_reviewed',
    customFields: input.customFields ?? [],
  }
  db.set((s) => ({ projects: [project, ...s.projects] }))
  logActivity({ type: 'project_created', projectId: project.id, clientId: project.clientId, meta: {} })

  const template = db.get().templates.find((t) => t.id === input.templateId)
  if (createDefaultTasks && template) {
    for (const t of template.defaultTasks) {
      await createTask({
        projectId: project.id,
        title: t.title,
        type: t.type,
        estimatedHours:
          t.estimatedHours ??
          (t.type === 'buffer' ? project.bufferHours : t.type === 'quality_inspection' ? project.projectedQiHours : undefined),
        dueDate: t.type === 'quality_inspection' ? project.originalDueDate : undefined,
        assigneeId: t.type === 'quality_inspection' ? project.qiOwnerId : undefined,
        silent: true,
      })
    }
  }
  for (const memberId of new Set([project.ownerId, project.leadId, ...project.developerIds, ...project.designerIds])) {
    if (memberId)
      notify({
        userId: memberId,
        type: 'task_assigned',
        title: `${actorName()} added you to ${project.key}`,
        body: project.title,
        ref: { kind: 'project', id: project.id },
      })
  }
  return project
}

const PROJECT_ROLE_FIELDS: Partial<Record<keyof Project, string>> = {
  ownerId: 'project owner',
  accountManagerId: 'account manager',
  leadId: 'lead',
  qiOwnerId: 'QI owner',
  croOwnerId: 'CRO owner',
  abOwnerId: 'A/B owner',
}

export async function updateProject(id: ID, updates: Partial<Project>): Promise<Project> {
  const prev = db.get().projects.find((p) => p.id === id)
  if (!prev) throw new NotFoundError(`Project ${id} not found`)
  const patch: Partial<Project> = { ...updates, updatedAt: nowIso() }
  if (updates.status && isProjectClosed(updates.status) && !isProjectClosed(prev.status) && !updates.completedAt) patch.completedAt = toISODate(now())
  if (updates.status && !isProjectClosed(updates.status) && isProjectClosed(prev.status)) patch.completedAt = undefined

  if (updates.status && updates.status !== prev.status) patch.statusChangedAt = patch.updatedAt

  db.set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))

  if (updates.status && updates.status !== prev.status) {
    logActivity({ type: 'status_changed', projectId: id, clientId: prev.clientId, meta: { field: 'project', from: prev.status, to: updates.status } })
    for (const uidTo of new Set([prev.ownerId, prev.accountManagerId, prev.leadId])) {
      if (uidTo)
        notify({ userId: uidTo, type: 'status_changed', title: `${prev.key} moved to a new status`, body: prev.title, ref: { kind: 'project', id } })
    }
  }
  if (updates.priority && updates.priority !== prev.priority)
    logActivity({ type: 'priority_changed', projectId: id, meta: { from: prev.priority, to: updates.priority } })
  for (const field of ['originalDueDate', 'revisedDueDate'] as const) {
    if (field in updates && updates[field] !== prev[field])
      logActivity({ type: 'due_date_changed', projectId: id, meta: { field, from: prev[field] ?? null, to: updates[field] ?? null } })
  }
  for (const [field, label] of Object.entries(PROJECT_ROLE_FIELDS)) {
    const key = field as keyof Project
    if (key in updates && updates[key] !== prev[key]) {
      logActivity({ type: 'assignee_changed', projectId: id, meta: { role: label, from: (prev[key] as string) ?? null, to: (updates[key] as string) ?? null } })
      if (updates[key])
        notify({ userId: updates[key] as string, type: 'task_assigned', title: `You are now ${label} on ${prev.key}`, body: prev.title, ref: { kind: 'project', id } })
    }
  }
  const editedFields = (['title', 'description', 'requirements', 'releaseNotes', 'clientPortalUrl', 'projectedDevHours', 'bufferHours', 'projectedQiHours', 'daysNeeded', 'percentPushedToQi', 'developerIds', 'designerIds', 'type', 'tags', 'customFields', 'startDate', 'pmStatus', 'nonBillable', 'githubPrUrl', 'bugVideoUrl', 'qiTestDate', 'relativePotentialRevenue', 'automation'] as const).filter(
    (f) => f in updates && JSON.stringify(updates[f]) !== JSON.stringify(prev[f]),
  )
  if (editedFields.length)
    logActivity({ type: 'project_updated', projectId: id, meta: { field: editedFields.map(humanField).join(', ') } })

  return db.get().projects.find((p) => p.id === id)!
}

function humanField(f: string) {
  return (
    {
      projectedDevHours: 'projected dev hours', bufferHours: 'buffer hours', projectedQiHours: 'projected QI hours',
      daysNeeded: 'days needed', percentPushedToQi: '% pushed to QI', developerIds: 'developers', designerIds: 'designers',
      releaseNotes: 'release notes', clientPortalUrl: 'client portal link', customFields: 'custom fields',
      startDate: 'start date', pmStatus: 'PM status', nonBillable: 'non-billable', githubPrUrl: 'GitHub PR link',
      bugVideoUrl: 'bug video', qiTestDate: 'QI test date', relativePotentialRevenue: 'relative potential revenue',
      automation: 'automation fields',
    } as Record<string, string>
  )[f] ?? f
}

export async function archiveProject(id: ID, archived = true) {
  await updateProject(id, { archived })
  logActivity({ type: 'project_archived', projectId: id, meta: { to: archived ? 'archived' : 'restored' } })
}

export async function duplicateProject(id: ID): Promise<Project> {
  const { projects, tasks } = db.get()
  const src = projects.find((p) => p.id === id)
  if (!src) throw new NotFoundError(`Project ${id} not found`)
  const ts = nowIso()
  const copy: Project = {
    ...structuredClone(src),
    id: uid('p'),
    key: nextProjectKey(src.clientId),
    title: `${src.title} (copy)`,
    status: 'project_setup',
    pmStatus: 'not_reviewed',
    completedAt: undefined,
    createdAt: ts,
    updatedAt: ts,
    archived: false,
    notionSourceId: undefined,
    requirements: src.requirements.map((r) => ({ ...r, id: uid('r'), done: false })),
  }
  db.set((s) => ({ projects: [copy, ...s.projects] }))
  // Copy top-level tasks and subtasks, reset to backlog without hours logged.
  const idMap = new Map<string, string>()
  const srcTasks = tasks.filter((t) => t.projectId === id).sort((a, b) => (a.parentTaskId ? 1 : 0) - (b.parentTaskId ? 1 : 0))
  const cloned: Task[] = srcTasks.map((t) => {
    const newId = uid('t')
    idMap.set(t.id, newId)
    return { ...t, id: newId, projectId: copy.id, key: t.key.replace(src.key, copy.key), status: 'backlog', actualHours: undefined, completedAt: undefined, createdAt: ts, updatedAt: ts, notionSourceId: undefined }
  })
  for (const t of cloned) if (t.parentTaskId) t.parentTaskId = idMap.get(t.parentTaskId)
  db.set((s) => ({ tasks: [...s.tasks, ...cloned] }))
  logActivity({ type: 'project_created', projectId: copy.id, clientId: copy.clientId, meta: { duplicatedFrom: src.key } })
  return copy
}

/**
 * Deletes a project and its dependent records (tasks, comments, links, QI records, bugs,
 * notifications). Experiments keep existing but lose the link.
 * TODO(BACKEND): Prefer soft-delete with retention on the server; hard delete should be
 * admin-only and audited.
 */
export async function deleteProject(id: ID) {
  db.set((s) => {
    const taskIds = new Set(s.tasks.filter((t) => t.projectId === id).map((t) => t.id))
    return {
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      comments: s.comments.filter((c) => c.projectId !== id && !(c.taskId && taskIds.has(c.taskId))),
      attachments: s.attachments.filter((a) => a.projectId !== id),
      qiRecords: s.qiRecords.filter((q) => q.projectId !== id),
      qiTimeEntries: s.qiTimeEntries.filter((q) => q.projectId !== id),
      bugs: s.bugs.filter((b) => b.projectId !== id),
      activity: s.activity.filter((a) => a.projectId !== id),
      notifications: s.notifications.filter(
        (n) => !((n.ref.kind === 'project' && n.ref.id === id) || (n.ref.kind === 'task' && taskIds.has(n.ref.id))),
      ),
      croExperiments: s.croExperiments.map((c) =>
        c.projectId === id ? { ...c, projectId: undefined, linkedTaskIds: c.linkedTaskIds.filter((t) => !taskIds.has(t)) } : c,
      ),
      abTests: s.abTests.map((a) => ({ ...a, linkedProjectIds: a.linkedProjectIds.filter((p) => p !== id) })),
    }
  })
}

// ───────────────────────────── Tasks ─────────────────────────────

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  await delay()
  const { tasks, projects } = db.get()
  const pm = byId(projects)
  return tasks.filter((t) => matchTask(t, filters, pm))
}

export type CreateTaskInput = Pick<Task, 'projectId' | 'title'> &
  Partial<Omit<Task, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'order'>> & { silent?: boolean }

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { silent, ...rest } = input
  const { tasks, projects } = db.get()
  const project = projects.find((p) => p.id === input.projectId)
  if (!project) throw new NotFoundError('Project not found')
  const siblings = tasks.filter((t) => t.projectId === input.projectId && t.parentTaskId === input.parentTaskId)
  const parent = input.parentTaskId ? tasks.find((t) => t.id === input.parentTaskId) : undefined
  const key = parent
    ? `${parent.key}.${siblings.length + 1}`
    : `${project.key}-${Math.max(0, ...tasks.filter((t) => t.projectId === project.id && !t.parentTaskId).map((t) => Number(t.key.split('-').pop()) || 0)) + 1}`
  const ts = nowIso()
  const task: Task = {
    description: '',
    status: 'backlog',
    priority: 'medium',
    type: parent?.type ?? 'development',
    reporterId: actor(),
    ...rest,
    id: uid('t'),
    key,
    createdAt: ts,
    updatedAt: ts,
    order: Math.max(0, ...tasks.map((t) => t.order)) + 1,
  }
  db.set((s) => ({ tasks: [...s.tasks, task] }))
  logActivity({ type: 'task_created', projectId: task.projectId, taskId: task.id, meta: { title: task.title, parent: parent?.id } })
  if (task.assigneeId && !silent)
    notify({ userId: task.assigneeId, type: 'task_assigned', title: `${actorName()} assigned you a task`, body: `${task.title} (${task.key})`, ref: { kind: 'task', id: task.id } })
  return task
}

export async function updateTask(id: ID, updates: Partial<Task>): Promise<Task> {
  const { tasks, projects } = db.get()
  const prev = tasks.find((t) => t.id === id)
  if (!prev) throw new NotFoundError(`Task ${id} not found`)
  const project = projects.find((p) => p.id === prev.projectId)
  const patch: Partial<Task> = { ...updates, updatedAt: nowIso() }
  if (updates.status === 'done' && prev.status !== 'done') patch.completedAt = nowIso()
  if (updates.status && updates.status !== 'done' && prev.status === 'done') patch.completedAt = undefined

  db.set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))

  const base = { projectId: prev.projectId, taskId: id }
  if (updates.status && updates.status !== prev.status) {
    if (updates.status === 'done') logActivity({ ...base, type: 'task_completed', meta: {} })
    else logActivity({ ...base, type: 'status_changed', meta: { field: 'task', from: prev.status, to: updates.status } })

    if (updates.status === 'ready_for_qi') submitToQI(id)
    if (prev.assigneeId)
      notify({ userId: prev.assigneeId, type: 'status_changed', title: `${prev.key} status changed`, body: prev.title, ref: { kind: 'task', id } })
  }
  if ('assigneeId' in updates && updates.assigneeId !== prev.assigneeId) {
    logActivity({ ...base, type: 'assignee_changed', meta: { from: prev.assigneeId ?? null, to: updates.assigneeId ?? null } })
    if (updates.assigneeId)
      notify({ userId: updates.assigneeId, type: 'task_assigned', title: `${actorName()} assigned you a task`, body: `${prev.title} (${prev.key})`, ref: { kind: 'task', id } })
  }
  if ('dueDate' in updates && updates.dueDate !== prev.dueDate)
    logActivity({ ...base, type: 'due_date_changed', meta: { from: prev.dueDate ?? null, to: updates.dueDate ?? null } })
  if (updates.priority && updates.priority !== prev.priority)
    logActivity({ ...base, type: 'priority_changed', meta: { from: prev.priority, to: updates.priority } })
  if ('actualHours' in updates && updates.actualHours !== prev.actualHours)
    logActivity({ ...base, type: 'hours_logged', meta: { from: prev.actualHours ?? 0, to: updates.actualHours ?? 0 } })

  if (project) db.set((s) => ({ projects: s.projects.map((p) => (p.id === project.id ? { ...p, updatedAt: nowIso() } : p)) }))
  return db.get().tasks.find((t) => t.id === id)!
}

/** Deletes a task with its subtasks and dependent comments / QI records. */
export async function deleteTask(id: ID) {
  const { tasks } = db.get()
  const target = tasks.find((t) => t.id === id)
  if (!target) return
  const ids = new Set([id])
  let grew = true
  while (grew) {
    grew = false
    for (const t of tasks) if (t.parentTaskId && ids.has(t.parentTaskId) && !ids.has(t.id)) { ids.add(t.id); grew = true }
  }
  db.set((s) => ({
    tasks: s.tasks.filter((t) => !ids.has(t.id)),
    comments: s.comments.filter((c) => !(c.taskId && ids.has(c.taskId))),
    qiRecords: s.qiRecords.filter((q) => !ids.has(q.taskId)),
    bugs: s.bugs.map((b) => (b.taskId && ids.has(b.taskId) ? { ...b, taskId: undefined } : b)),
    notifications: s.notifications.filter((n) => !(n.ref.kind === 'task' && ids.has(n.ref.id))),
    croExperiments: s.croExperiments.map((c) => ({ ...c, linkedTaskIds: c.linkedTaskIds.filter((t) => !ids.has(t)) })),
  }))
  logActivity({ type: 'task_deleted', projectId: target.projectId, meta: { title: target.title } })
}

// ───────────────────────────── Comments ─────────────────────────────

export async function getComments(target: { projectId?: ID; taskId?: ID }): Promise<Comment[]> {
  await delay()
  return db.get().comments.filter((c) => (target.taskId ? c.taskId === target.taskId : c.projectId === target.projectId))
}

/**
 * Creates a comment, optionally with a structured developer handoff.
 * TODO(BACKEND): Persist `handoff` as part of the comment record (JSON column or child table).
 * TODO(GIT-INTEGRATION): Resolve the branch against GitHub (existence, open PR, CI status).
 * TODO(SHOPIFY-THEMES): Verify the theme ID / preview URL via the Shopify Admin API for the client store.
 */
export async function createComment(
  input: Pick<Comment, 'body'> & Partial<Pick<Comment, 'projectId' | 'taskId' | 'mentionIds' | 'handoff'>>,
): Promise<Comment> {
  const { tasks, projects } = db.get()
  const task = input.taskId ? tasks.find((t) => t.id === input.taskId) : undefined
  const projectId = input.projectId ?? task?.projectId
  const comment: Comment = {
    id: uid('cm'),
    authorId: actor(),
    body: input.body.trim(),
    createdAt: nowIso(),
    projectId,
    taskId: input.taskId,
    mentionIds: input.mentionIds ?? [],
    handoff: input.handoff,
  }
  db.set((s) => ({ comments: [...s.comments, comment] }))
  logActivity({ type: 'comment_added', projectId, taskId: input.taskId, meta: { commentId: comment.id } })

  const project = projects.find((p) => p.id === projectId)
  const ref = task ? ({ kind: 'task', id: task.id } as const) : ({ kind: 'project', id: projectId! } as const)
  const where = task ? task.key : project?.key ?? ''
  if (comment.handoff?.qiSteps.length && project?.qiOwnerId)
    notify({
      userId: project.qiOwnerId,
      type: 'comment',
      title: `${actorName()} shared ${comment.handoff.qiSteps.length} QI steps on ${where}`,
      body: comment.handoff.gitBranch?.name ?? comment.handoff.theme?.name ?? project.title,
      ref,
    })
  for (const m of comment.mentionIds)
    notify({ userId: m, type: 'mention', title: `${actorName()} mentioned you on ${where}`, body: comment.body.slice(0, 120), ref })
  const watcher = task?.assigneeId ?? project?.ownerId
  if (watcher && !comment.mentionIds.includes(watcher))
    notify({ userId: watcher, type: 'comment', title: `${actorName()} commented on ${where}`, body: comment.body.slice(0, 120), ref })
  return comment
}

export async function deleteComment(id: ID) {
  db.set((s) => ({ comments: s.comments.filter((c) => c.id !== id) }))
}

// ───────────────────────────── Activity / notifications ─────────────────────────────

/** Activity for a project, task, or client (by any related id). */
export async function getActivity(recordId: ID): Promise<ActivityEvent[]> {
  await delay()
  return db.get().activity.filter((a) => a.projectId === recordId || a.taskId === recordId || a.clientId === recordId)
}

export async function getNotifications(userId: ID): Promise<Notification[]> {
  await delay()
  return db.get().notifications.filter((n) => n.userId === userId)
}

export async function updateNotification(id: ID, updates: Partial<Pick<Notification, 'read'>>) {
  db.set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, ...updates } : n)) }))
}

export async function markAllNotificationsRead(userId: ID) {
  db.set((s) => ({ notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }))
}

// ───────────────────────────── Links & files ─────────────────────────────

/**
 * TODO(FILE-STORAGE): Connect secure file uploads and downloads to the approved storage provider.
 * Uploads should go to signed URLs (S3/GCS/R2), with virus scanning and per-project access control.
 */
export async function createAttachment(input: Omit<Attachment, 'id' | 'createdAt' | 'addedById'>): Promise<Attachment> {
  const a: Attachment = { ...input, id: uid('at'), createdAt: nowIso(), addedById: actor() }
  db.set((s) => ({ attachments: [a, ...s.attachments] }))
  logActivity({ type: 'link_added', projectId: a.projectId, meta: { title: a.title } })
  return a
}

export async function updateAttachment(id: ID, updates: Partial<Attachment>) {
  db.set((s) => ({ attachments: s.attachments.map((a) => (a.id === id ? { ...a, ...updates } : a)) }))
}

export async function deleteAttachment(id: ID) {
  const a = db.get().attachments.find((x) => x.id === id)
  db.set((s) => ({ attachments: s.attachments.filter((x) => x.id !== id) }))
  if (a) logActivity({ type: 'link_removed', projectId: a.projectId, meta: { title: a.title } })
}

// ───────────────────────────── QI ─────────────────────────────

/** Creates the next QI round for a task that moved to "Ready for QI". */
function submitToQI(taskId: ID) {
  const { tasks, projects, qiRecords } = db.get()
  const task = tasks.find((t) => t.id === taskId)!
  const project = projects.find((p) => p.id === task.projectId)
  const open = qiRecords.find((q) => q.taskId === taskId && (q.status === 'awaiting' || q.status === 'in_progress'))
  if (open) return open
  const round = Math.max(0, ...qiRecords.filter((q) => q.taskId === taskId).map((q) => q.round)) + 1
  const rec: QIRecord = {
    id: uid('qi'), taskId, projectId: task.projectId, inspectorId: project?.qiOwnerId, status: 'awaiting', round,
    submittedById: actor(), submittedAt: nowIso(), notes: '', checklist: makeChecklist(), bugIds: [], devices: [],
  }
  db.set((s) => ({ qiRecords: [rec, ...s.qiRecords] }))
  if (project?.qiOwnerId)
    notify({ userId: project.qiOwnerId, type: 'status_changed', title: `${task.title} is ready for QI`, body: `${task.key} · round ${round}`, ref: { kind: 'task', id: taskId } })
  return rec
}

export async function updateQIRecord(id: ID, updates: Partial<QIRecord>) {
  db.set((s) => ({ qiRecords: s.qiRecords.map((q) => (q.id === id ? { ...q, ...updates } : q)) }))
  return db.get().qiRecords.find((q) => q.id === id)!
}

export async function startInspection(id: ID) {
  const rec = await updateQIRecord(id, { status: 'in_progress', startedAt: nowIso(), inspectorId: actor() })
  logActivity({ type: 'qi_started', projectId: rec.projectId, taskId: rec.taskId, meta: { round: rec.round } })
  return rec
}

/**
 * Records an inspection outcome. Passing moves the task to Done; failing or requesting
 * changes returns it to In progress and notifies the assignee.
 */
export async function recordQIResult(id: ID, result: Extract<QIStatus, 'passed' | 'failed' | 'changes_requested'>, notes: string) {
  const rec = await updateQIRecord(id, { status: result, notes, completedAt: nowIso(), inspectorId: actor() })
  logActivity({ type: 'qi_result', projectId: rec.projectId, taskId: rec.taskId, meta: { result, round: rec.round } })
  const task = db.get().tasks.find((t) => t.id === rec.taskId)
  if (!task) return rec
  if (result === 'passed') {
    if (task.status !== 'done') await updateTask(task.id, { status: 'done' })
  } else {
    db.set((s) => ({ tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, status: 'in_progress', updatedAt: nowIso() } : t)) }))
    logActivity({ type: 'status_changed', projectId: task.projectId, taskId: task.id, meta: { field: 'task', from: task.status, to: 'in_progress' } })
    if (task.assigneeId)
      notify({ userId: task.assigneeId, type: 'qi_returned', title: 'Task returned from QI', body: `${task.title} — ${result === 'failed' ? 'failed' : 'changes requested'}`, ref: { kind: 'task', id: task.id } })
  }
  return rec
}

/**
 * QI Start / QI End buttons on the project card. One running session per project.
 * TODO(TIME-DOCTOR): Mirror QI sessions into Time Doctor so tracked QI time is billable.
 */
export async function startQiTimer(projectId: ID): Promise<QITimeEntry> {
  const running = db.get().qiTimeEntries.find((e) => e.projectId === projectId && !e.endedAt)
  if (running) return running
  const entry: QITimeEntry = { id: uid('qit'), projectId, inspectorId: actor(), startedAt: nowIso() }
  db.set((s) => ({ qiTimeEntries: [entry, ...s.qiTimeEntries] }))
  logActivity({ type: 'qi_started', projectId, meta: { timer: 'start' } })
  return entry
}

export async function stopQiTimer(projectId: ID): Promise<QITimeEntry | undefined> {
  const running = db.get().qiTimeEntries.find((e) => e.projectId === projectId && !e.endedAt)
  if (!running) return undefined
  const endedAt = nowIso()
  db.set((s) => ({ qiTimeEntries: s.qiTimeEntries.map((e) => (e.id === running.id ? { ...e, endedAt } : e)) }))
  const hours = (new Date(endedAt).getTime() - new Date(running.startedAt).getTime()) / 3_600_000
  logActivity({ type: 'hours_logged', projectId, meta: { timer: 'end', duration: formatDuration(hours) } })
  return { ...running, endedAt }
}

// ───────────────────────────── Bugs ─────────────────────────────

export async function createBug(input: Omit<Bug, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'reporterId'>): Promise<Bug> {
  const { projects, clients, bugs } = db.get()
  const project = projects.find((p) => p.id === input.projectId)
  const code = clients.find((c) => c.id === project?.clientId)?.code ?? 'BUG'
  const n = Math.max(0, ...bugs.filter((b) => b.key.startsWith(`${code}-B`)).map((b) => Number(b.key.split('-B')[1]) || 0)) + 1
  const ts = nowIso()
  const bug: Bug = { ...input, id: uid('b'), key: `${code}-B${n}`, createdAt: ts, updatedAt: ts, reporterId: actor() }
  db.set((s) => ({
    bugs: [bug, ...s.bugs],
    qiRecords: input.qiRecordId ? s.qiRecords.map((q) => (q.id === input.qiRecordId ? { ...q, bugIds: [...q.bugIds, bug.id] } : q)) : s.qiRecords,
  }))
  logActivity({ type: 'bug_created', projectId: bug.projectId, taskId: bug.taskId, meta: { title: bug.title } })
  if (bug.assigneeId)
    notify({ userId: bug.assigneeId, type: 'task_assigned', title: `New ${bug.severity} bug assigned: ${bug.key}`, body: bug.title, ref: { kind: 'bug', id: bug.id } })
  return bug
}

export async function updateBug(id: ID, updates: Partial<Bug>) {
  db.set((s) => ({ bugs: s.bugs.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: nowIso() } : b)) }))
}

// ───────────────────────────── CRO & A/B ─────────────────────────────

export async function createCROExperiment(input: Omit<CROExperiment, 'id' | 'createdAt' | 'updatedAt'>) {
  const ts = nowIso()
  const rec: CROExperiment = { ...input, id: uid('cro'), createdAt: ts, updatedAt: ts }
  db.set((s) => ({ croExperiments: [rec, ...s.croExperiments] }))
  return rec
}

export async function updateCROExperiment(id: ID, updates: Partial<CROExperiment>) {
  db.set((s) => ({ croExperiments: s.croExperiments.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: nowIso() } : c)) }))
}

/** TODO(ANALYTICS): Connect A/B test metrics to the approved analytics provider. */
export async function createABTest(input: Omit<ABTestExperiment, 'id' | 'key' | 'createdAt' | 'updatedAt'>) {
  const { clients, abTests } = db.get()
  const code = clients.find((c) => c.id === input.clientId)?.code ?? 'AB'
  const n = Math.max(0, ...abTests.filter((a) => a.key.startsWith(`${code}-AB`)).map((a) => Number(a.key.split('-AB-')[1]) || 0)) + 1
  const ts = nowIso()
  const rec: ABTestExperiment = { ...input, id: uid('ab'), key: `${code}-AB-${n}`, createdAt: ts, updatedAt: ts }
  db.set((s) => ({ abTests: [rec, ...s.abTests] }))
  return rec
}

export async function updateABTest(id: ID, updates: Partial<ABTestExperiment>) {
  db.set((s) => ({ abTests: s.abTests.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: nowIso() } : a)) }))
}

// ───────────────────────────── Users / admin ─────────────────────────────

/** TODO(RBAC): Role changes must be an audited, admin-only server operation. */
export async function updateUser(id: ID, updates: Partial<User>) {
  db.set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)) }))
}

export function resetDemoData() {
  db.reset()
}
