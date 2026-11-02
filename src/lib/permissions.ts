import type { Role } from '@/types'
import { roleDef } from './workflow'

/**
 * Central permission matrix for the prototype UI.
 *
 * TODO(RBAC): Enforce permissions on the backend; frontend checks are only for UI behavior.
 * The role switcher in the user menu exists purely so reviewers can preview each role.
 * A real deployment must derive the role from the authenticated session (see TODO(AUTH))
 * and every mutating API endpoint must re-check authorisation server-side, including
 * record-level rules (e.g. "developers may only edit tasks on projects they are assigned to").
 */

export type Permission =
  | 'project.create'
  | 'project.edit'
  | 'project.delete'
  | 'project.archive'
  | 'project.changeStatus'
  | 'project.assign'
  | 'project.editDates'
  | 'task.create'
  | 'task.edit'
  | 'task.delete'
  | 'task.changeStatus'
  | 'task.assign'
  | 'task.logHours'
  | 'subtask.create'
  | 'comment.create'
  | 'link.manage'
  | 'qi.inspect'
  | 'bug.create'
  | 'bug.edit'
  | 'cro.manage'
  | 'ab.manage'
  | 'client.edit'
  | 'admin.access'
  | 'admin.users'
  | 'admin.templates'
  | 'admin.workflows'

const ALL: Permission[] = [
  'project.create', 'project.edit', 'project.delete', 'project.archive', 'project.changeStatus',
  'project.assign', 'project.editDates', 'task.create', 'task.edit', 'task.delete', 'task.changeStatus',
  'task.assign', 'task.logHours', 'subtask.create', 'comment.create', 'link.manage', 'qi.inspect',
  'bug.create', 'bug.edit', 'cro.manage', 'ab.manage', 'client.edit', 'admin.access', 'admin.users',
  'admin.templates', 'admin.workflows',
]

const COLLABORATE: Permission[] = ['comment.create', 'link.manage']

export const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  admin: ALL,
  account_manager: [
    ...COLLABORATE,
    'project.create', 'project.edit', 'project.archive', 'project.changeStatus', 'project.assign',
    'project.editDates', 'task.create', 'task.edit', 'task.changeStatus', 'task.assign', 'task.delete',
    'subtask.create', 'bug.create', 'client.edit',
  ],
  lead: [
    ...COLLABORATE,
    'project.edit', 'project.changeStatus', 'project.assign', 'task.create', 'task.edit', 'task.delete',
    'task.changeStatus', 'task.assign', 'task.logHours', 'subtask.create', 'bug.create', 'bug.edit',
  ],
  developer: [...COLLABORATE, 'task.edit', 'task.changeStatus', 'task.logHours', 'subtask.create', 'bug.edit'],
  designer: [...COLLABORATE, 'task.edit', 'task.changeStatus', 'task.logHours', 'subtask.create'],
  qi: [...COLLABORATE, 'task.changeStatus', 'task.logHours', 'qi.inspect', 'bug.create', 'bug.edit'],
  cro: [...COLLABORATE, 'task.create', 'task.edit', 'task.changeStatus', 'task.logHours', 'subtask.create', 'cro.manage'],
  ab_testing: [...COLLABORATE, 'task.create', 'task.edit', 'task.changeStatus', 'task.logHours', 'subtask.create', 'ab.manage'],
}

/**
 * How a control behaves when the role lacks permission.
 * - `hide`: the action is irrelevant to the role (e.g. "New project" for developers).
 * - `disable`: the action is visible for context but locked, with an explanation tooltip.
 */
export type RestrictionMode = 'hide' | 'disable'

export function can(role: Role, permission: Permission) {
  return PERMISSION_MATRIX[role].includes(permission)
}

export function deniedReason(role: Role, permission: Permission) {
  const label = roleDef(role).label
  const action = PERMISSION_LABELS[permission] ?? 'perform this action'
  return `${label} role can't ${action} in this prototype`
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  'project.create': 'create projects',
  'project.edit': 'edit project details',
  'project.delete': 'delete projects',
  'project.archive': 'archive projects',
  'project.changeStatus': 'change project status',
  'project.assign': 'assign project team members',
  'project.editDates': 'change project dates',
  'task.create': 'create tasks',
  'task.edit': 'edit tasks',
  'task.delete': 'delete tasks',
  'task.changeStatus': 'change task status',
  'task.assign': 'assign tasks',
  'task.logHours': 'log hours',
  'subtask.create': 'create subtasks',
  'comment.create': 'comment',
  'link.manage': 'manage links',
  'qi.inspect': 'record QI results',
  'bug.create': 'create bugs',
  'bug.edit': 'update bugs',
  'cro.manage': 'manage CRO experiments',
  'ab.manage': 'manage A/B tests',
  'client.edit': 'edit client details',
  'admin.access': 'access administration',
  'admin.users': 'manage users and roles',
  'admin.templates': 'manage project templates',
  'admin.workflows': 'manage workflows',
}

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: 'Projects', permissions: ['project.create', 'project.edit', 'project.changeStatus', 'project.assign', 'project.editDates', 'project.archive', 'project.delete'] },
  { label: 'Tasks', permissions: ['task.create', 'subtask.create', 'task.edit', 'task.changeStatus', 'task.assign', 'task.logHours', 'task.delete'] },
  { label: 'Collaboration', permissions: ['comment.create', 'link.manage'] },
  { label: 'Quality & growth', permissions: ['qi.inspect', 'bug.create', 'bug.edit', 'cro.manage', 'ab.manage'] },
  { label: 'Administration', permissions: ['client.edit', 'admin.access', 'admin.users', 'admin.templates', 'admin.workflows'] },
]
