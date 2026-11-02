# Data Model

All types live in `src/types/index.ts`. Records are flat with explicit foreign keys so the mock
layer can be replaced by an API without reshaping data. Seed data lives in `src/data/`.

## Entities and relationships

```
Team 1─* User
Client 1─* Project ─* Task ─* Task (subtasks via parentTaskId)
Client *─1 User (accountManagerId), Client *─* User (teamMemberIds)
Project *─1 User (ownerId, accountManagerId, leadId, qiOwnerId, croOwnerId, abOwnerId)
Project *─* User (developerIds, designerIds)
Project *─1 ProjectTemplate (templateId)        ProjectTemplate *─* CustomFieldDefinition
Project 1─* CustomFieldValue ─1 CustomFieldDefinition
Project 1─* Attachment (optionally per Task)
Project/Task 1─* Comment *─1 User (authorId), Comment *─* User (mentionIds), Comment 1─0..1 CommentHandoff
Project/Task/Client 1─* ActivityEvent *─1 User (actorId)
Task 1─* QIRecord (one per inspection round) 1─* Bug
Project 1─* Bug, Bug *─1 Task (optional)
Notification *─1 User, Notification → RecordRef { kind, id }
CROExperiment *─1 Client, *─1 Project (optional), *─* Task (linkedTaskIds)
ABTestExperiment *─1 Client, *─* Project (linkedProjectIds)
```

## Key types

| Type | Purpose | Notable fields |
| --- | --- | --- |
| `User` | Team member | `role: Role`, `department`, `weeklyCapacityHours` |
| `Role` | `admin`, `account_manager`, `lead`, `developer`, `designer`, `qi`, `cro`, `ab_testing` | permissions in `src/lib/permissions.ts` |
| `Team` | Department grouping | `leadId`, `memberIds` |
| `Client` | Agency client | `code` (project key prefix), `status`, `accountManagerId`, `clientPortalUrl`, `links` |
| `Project` | The project card | see below |
| `Task` | Task or subtask | `parentTaskId`, `type: TaskType`, `status: TaskStatus`, `estimatedHours`, `actualHours` |
| `Comment` | Discussion on a project or task | `mentionIds`, `body` (plain text with markers: `**bold**`, `*italic*`, `++underline++`, `~~strike~~`, `` `code` ``, `$$eq$$`, `[label](url)`, `{blue}…{/}`, `{bg:yellow}…{/}`, `- ` bullets), optional `handoff` |
| `CommentHandoff` | Developer handoff attached to a comment | `gitBranch {name, url}`, `theme {name, themeId, previewUrl}`, `videoProofs[]`, `imageProofs[]`, `qiSteps[]` |
| `ActivityEvent` | Audit-style change log | `type`, `meta` (from/to/field) |
| `Notification` | In-app notification | `ref: RecordRef` |
| `Attachment` | Link or file placeholder | `kind: figma | github | client_portal | design_reference | link | file` |
| `ProjectTemplate` | Defaults per project type | `defaultTasks`, `bufferRatio`, `qiRatio`, `customFieldIds` |
| `CustomFieldDefinition` / `CustomFieldValue` | Department-specific fields | `appliesTo: ProjectType[]` |
| `QITimeEntry` | One QI Start → QI End session on a project | `inspectorId`, `startedAt`, `endedAt` (missing while running) |
| `QIRecord` | One inspection round of a task | `round`, `status`, `checklist`, `devices`, `bugIds` |
| `Bug` | Defect | `severity`, `status`, `qiRecordId` |
| `CROExperiment` | CRO hypothesis | `problemStatement`, `hypothesis`, `proposedChange`, `impactScore` |
| `ABTestExperiment` | A/B test | `controlName`, `variantName`, `baselineConversionRate`, `variantConversionRate` (demo values) |
| `StatusDefinition` | Configurable status | `category: todo | active | review | done | paused | cancelled` |

## Project fields and Notion mapping

| Notion property | Model field | Kind |
| --- | --- | --- |
| Project name | `title` | manual |
| Client | `clientId` | relation |
| Project Status | `status` | manual |
| On Time or Late | — | **derived** (`scheduleHealth()`): compares completion vs `originalDueDate`, or today vs effective due date |
| % Pushed to QI | `percentPushedToQi` | recorded (manual); a task-derived value is shown alongside |
| Client Portal Project | `clientPortalUrl` | manual |
| Project Information | `description`, `requirements[]` | manual |
| Project Manager Status | `pmStatus` | manual |
| Original Due Date | `originalDueDate` | manual |
| Revised Due Date | `revisedDueDate` | manual |
| Projected Dev Hours | `projectedDevHours` | manual |
| Buffer Hours | `bufferHours` | manual |
| Projected QI Hours | `projectedQiHours` | manual |
| Total Project Hours | — | **derived**: dev + buffer + QI |
| Days Needed | `daysNeeded` | manual |
| Tasks & Bugs | `Task.projectId`, `Bug.projectId` | relation |
| Task duration | `Task.estimatedHours` | manual |
| Assigned developer | `Task.assigneeId` | relation |
| Quality inspection | `QIRecord` | records |
| Non-Billable Project | `nonBillable` | manual |
| Quality Inspector | `qiOwnerId` | relation |
| QI Start / QI End | `QITimeEntry` | records (buttons on the card) |
| Total QI Hours | — | **derived** (`qiTrackedHours()`): sum of QI sessions |
| QI Currently Testing | — | **derived**: tasks in *Ready for QI* or under an in-progress inspection |
| QI Test Date | `qiTestDate` | manual |
| Bug Video | `bugVideoUrl` | manual |
| Create Bug | `Bug` | records (button opens the bug form) |
| Developer / Lead / CRO Specialists | `developerIds`, `leadId`, `croOwnerId` | relation |
| ID | `key` | generated |
| Github PR link | `githubPrUrl` | manual |
| Relative Potential Revenue | `relativePotentialRevenue` | manual |
| Task Type | `type` | manual |
| Processed / Cycle (Current Month) | `automation.processed`, `automation.cycleMonth` | automation |
| Last Status Change Date / Status Since | `statusChangedAt` | set by `updateProject` on status change; “since” is derived |
| Add to Time Doctor | `automation.addToTimeDoctor` | manual |
| Estimation Time Doctor / Estimation Time Used | `automation.timeDoctorEstimateHours`, `automation.timeDoctorUsedHours` | synced (sample values) |
| Scheduled Date | `automation.scheduledDate` | manual |
| All QI Time Tracker Entries | `QITimeEntry[]` | records |
| Task Health (task rows) | — | **derived** (`taskHealth()`): Done / Missing date / Overdue / Due soon / On track |
| Project Details | `description` (supports `##` headings) | manual |

Additional fields not in Notion: `type`, `priority`, `ownerId`, `leadId`, `developerIds`,
`designerIds`, `qiOwnerId`, `croOwnerId`, `abOwnerId`, `startDate`, `completedAt`, `tags`,
`customFields`, `archived`, `templateId`, `releaseNotes`, `notionSourceId`.

## Manual vs calculated values

The UI labels each number as **Manual**, **Recorded** or **Calculated**:

- **Percentage complete** — hours-weighted average of top-level task progress. A task with subtasks
  takes the average of its subtasks; otherwise a status weight is used (Backlog 0%, Ready 5%,
  In progress 40%, In review 70%, Ready for QI 85%, Done 100%, Blocked 30%, On hold 20%).
- **Estimated / actual hours (tasks)** — sums of *leaf* tasks only, so parent tasks are never
  double-counted.
- **Total project hours** — `projectedDevHours + bufferHours + projectedQiHours`.
- **Overdue / due today / at risk** — always computed from today's date (`src/lib/dates.ts`);
  never stored as labels.

## Workflow

Project statuses mirror the Notion **Status** property exactly (21 options), ordered by lifecycle
and grouped into phases (`PROJECT_STATUS_GROUPS` in `src/lib/workflow.ts`):

| Phase | Statuses | Category |
| --- | --- | --- |
| Planning | Idea, Project Setup, Lead Review, AM Review, Ready To Start | todo |
| Build & QI | In Progress, Issues Found, Fixing Issues (active); Peer Review, Quality Inspection (review) | active / review |
| Client & release | Ready For Client, Client Is Reviewing, Ready to Deploy (review); Prep for Deployment, Deployment, Active AB Test (active) | review / active |
| Paused | Need Support, Pause | paused |
| Closed | Done, Archive Soon, Archive | done |

Any *Closed* status counts as delivered: it stamps `completedAt`, sets progress to 100% and drives
the on-time / late calculation. Notion's emojis are replaced by Lucide icons (`PROJECT_STATUS_ICON`).

Task lifecycle: Backlog → Ready → In progress → In review → Ready for QI → Done, plus Blocked,
On hold, Cancelled. Views reason about **status categories**, so additional statuses can be added
per workspace later. Moving a task to *Ready for QI* creates the next `QIRecord` round; a pass
marks the task Done, a fail / changes-requested returns it to In progress and notifies the assignee.

## Mock API

`src/services/api.ts` — `getClients`, `getClientById`, `getProjects(filters)`, `getProjectById`,
`createProject`, `updateProject`, `duplicateProject`, `archiveProject`, `deleteProject`,
`getTasks(filters)`, `createTask`, `updateTask`, `deleteTask`, `getComments`, `createComment`,
`getActivity(recordId)`, `getNotifications(userId)`, `updateNotification`, `markAllNotificationsRead`,
`createAttachment`, `updateAttachment`, `deleteAttachment`, `startInspection`, `recordQIResult`,
`updateQIRecord`, `createBug`, `updateBug`, `createCROExperiment`, `updateCROExperiment`,
`createABTest`, `updateABTest`, `updateUser`, `updateClient`.

Filters (`ProjectFilters`, `TaskFilters`) and their predicates live in `src/lib/filters.ts` and are
shared by the API functions and the reactive hooks.

## Seed data

6 clients, 25 projects (12 detailed + 13 board-coverage cards in `src/data/boardProjects.ts`), 35 top-level tasks + 6 subtasks, 8 users (all roles), 11 comments,
31 activity events, 18 notifications, 10 attachments, 9 templates, 7 custom fields, 10 QI records,
5 bugs, 5 CRO hypotheses, 5 A/B tests. Dates are relative to today except the Shepherds Fashion
reference project, which keeps its explicit October 2026 dates.
