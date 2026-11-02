/**
 * Core domain model for Ecom Workspace.
 *
 * Shapes mirror what a future REST/GraphQL API is expected to return:
 * flat records with explicit foreign keys (`clientId`, `projectId`, `parentTaskId`)
 * rather than nested objects, so the mock layer can be swapped for a real client.
 *
 * TODO(NOTION-MIGRATION): Map source Notion database properties and relations to these models.
 * Each importable record carries an optional `notionSourceId` so imported rows can be traced
 * back to the originating Notion page during validation.
 *
 * TODO(MIGRATION-VALIDATION): Compare imported records, relations, and field values against the
 * Notion source (row counts per database, task→project relations, dates, hours, statuses) and
 * produce a discrepancy report before the Notion workspace is retired.
 */

export type ID = string
/** ISO-8601 timestamp, e.g. 2026-10-27T14:30:00.000Z */
export type ISODateTime = string
/** Calendar date without time, e.g. 2026-10-27 */
export type ISODate = string

// ───────────────────────────── People ─────────────────────────────

export type Role =
  | 'admin'
  | 'account_manager'
  | 'lead'
  | 'developer'
  | 'designer'
  | 'qi'
  | 'cro'
  | 'ab_testing'

export type Department =
  | 'development'
  | 'design'
  | 'account_management'
  | 'quality_inspection'
  | 'cro'
  | 'ab_testing'
  | 'operations'

export interface User {
  id: ID
  name: string
  email: string
  role: Role
  title: string
  department: Department
  teamId: ID
  /** Hue (0-360) used for the generated avatar */
  avatarHue: number
  weeklyCapacityHours: number
  timezone: string
  active: boolean
}

export interface Team {
  id: ID
  name: string
  department: Department
  leadId: ID
  memberIds: ID[]
}

// ───────────────────────────── Clients ─────────────────────────────

export type ClientStatus = 'active' | 'onboarding' | 'paused' | 'offboarded'

export interface ExternalLink {
  id: ID
  label: string
  url: string
}

export interface Client {
  id: ID
  name: string
  /** Short prefix used in project keys, e.g. "SF" */
  code: string
  industry: string
  status: ClientStatus
  accountManagerId: ID
  teamMemberIds: ID[]
  website: string
  shopifyDomain: string
  clientPortalUrl?: string
  slackChannel?: string
  plan: 'Shopify Plus' | 'Shopify Advanced' | 'Shopify'
  timezone: string
  primaryContact: { name: string; email: string; role: string }
  notes: string
  links: ExternalLink[]
  avatarHue: number
  createdAt: ISODateTime
  notionSourceId?: string
}

// ───────────────────────────── Workflow ─────────────────────────────

export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export type ProjectType =
  | 'development'
  | 'design'
  | 'account_management'
  | 'quality_inspection'
  | 'cro'
  | 'ab_testing'
  | 'bug_fix'
  | 'theme_migration'
  | 'general'

/**
 * Project statuses mirror the existing Notion "Status" property one-to-one so imported cards
 * keep their exact status. Order here is the delivery lifecycle (see DEFAULT_PROJECT_STATUSES).
 */
export type ProjectStatus =
  | 'idea'
  | 'project_setup'
  | 'lead_review'
  | 'am_review'
  | 'ready_to_start'
  | 'in_progress'
  | 'peer_review'
  | 'quality_inspection'
  | 'issues_found'
  | 'fixing_issues'
  | 'ready_for_client'
  | 'client_reviewing'
  | 'prep_for_deployment'
  | 'ready_to_deploy'
  | 'deployment'
  | 'active_ab_test'
  | 'need_support'
  | 'pause'
  | 'done'
  | 'archive_soon'
  | 'archive'

export type TaskStatus =
  | 'backlog'
  | 'ready'
  | 'in_progress'
  | 'in_review'
  | 'ready_for_qi'
  | 'done'
  | 'blocked'
  | 'on_hold'
  | 'cancelled'

export type TaskType =
  | 'development'
  | 'design'
  | 'buffer'
  | 'quality_inspection'
  | 'bug'
  | 'cro'
  | 'ab_test'
  | 'account_management'
  | 'general'

/** Status categories let views reason about workflows without hardcoding every status. */
export type StatusCategory = 'todo' | 'active' | 'review' | 'done' | 'paused' | 'cancelled'

export type Tone = 'gray' | 'blue' | 'violet' | 'amber' | 'green' | 'red' | 'orange' | 'teal' | 'pink'

export interface StatusDefinition<T extends string = string> {
  id: T
  label: string
  category: StatusCategory
  tone: Tone
  description?: string
}

/** Project-manager sign-off, carried over from the Notion "Project Manager Status" property. */
export type PMStatus = 'not_reviewed' | 'in_review' | 'approved' | 'changes_requested'

// ───────────────────────────── Projects ─────────────────────────────

export interface Requirement {
  id: ID
  text: string
  done: boolean
}

export type CustomFieldKind = 'text' | 'number' | 'date' | 'select' | 'url'

export interface CustomFieldDefinition {
  id: ID
  key: string
  label: string
  kind: CustomFieldKind
  options?: string[]
  appliesTo: ProjectType[]
  description?: string
}

export interface CustomFieldValue {
  fieldId: ID
  value: string | number | null
}

export interface Project {
  id: ID
  /** Human readable key, e.g. "SF-104" */
  key: string
  title: string
  clientId: ID
  type: ProjectType
  description: string
  requirements: Requirement[]

  ownerId: ID
  accountManagerId: ID
  leadId?: ID
  developerIds: ID[]
  designerIds: ID[]
  qiOwnerId?: ID
  croOwnerId?: ID
  abOwnerId?: ID

  priority: Priority
  status: ProjectStatus
  pmStatus: PMStatus

  createdAt: ISODateTime
  updatedAt: ISODateTime
  startDate?: ISODate
  originalDueDate?: ISODate
  revisedDueDate?: ISODate
  completedAt?: ISODate

  /** Manual estimates entered by AM / Lead. Calculated totals come from tasks. */
  projectedDevHours?: number
  bufferHours?: number
  projectedQiHours?: number
  daysNeeded?: number
  /** Manual Notion field: share of scope handed to QI. */
  percentPushedToQi?: number

  clientPortalUrl?: string
  releaseNotes?: string
  tags: string[]
  customFields: CustomFieldValue[]
  archived: boolean
  templateId?: ID
  notionSourceId?: string

  /** Notion "Non-Billable Project" checkbox — hours are not invoiced to the client. */
  nonBillable?: boolean
  githubPrUrl?: string
  /** Notion "Bug Video": screen recording QI attaches when issues are found. */
  bugVideoUrl?: string
  qiTestDate?: ISODate
  /** Notion "Relative Potential Revenue" (strategy score entered by the AM / CRO). */
  relativePotentialRevenue?: number
  /** Set whenever `status` changes; drives "Last status change" and "Status since". */
  statusChangedAt?: ISODateTime
  automation?: ProjectAutomation
}

/**
 * Fields the Notion automations and the Time Doctor sync maintain on each card.
 * TODO(TIME-DOCTOR): Populate estimate/used hours from the Time Doctor API instead of seed values.
 * TODO(NOTION-AUTOMATIONS): Replace the Notion "Processed" / billing-cycle automations with
 * server-side jobs.
 */
export interface ProjectAutomation {
  processed: boolean
  /** Billing cycle the card was processed in */
  cycleMonth?: ISODateTime
  addToTimeDoctor: boolean
  timeDoctorEstimateHours?: number
  timeDoctorUsedHours?: number
  scheduledDate?: ISODate
}

// ───────────────────────────── Tasks ─────────────────────────────

export interface Task {
  id: ID
  key: string
  projectId: ID
  parentTaskId?: ID
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  type: TaskType
  assigneeId?: ID
  reporterId: ID
  startDate?: ISODate
  dueDate?: ISODate
  estimatedHours?: number
  actualHours?: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
  completedAt?: ISODateTime
  order: number
  notionSourceId?: string
}

// ───────────────────────────── Collaboration ─────────────────────────────

/**
 * Structured developer handoff attached to a comment (git branch, preview theme, proof links,
 * QI steps). Stored on the comment record like any other field; the UI renders it as a panel.
 */
export interface CommentHandoff {
  gitBranch?: { name: string; url?: string }
  theme?: { name: string; themeId?: string; previewUrl?: string }
  videoProofs: string[]
  imageProofs: string[]
  qiSteps: string[]
}

export interface Comment {
  id: ID
  authorId: ID
  /** Plain text with light formatting: **bold**, `code`, "- " bullets (indent for nesting), "1. " lists. */
  body: string
  createdAt: ISODateTime
  editedAt?: ISODateTime
  projectId?: ID
  taskId?: ID
  mentionIds: ID[]
  handoff?: CommentHandoff
}

export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'project_archived'
  | 'status_changed'
  | 'priority_changed'
  | 'assignee_changed'
  | 'due_date_changed'
  | 'task_created'
  | 'task_completed'
  | 'task_deleted'
  | 'comment_added'
  | 'link_added'
  | 'link_removed'
  | 'qi_started'
  | 'qi_result'
  | 'bug_created'
  | 'hours_logged'

export interface ActivityEvent {
  id: ID
  type: ActivityType
  actorId: ID
  createdAt: ISODateTime
  clientId?: ID
  projectId?: ID
  taskId?: ID
  /** Free-form change details, e.g. { field: 'status', from: 'in_progress', to: 'done' } */
  meta: Record<string, string | number | null | undefined>
}

export type NotificationType =
  | 'task_assigned'
  | 'comment'
  | 'mention'
  | 'deadline_approaching'
  | 'overdue'
  | 'qi_returned'
  | 'status_changed'

export type RecordRef =
  | { kind: 'project'; id: ID }
  | { kind: 'task'; id: ID }
  | { kind: 'client'; id: ID }
  | { kind: 'bug'; id: ID }
  | { kind: 'experiment'; id: ID }

export interface Notification {
  id: ID
  userId: ID
  type: NotificationType
  title: string
  body: string
  createdAt: ISODateTime
  read: boolean
  actorId?: ID
  ref: RecordRef
}

export type AttachmentKind = 'link' | 'figma' | 'github' | 'client_portal' | 'design_reference' | 'file'

export interface Attachment {
  id: ID
  projectId: ID
  taskId?: ID
  kind: AttachmentKind
  title: string
  url?: string
  /** For file placeholders only. No bytes are stored in the prototype. */
  fileName?: string
  fileSizeBytes?: number
  addedById: ID
  createdAt: ISODateTime
}

// ───────────────────────────── Templates ─────────────────────────────

export interface TemplateTask {
  title: string
  type: TaskType
  estimatedHours?: number
}

export interface ProjectTemplate {
  id: ID
  name: string
  type: ProjectType
  description: string
  defaultPriority: Priority
  defaultTasks: TemplateTask[]
  customFieldIds: ID[]
  /** Suggested buffer as a share of dev hours, e.g. 0.2 */
  bufferRatio: number
  /** Suggested QI hours as a share of dev hours */
  qiRatio: number
}

// ───────────────────────────── QI / Bugs ─────────────────────────────

export type QIStatus = 'awaiting' | 'in_progress' | 'passed' | 'failed' | 'changes_requested'

export interface QIChecklistItem {
  id: ID
  label: string
  result: 'pass' | 'fail' | 'na' | null
}

export interface QIRecord {
  id: ID
  taskId: ID
  projectId: ID
  inspectorId?: ID
  status: QIStatus
  round: number
  submittedById: ID
  submittedAt: ISODateTime
  startedAt?: ISODateTime
  completedAt?: ISODateTime
  notes: string
  checklist: QIChecklistItem[]
  bugIds: ID[]
  devices: string[]
}

/**
 * One QI Start → QI End session on a project (Notion "QI Time Tracker" database).
 * Total QI hours is the sum of these sessions.
 */
export interface QITimeEntry {
  id: ID
  projectId: ID
  inspectorId: ID
  startedAt: ISODateTime
  /** Missing while the timer is running */
  endedAt?: ISODateTime
}

export type BugSeverity = 'critical' | 'major' | 'minor' | 'trivial'
export type BugStatus = 'open' | 'in_progress' | 'fixed' | 'verified' | 'wont_fix'

export interface Bug {
  id: ID
  key: string
  projectId: ID
  taskId?: ID
  qiRecordId?: ID
  title: string
  description: string
  stepsToReproduce: string
  environment: string
  severity: BugSeverity
  status: BugStatus
  reporterId: ID
  assigneeId?: ID
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

// ───────────────────────────── CRO / A/B ─────────────────────────────

export type CROStatus = 'idea' | 'researching' | 'ready' | 'implementing' | 'implemented' | 'rejected'

export interface CROExperiment {
  id: ID
  clientId: ID
  projectId?: ID
  title: string
  pageArea: string
  problemStatement: string
  hypothesis: string
  proposedChange: string
  expectedOutcome: string
  recommendations: string
  status: CROStatus
  ownerId: ID
  priority: Priority
  /** ICE-style score 1-10 entered by the CRO specialist */
  impactScore: number
  linkedTaskIds: ID[]
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type ABTestStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'stopped'

export interface ABTestExperiment {
  id: ID
  key: string
  clientId: ID
  linkedProjectIds: ID[]
  name: string
  hypothesis: string
  controlName: string
  variantName: string
  startDate?: ISODate
  endDate?: ISODate
  status: ABTestStatus
  ownerId: ID
  primaryMetric: string
  /** Illustrative demo values in percent, e.g. 2.4 means 2.4% */
  baselineConversionRate?: number
  variantConversionRate?: number
  sampleSize?: number
  trafficSplit: number
  platform: string
  resultsSummary: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

// ───────────────────────────── Database snapshot ─────────────────────────────

export interface Database {
  users: User[]
  teams: Team[]
  clients: Client[]
  projects: Project[]
  tasks: Task[]
  comments: Comment[]
  activity: ActivityEvent[]
  notifications: Notification[]
  attachments: Attachment[]
  templates: ProjectTemplate[]
  customFields: CustomFieldDefinition[]
  qiRecords: QIRecord[]
  qiTimeEntries: QITimeEntry[]
  bugs: Bug[]
  croExperiments: CROExperiment[]
  abTests: ABTestExperiment[]
  projectStatuses: StatusDefinition<ProjectStatus>[]
  taskStatuses: StatusDefinition<TaskStatus>[]
}
