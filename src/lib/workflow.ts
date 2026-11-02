import {
  Archive,
  Bug as BugIcon,
  CircleCheckBig,
  CirclePlay,
  ClipboardCheck,
  CloudUpload,
  CodeXml,
  Eye,
  FlaskConical,
  FolderKanban,
  Hammer,
  Handshake,
  Hourglass,
  Layers,
  LifeBuoy,
  Lightbulb,
  LineChart,
  PackageCheck,
  Palette,
  Pause,
  PencilRuler,
  Rocket,
  ScanSearch,
  Send,
  Shuffle,
  Timer,
  UserCheck,
  UserCog,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type {
  ABTestStatus,
  BugSeverity,
  BugStatus,
  ClientStatus,
  CROStatus,
  Department,
  PMStatus,
  Priority,
  ProjectStatus,
  ProjectType,
  QIStatus,
  Role,
  StatusDefinition,
  TaskStatus,
  TaskType,
  Tone,
} from '@/types'

/**
 * Workflow configuration. Status lists are seeded into the mock database so the
 * Workflows & Statuses admin screen can display them; views read categories rather than
 * individual statuses so workflows can be customised later.
 *
 * TODO(BACKEND): Load workflow/status configuration per workspace (and per project type)
 * from the API instead of these defaults.
 */

/**
 * Project statuses carried over from the Notion "Status" property, ordered by delivery
 * lifecycle. Notion's emojis are replaced by Lucide icons (PROJECT_STATUS_ICON).
 * TODO(NOTION-MIGRATION): Map Notion status option names to these ids during import.
 */
export const DEFAULT_PROJECT_STATUSES: StatusDefinition<ProjectStatus>[] = [
  { id: 'idea', label: 'Idea', category: 'todo', tone: 'gray', description: 'Captured opportunity, not yet scoped' },
  { id: 'project_setup', label: 'Project Setup', category: 'todo', tone: 'orange', description: 'Card, requirements and estimates being set up' },
  { id: 'lead_review', label: 'Lead Review', category: 'todo', tone: 'blue', description: 'Lead reviewing scope, estimates and task breakdown' },
  { id: 'am_review', label: 'AM Review', category: 'todo', tone: 'gray', description: 'Account manager confirming scope with the client' },
  { id: 'ready_to_start', label: 'Ready To Start', category: 'todo', tone: 'teal', description: 'Approved and scheduled, waiting to begin' },
  { id: 'in_progress', label: 'In Progress', category: 'active', tone: 'blue', description: 'Work is underway' },
  { id: 'peer_review', label: 'Peer Review', category: 'review', tone: 'violet', description: 'Internal code or design review' },
  { id: 'quality_inspection', label: 'Quality Inspection', category: 'review', tone: 'amber', description: 'QI team inspecting the work' },
  { id: 'issues_found', label: 'Issues Found', category: 'active', tone: 'red', description: 'QI or client found issues to fix' },
  { id: 'fixing_issues', label: 'Fixing Issues', category: 'active', tone: 'orange', description: 'Developer working through reported issues' },
  { id: 'ready_for_client', label: 'Ready For Client', category: 'review', tone: 'pink', description: 'Ready to share with the client' },
  { id: 'client_reviewing', label: 'Client Is Reviewing', category: 'review', tone: 'amber', description: 'Waiting on client feedback or approval' },
  { id: 'prep_for_deployment', label: 'Prep for Deployment', category: 'active', tone: 'teal', description: 'Preparing release branch and checklist' },
  { id: 'ready_to_deploy', label: 'Ready to Deploy', category: 'review', tone: 'violet', description: 'Approved and waiting for the release window' },
  { id: 'deployment', label: 'Deployment', category: 'active', tone: 'violet', description: 'Being published to the live theme' },
  { id: 'active_ab_test', label: 'Active AB Test', category: 'active', tone: 'pink', description: 'Live as an A/B experiment' },
  { id: 'need_support', label: 'Need Support', category: 'paused', tone: 'red', description: 'Blocked — needs help or input to continue' },
  { id: 'pause', label: 'Pause', category: 'paused', tone: 'gray', description: 'Intentionally paused' },
  { id: 'done', label: 'Done', category: 'done', tone: 'green', description: 'Delivered and released' },
  { id: 'archive_soon', label: 'Archive Soon', category: 'done', tone: 'orange', description: 'Complete; to be archived after final checks' },
  { id: 'archive', label: 'Archive', category: 'done', tone: 'gray', description: 'Closed and archived' },
]

export const PROJECT_STATUS_ICON: Record<ProjectStatus, LucideIcon> = {
  idea: Lightbulb,
  project_setup: PencilRuler,
  lead_review: UserCheck,
  am_review: UserCog,
  ready_to_start: CirclePlay,
  in_progress: Hammer,
  peer_review: ScanSearch,
  quality_inspection: ClipboardCheck,
  issues_found: BugIcon,
  fixing_issues: Wrench,
  ready_for_client: Send,
  client_reviewing: Eye,
  prep_for_deployment: PackageCheck,
  ready_to_deploy: Rocket,
  deployment: CloudUpload,
  active_ab_test: FlaskConical,
  need_support: LifeBuoy,
  pause: Pause,
  done: CircleCheckBig,
  archive_soon: Hourglass,
  archive: Archive,
}

/** Phase groupings used to organise status pickers and column presets. */
export const PROJECT_STATUS_GROUPS: { label: string; statuses: ProjectStatus[] }[] = [
  { label: 'Planning', statuses: ['idea', 'project_setup', 'lead_review', 'am_review', 'ready_to_start'] },
  { label: 'Build & QI', statuses: ['in_progress', 'peer_review', 'quality_inspection', 'issues_found', 'fixing_issues'] },
  { label: 'Client & release', statuses: ['ready_for_client', 'client_reviewing', 'prep_for_deployment', 'ready_to_deploy', 'deployment', 'active_ab_test'] },
  { label: 'Paused', statuses: ['need_support', 'pause'] },
  { label: 'Closed', statuses: ['done', 'archive_soon', 'archive'] },
]

export const DEFAULT_TASK_STATUSES: StatusDefinition<TaskStatus>[] = [
  { id: 'backlog', label: 'Backlog', category: 'todo', tone: 'gray', description: 'Captured, not yet ready' },
  { id: 'ready', label: 'Ready', category: 'todo', tone: 'violet', description: 'Scoped and ready to pick up' },
  { id: 'in_progress', label: 'In progress', category: 'active', tone: 'blue', description: 'Being worked on' },
  { id: 'in_review', label: 'In review', category: 'review', tone: 'teal', description: 'Code or design review' },
  { id: 'ready_for_qi', label: 'Ready for QI', category: 'review', tone: 'amber', description: 'Handed to quality inspection' },
  { id: 'done', label: 'Done', category: 'done', tone: 'green', description: 'Complete' },
  { id: 'blocked', label: 'Blocked', category: 'paused', tone: 'red', description: 'Waiting on a dependency' },
  { id: 'on_hold', label: 'On hold', category: 'paused', tone: 'orange', description: 'Intentionally paused' },
  { id: 'cancelled', label: 'Cancelled', category: 'cancelled', tone: 'gray', description: 'No longer needed' },
]

/** Main left-to-right lifecycle used by Kanban boards. Side statuses are shown after. */
export const TASK_LIFECYCLE: TaskStatus[] = ['backlog', 'ready', 'in_progress', 'in_review', 'ready_for_qi', 'done']
export const TASK_SIDE_STATUSES: TaskStatus[] = ['blocked', 'on_hold', 'cancelled']
/** Default status-board columns: every project status. */
export const PROJECT_BOARD_COLUMNS: ProjectStatus[] = DEFAULT_PROJECT_STATUSES.map((s) => s.id)

const projectStatusMap = new Map(DEFAULT_PROJECT_STATUSES.map((s) => [s.id, s]))
const taskStatusMap = new Map(DEFAULT_TASK_STATUSES.map((s) => [s.id, s]))

export function projectStatusDef(id: ProjectStatus) {
  return projectStatusMap.get(id) ?? DEFAULT_PROJECT_STATUSES[0]
}
export function taskStatusDef(id: TaskStatus) {
  return taskStatusMap.get(id) ?? DEFAULT_TASK_STATUSES[0]
}

export function isTaskClosed(status: TaskStatus) {
  const c = taskStatusDef(status).category
  return c === 'done' || c === 'cancelled'
}
export function isProjectClosed(status: ProjectStatus) {
  const c = projectStatusDef(status).category
  return c === 'done' || c === 'cancelled'
}

/** Weight used for status-based task progress when a task has no subtasks. */
export const TASK_PROGRESS_WEIGHT: Record<TaskStatus, number> = {
  backlog: 0,
  ready: 5,
  in_progress: 40,
  in_review: 70,
  ready_for_qi: 85,
  done: 100,
  blocked: 30,
  on_hold: 20,
  cancelled: 0,
}

// ───────────────────────────── Priority ─────────────────────────────

export const PRIORITIES: { id: Priority; label: string; tone: Tone; rank: number }[] = [
  { id: 'urgent', label: 'Urgent', tone: 'red', rank: 0 },
  { id: 'high', label: 'High', tone: 'orange', rank: 1 },
  { id: 'medium', label: 'Medium', tone: 'blue', rank: 2 },
  { id: 'low', label: 'Low', tone: 'gray', rank: 3 },
]
export function priorityDef(id: Priority) {
  return PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[2]
}

// ───────────────────────────── Types ─────────────────────────────

export const PROJECT_TYPES: { id: ProjectType; label: string; icon: LucideIcon; department: Department }[] = [
  { id: 'development', label: 'Development', icon: CodeXml, department: 'development' },
  { id: 'theme_migration', label: 'Theme Migration', icon: Layers, department: 'development' },
  { id: 'bug_fix', label: 'Bug Fix', icon: BugIcon, department: 'development' },
  { id: 'design', label: 'Design', icon: Palette, department: 'design' },
  { id: 'account_management', label: 'Account Management', icon: Handshake, department: 'account_management' },
  { id: 'quality_inspection', label: 'Quality Inspection', icon: ClipboardCheck, department: 'quality_inspection' },
  { id: 'cro', label: 'CRO', icon: LineChart, department: 'cro' },
  { id: 'ab_testing', label: 'A/B Testing', icon: Shuffle, department: 'ab_testing' },
  { id: 'general', label: 'General Project', icon: FolderKanban, department: 'operations' },
]
export function projectTypeDef(id: ProjectType) {
  return PROJECT_TYPES.find((t) => t.id === id) ?? PROJECT_TYPES[PROJECT_TYPES.length - 1]
}

export const TASK_TYPES: { id: TaskType; label: string; icon: LucideIcon; department: Department }[] = [
  { id: 'development', label: 'Development', icon: CodeXml, department: 'development' },
  { id: 'design', label: 'Design', icon: Palette, department: 'design' },
  { id: 'buffer', label: 'Buffer', icon: Timer, department: 'development' },
  { id: 'quality_inspection', label: 'Quality Inspection', icon: ClipboardCheck, department: 'quality_inspection' },
  { id: 'bug', label: 'Bug', icon: BugIcon, department: 'development' },
  { id: 'cro', label: 'CRO', icon: LineChart, department: 'cro' },
  { id: 'ab_test', label: 'A/B Test', icon: FlaskConical, department: 'ab_testing' },
  { id: 'account_management', label: 'Account Mgmt', icon: Handshake, department: 'account_management' },
  { id: 'general', label: 'General', icon: Wrench, department: 'operations' },
]
export function taskTypeDef(id: TaskType) {
  return TASK_TYPES.find((t) => t.id === id) ?? TASK_TYPES[TASK_TYPES.length - 1]
}

// ───────────────────────────── People ─────────────────────────────

export const ROLES: { id: Role; label: string; short: string; description: string }[] = [
  { id: 'admin', label: 'Admin', short: 'Admin', description: 'Manages users, templates and workflow settings' },
  { id: 'account_manager', label: 'Account Manager', short: 'AM', description: 'Owns client delivery, creates projects and sets timelines' },
  { id: 'lead', label: 'Lead Developer', short: 'Lead', description: 'Breaks down work, assigns tasks and reviews estimates' },
  { id: 'developer', label: 'Developer', short: 'Dev', description: 'Builds assigned tasks, logs hours and reports blockers' },
  { id: 'designer', label: 'Designer', short: 'Design', description: 'Delivers design work, links assets and manages revisions' },
  { id: 'qi', label: 'QI Engineer', short: 'QI', description: 'Inspects work, records results and flags bugs' },
  { id: 'cro', label: 'CRO Specialist', short: 'CRO', description: 'Researches conversion issues and records hypotheses' },
  { id: 'ab_testing', label: 'A/B Testing Specialist', short: 'A/B', description: 'Runs experiments and records results' },
]
export function roleDef(id: Role) {
  return ROLES.find((r) => r.id === id) ?? ROLES[0]
}

export const DEPARTMENTS: { id: Department; label: string; slug: string }[] = [
  { id: 'development', label: 'Development', slug: 'development' },
  { id: 'design', label: 'Design', slug: 'design' },
  { id: 'account_management', label: 'Account Management', slug: 'account-management' },
  { id: 'quality_inspection', label: 'Quality Inspection', slug: 'quality-inspection' },
  { id: 'cro', label: 'CRO', slug: 'cro' },
  { id: 'ab_testing', label: 'A/B Testing', slug: 'ab-testing' },
  { id: 'operations', label: 'Operations', slug: 'operations' },
]
export function departmentDef(id: Department) {
  return DEPARTMENTS.find((d) => d.id === id) ?? DEPARTMENTS[0]
}

// ───────────────────────────── Misc statuses ─────────────────────────────

export const CLIENT_STATUSES: { id: ClientStatus; label: string; tone: Tone }[] = [
  { id: 'active', label: 'Active', tone: 'green' },
  { id: 'onboarding', label: 'Onboarding', tone: 'violet' },
  { id: 'paused', label: 'Paused', tone: 'orange' },
  { id: 'offboarded', label: 'Offboarded', tone: 'gray' },
]

export const PM_STATUSES: { id: PMStatus; label: string; tone: Tone }[] = [
  { id: 'not_reviewed', label: 'Not reviewed', tone: 'gray' },
  { id: 'in_review', label: 'PM reviewing', tone: 'teal' },
  { id: 'approved', label: 'PM approved', tone: 'green' },
  { id: 'changes_requested', label: 'Changes requested', tone: 'orange' },
]

export const QI_STATUSES: { id: QIStatus; label: string; tone: Tone }[] = [
  { id: 'awaiting', label: 'Awaiting inspection', tone: 'amber' },
  { id: 'in_progress', label: 'Inspecting', tone: 'blue' },
  { id: 'passed', label: 'Passed', tone: 'green' },
  { id: 'changes_requested', label: 'Changes requested', tone: 'orange' },
  { id: 'failed', label: 'Failed', tone: 'red' },
]

export const BUG_SEVERITIES: { id: BugSeverity; label: string; tone: Tone }[] = [
  { id: 'critical', label: 'Critical', tone: 'red' },
  { id: 'major', label: 'Major', tone: 'orange' },
  { id: 'minor', label: 'Minor', tone: 'amber' },
  { id: 'trivial', label: 'Trivial', tone: 'gray' },
]

export const BUG_STATUSES: { id: BugStatus; label: string; tone: Tone }[] = [
  { id: 'open', label: 'Open', tone: 'red' },
  { id: 'in_progress', label: 'In progress', tone: 'blue' },
  { id: 'fixed', label: 'Fixed', tone: 'teal' },
  { id: 'verified', label: 'Verified', tone: 'green' },
  { id: 'wont_fix', label: "Won't fix", tone: 'gray' },
]

export const CRO_STATUSES: { id: CROStatus; label: string; tone: Tone }[] = [
  { id: 'idea', label: 'Idea', tone: 'gray' },
  { id: 'researching', label: 'Researching', tone: 'violet' },
  { id: 'ready', label: 'Ready to build', tone: 'teal' },
  { id: 'implementing', label: 'Implementing', tone: 'blue' },
  { id: 'implemented', label: 'Implemented', tone: 'green' },
  { id: 'rejected', label: 'Rejected', tone: 'red' },
]

export const AB_STATUSES: { id: ABTestStatus; label: string; tone: Tone }[] = [
  { id: 'draft', label: 'Draft', tone: 'gray' },
  { id: 'scheduled', label: 'Scheduled', tone: 'violet' },
  { id: 'running', label: 'Running', tone: 'blue' },
  { id: 'paused', label: 'Paused', tone: 'orange' },
  { id: 'completed', label: 'Completed', tone: 'green' },
  { id: 'stopped', label: 'Stopped', tone: 'red' },
]

export function findMeta<T extends { id: string }>(list: T[], id: string) {
  return list.find((x) => x.id === id) ?? list[0]
}

// ───────────────────────────── Tone classes ─────────────────────────────
// Literal class strings so Tailwind can detect them.

export const TONE_BADGE: Record<Tone, string> = {
  gray: 'bg-tone-gray-bg text-tone-gray-fg',
  blue: 'bg-tone-blue-bg text-tone-blue-fg',
  violet: 'bg-tone-violet-bg text-tone-violet-fg',
  amber: 'bg-tone-amber-bg text-tone-amber-fg',
  green: 'bg-tone-green-bg text-tone-green-fg',
  red: 'bg-tone-red-bg text-tone-red-fg',
  orange: 'bg-tone-orange-bg text-tone-orange-fg',
  teal: 'bg-tone-teal-bg text-tone-teal-fg',
  pink: 'bg-tone-pink-bg text-tone-pink-fg',
}

export const TONE_DOT: Record<Tone, string> = {
  gray: 'bg-tone-gray-dot',
  blue: 'bg-tone-blue-dot',
  violet: 'bg-tone-violet-dot',
  amber: 'bg-tone-amber-dot',
  green: 'bg-tone-green-dot',
  red: 'bg-tone-red-dot',
  orange: 'bg-tone-orange-dot',
  teal: 'bg-tone-teal-dot',
  pink: 'bg-tone-pink-dot',
}

export const TONE_TEXT: Record<Tone, string> = {
  gray: 'text-tone-gray-fg',
  blue: 'text-tone-blue-fg',
  violet: 'text-tone-violet-fg',
  amber: 'text-tone-amber-fg',
  green: 'text-tone-green-fg',
  red: 'text-tone-red-fg',
  orange: 'text-tone-orange-fg',
  teal: 'text-tone-teal-fg',
  pink: 'text-tone-pink-fg',
}
