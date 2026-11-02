# Build a Professional Project Management Web App — UI/UX Prototype Only

## 1. Your Role

Act as a senior product designer, UI/UX architect, and experienced frontend engineer. Design and build a polished, interactive project management web application inspired by Jira, Linear, and Notion, but tailored to the actual workflows of a Shopify Plus agency.

This is an internal company project management tool intended to replace our current Notion-based project card workflow.

Do not just create a dashboard mockup or a marketing website. Build a realistic, multi-page, interactive application prototype that feels like a production-ready SaaS product.

For this phase, focus exclusively on frontend UI/UX and simulated functionality. Do not implement a real backend, database, authentication provider, Notion API, or external integrations.

Every feature that will eventually require backend or external service integration must have a clear, actionable `TODO` comment in the relevant source code.

The application should use realistic dummy data, functional interactions, reusable components, and a coherent data model so that real integrations can be added later without rebuilding the UI.

---

## 2. Business Context

Our company currently manages projects for multiple clients using Notion.

Each project is represented by a project card with properties, expandable information sections, linked task databases, dates, owners, estimated hours, statuses, and other project-specific metadata.

An example of an existing project is:

**SF - Release Theme Migration Phase 4: Shop by Video Page Rebuild**

Client: Shepherds Fashion

Project information currently includes:
- Project status
- Client
- On-time or late status
- Percentage pushed to QI
- Client portal project link
- Project information
- Project manager status
- Original due date
- Revised due date
- Projected development hours
- Total project hours
- Buffer hours
- Projected QI hours
- Days needed
- Linked tasks and bugs
- Task title
- Task status
- Due date
- Assigned developer
- Task duration
- Quality inspection records

The project also contains task entries such as:
- Shop by video page
- Video-Text Section in Collection Pages
- Buffer
- Quality Inspection

These details are representative of the information that our new application must be capable of displaying.

We want to preserve the underlying information and operational capabilities of the existing Notion workflow while introducing a significantly better user experience.

The long-term vision is a centralized internal project management platform similar to Jira, customized for our organization.

---

## 3. Primary Objective

Build a UI/UX prototype where users can:

1. View all company clients.
2. Open a client workspace.
3. View all projects belonging to that client.
4. Create and manage project cards.
5. Add requirements, descriptions, dates, and timelines.
6. Assign project owners and team members.
7. Create tasks, subtasks, and bugs.
8. Add comments and collaborate with colleagues.
9. Estimate work and track actual hours.
10. Update statuses and monitor progress.
11. Manage QA/QI, design, CRO, and A/B testing workflows.
12. View projects using tables, Kanban boards, calendars, and timelines.
13. Switch between light mode and dark mode.
14. Access functionality according to their simulated role.
15. Open historical project records and see the same categories of information currently available in Notion.

All core interactions should work using local mock data and frontend state.

---

## 4. Technology and Implementation Requirements

First inspect the existing project and its package configuration. Reuse the existing framework and conventions if a project already exists.

If starting from scratch, use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where appropriate
- Lucide icons
- React Router for navigation
- A suitable date utility for date formatting and calendar operations

Use a lightweight charting library only where charts provide meaningful value.

Use the existing package manager and avoid unnecessary dependencies.

Keep the architecture modular, type-safe, maintainable, and easy to extend.

### Frontend-only rules

- Use local mock data as the current data source.
- Use React state or a lightweight state-management solution for interactive features.
- Persist useful prototype preferences in localStorage, such as theme and selected role.
- Keep mock records structured as if they came from a real API.
- Use realistic IDs, timestamps, relationships, and typed models.
- Separate mock data from UI components.
- Separate data-access functions from presentation components.
- Create reusable forms, dialogs, tables, cards, menus, and detail panels.
- Use realistic loading, empty, success, and error states where relevant.
- Do not create fake integrations that claim to have successfully contacted external services.

If a dependency is not installed, install it only when appropriate and compatible with the existing project.

Do not stop after generating a plan or listing files. Implement the actual application.

---

## 5. Product Design Direction

Create a professional, user-friendly internal SaaS application.

The UI should feel like a thoughtful combination of Jira's organizational capabilities, Linear's clean interface, and Notion's flexible information structure.

Do not copy any product exactly.

### Visual style

- Professional and minimal.
- Clean, spacious layouts.
- Clear visual hierarchy.
- Neutral backgrounds with restrained accent colors.
- Subtle borders and shadows.
- Consistent typography and spacing.
- Rounded corners used consistently.
- Carefully designed status badges.
- High information density without visual clutter.
- Fast, intuitive navigation.
- Strong contrast and readable text.
- Responsive layouts for desktop, tablet, and mobile.

Avoid:
- Excessive gradients.
- Overly colorful dashboards.
- Giant decorative illustrations.
- Excessive card nesting.
- Unnecessary animations.
- Oversized headings that waste space.
- Every section being placed inside a separate bordered card.
- Fake buttons that do nothing.
- Placeholder text everywhere.
- Excessive use of emojis.

Use Lucide icons rather than emojis for normal interface controls.

The app should look like a professional internal tool used daily by an experienced agency team.

### Theme support

Implement both light mode and dark mode.

Requirements:
- A theme toggle accessible from the application shell.
- A coherent color palette for each theme.
- Consistent backgrounds, borders, typography, popovers, dropdowns, dialogs, and tables.
- Properly styled hover, focus, selected, and disabled states.
- Theme preference persisted in localStorage.
- No hardcoded colors that break the alternate theme.
- Respect the operating system theme on the first visit if practical.

Both themes must look intentionally designed, not like a basic color inversion.

---

## 6. Application Navigation and Information Architecture

Build a persistent application shell with a collapsible sidebar, a top navigation area, and a main content region.

### Sidebar

Include:

**Workspace**
- Overview
- My Work
- Inbox / Notifications

**Project Management**
- All Clients
- All Projects
- My Tasks
- All Tasks
- Bugs
- Calendar
- Timeline / Roadmap

**Departments**
- Development
- Design
- Account Management
- Quality Inspection
- CRO
- A/B Testing

**Administration**
- Team Members
- Workflows & Statuses
- Project Templates
- Settings

Organize navigation cleanly. Department views may use shared components with different filters rather than entirely separate implementations.

Use sensible routes for all primary screens.

The sidebar should support collapsing and expanding, preserve its state, and clearly indicate the current page.

### Top bar

Include:
- Breadcrumb navigation.
- Global search.
- Quick-create button.
- Notification icon with a dropdown or panel.
- Current user avatar and profile menu.
- Theme toggle.
- Current workspace or company identity.

Use a fictional company name such as "Ecom Workspace" for the prototype.

---

## 7. Dashboard

Build a useful operational dashboard rather than a generic analytics page.

Include a personalized greeting and a concise overview of current work.

### Summary metrics

- Active projects.
- Open tasks.
- Overdue tasks.
- Tasks due today.
- Projects awaiting QI.
- Projects completed this month.

Use meaningful metric cards with small icons, appropriate labels, and optional trend indicators.

### Dashboard sections

1. My Work — tasks assigned to the selected user.
2. Projects Requiring Attention — overdue projects, blocked tasks, and upcoming deadlines.
3. Recent Activity — comments, status changes, assignments, and project updates.
4. Project Progress — progress indicators for selected projects.
5. Upcoming Deadlines — a compact chronological view.
6. Team Workload — a visual overview of assigned work by team member.
7. Projects by Status — a compact chart or equivalent visualization.

Every metric and list must derive from the same mock dataset. Do not hardcode unrelated numbers into individual dashboard widgets.

Provide filters such as date range, client, department, and assignee where appropriate.

Clicking a metric or project should navigate to a relevant filtered view or project detail page.

---

## 8. Client Management

Create an All Clients page with a searchable, filterable, sortable table or well-designed list.

### Client properties

- Client name
- Client logo or initials
- Industry
- Account manager
- Active projects
- Open tasks
- Next major deadline
- Client status
- Last activity

Include realistic fictional agency clients such as:
- Shepherds Fashion
- WOLFPak
- WonderFold
- Made by Mary
- Pet Planet
- Chelsea Peers

These are sample records for the prototype, not live company data.

### Client workspace

Clicking a client opens a dedicated workspace with:

- Client overview.
- Client information.
- Account manager and assigned team.
- Active projects.
- Completed projects.
- Open tasks.
- Upcoming deadlines.
- Recent activity.
- Project status summary.
- Relevant external links.
- A prominent Create Project button.

Provide tabs such as:
- Overview
- Projects
- Tasks
- Activity
- Details

Each tab should have meaningful content and functional interactions.

Support client-specific search, filtering, sorting, and project creation.

---

## 9. Project Management

Create a dedicated All Projects page.

Support these views:
- Table view.
- Kanban view.
- Calendar view.
- Timeline view, if practical within the selected frontend libraries.

The selected view should persist while navigating within the project section.

### Project properties

A project can contain:

- Unique ID.
- Project title.
- Client.
- Project type.
- Description.
- Requirements.
- Project owner.
- Account manager.
- Lead.
- Assigned developers.
- Assigned designers.
- QI owner.
- CRO or A/B testing owner, where applicable.
- Priority.
- Project status.
- Created date.
- Start date.
- Original due date.
- Revised due date.
- Actual completion date.
- Estimated hours.
- Actual hours.
- Buffer hours.
- Projected development hours.
- Projected QI hours.
- Days needed.
- Percentage complete.
- Percentage pushed to QI.
- On-time / late indicator.
- External client portal URL.
- Tags.
- Attachments.
- Linked tasks and bugs.
- Activity history.

Use a typed project model and sensible optional fields.

Do not force every department-specific property to appear on every card.

### Project types

Provide templates for:
- Development
- Design
- Account Management
- Quality Inspection
- CRO
- A/B Testing
- Bug Fix
- Theme Migration
- General Project

Each project type should share core fields while allowing specialized fields.

### Project table

Include:
- Project name.
- Client.
- Status.
- Priority.
- Owner.
- Due date.
- Progress.
- Task count.
- Estimated hours.

Provide:
- Search.
- Sorting.
- Filters.
- Saved-view examples.
- Column visibility controls if practical.
- Row click navigation.
- Bulk selection and bulk status changes if practical.

The table must be usable with realistic amounts of data and not just a handful of showcase cards.

---

## 10. Project Detail Page — The Most Important Screen

This screen is central to the application.

Design a full project detail experience that preserves the information density and capabilities of our current Notion project cards, but makes the content easier to scan and use.

Use the following as a reference project:

**SF - Release Theme Migration Phase 4: Shop by Video Page Rebuild**

Client: Shepherds Fashion

Status: Done

Schedule: Original due date October 27, 2026; completion and final schedule represented with explicit, realistic dates.

Estimated development hours: 4

Total project hours: 6

Buffer hours: 1

Projected QI hours: 1

Tasks:
- Shop by video page — Done — 2.5 hours.
- Video-Text Section in Collection Pages — Done — 1.5 hours.
- Buffer — Done.
- Quality Inspection — Done.

Represent these as sample data, preserving the supplied example values where relevant.

### Project header

Include:
- Breadcrumbs.
- Project title.
- Client badge or logo.
- Project ID.
- Project type.
- Status selector.
- Priority selector.
- Assignee avatars.
- Due date.
- Progress indicator.
- More-actions menu.

Actions:
- Edit project.
- Change status.
- Duplicate project.
- Archive project.
- Copy project link.
- Delete project with a confirmation dialog.

These actions should operate on mock state.

### Project tabs

Provide:
- Overview
- Tasks & Subtasks
- Timeline
- Activity & Comments
- Files & Links

Use a compact and clear tab layout.

### Overview

Display the project information in well-organized sections.

**Project Information**
- Description.
- Requirements.
- Client.
- Project owner.
- Account manager.
- Team members.
- Project type.
- Priority.
- External client portal link.

**Time & Date Information**
- Created date.
- Start date.
- Original due date.
- Revised due date.
- Completed date.
- Estimated development hours.
- Actual hours.
- Total project hours.
- Buffer hours.
- Projected QI hours.
- Days needed.

**Delivery & Quality**
- Percentage complete.
- Percentage pushed to QI.
- On-time / late status.
- QI status.
- Release or deployment notes.

Use compact metadata rows, section headings, inline editing where appropriate, and collapsible sections for secondary information.

If a field is not applicable, omit it or display an intentional empty state. Do not invent actual business data.

### Tasks & Subtasks

Build an interactive task table with:
- Task title.
- Status.
- Assignee.
- Priority.
- Start date.
- Due date.
- Estimated hours.
- Actual hours.
- Progress.
- Task type.

Users should be able to:
- Create tasks.
- Create nested subtasks.
- Edit tasks.
- Assign team members.
- Change status and priority.
- Set estimates.
- Add due dates.
- Add descriptions.
- Add comments.
- Mark tasks complete.
- Expand and collapse subtasks.
- Delete tasks after confirmation.

Show task counts and calculated hours.

Project totals must derive from the mock tasks when appropriate. Distinguish manual estimates from calculated totals.

Provide clear empty states when a project has no tasks.

### Activity & Comments

Implement a chronological activity feed with entries for:
- Project created.
- Status changed.
- Assignee updated.
- Due date changed.
- Task created.
- Task completed.
- Comment added.

Provide a working comment composer with:
- Text input.
- Submit action.
- Author avatar.
- Timestamp.
- Chronological display.

Add an optional simulated @mention interaction.

Clearly mark all activity as local prototype data.

### Files & Links

Provide an interface for:
- External URLs.
- Figma links.
- GitHub or pull request links.
- Client portal links.
- Design references.
- Uploaded-file placeholders.

Allow users to add, edit, and remove mock links.

Do not claim that real files are uploaded to a server.

Add comments in the code where real file storage, upload APIs, and access control will eventually be required.

---

## 11. Task Management and Collaboration

Create a standalone My Tasks page and an All Tasks page.

### My Tasks

Show tasks assigned to the currently selected mock user.

Group or filter tasks by:
- Today.
- Upcoming.
- Overdue.
- Completed.

Allow quick status changes and opening the parent project.

### All Tasks

Include:
- Table view.
- Optional Kanban board.
- Search.
- Client filter.
- Project filter.
- Assignee filter.
- Department filter.
- Status filter.
- Priority filter.
- Due date filter.

### Task lifecycle

Use a coherent sample workflow:

Backlog → Ready → In Progress → In Review → Ready for QI → Done

Also support:
- Blocked.
- On Hold.
- Cancelled.

Do not assume every task must follow exactly the same lifecycle. Make status configuration adaptable in the future.

### Task detail panel

Clicking a task should open a side panel or detail page containing:
- Title.
- Description.
- Parent project.
- Parent task, if applicable.
- Client.
- Assignee.
- Status.
- Priority.
- Start date.
- Due date.
- Estimated hours.
- Actual hours.
- Subtasks.
- Comments.
- Activity history.

All supported changes should update local mock state immediately.

---

## 12. Role-Based Experience

Simulate role-based access in the UI. This is a prototype feature, not real security enforcement.

Provide a role switcher in the user menu so the reviewer can preview different roles without logging out.

### Sample users

Use realistic fictional team members:

- Rufus — Account Manager.
- Sarthak Chatterjee — Developer.
- Alex Morgan — Lead Developer.
- Priya Sharma — Designer.
- Jordan Lee — QI Engineer.
- Maya Patel — CRO Specialist.
- Chris Wilson — A/B Testing Specialist.
- Taylor Reed — Admin.

### Roles and permissions

**Admin**
- Manage mock users and roles.
- View all clients and projects.
- Manage templates and workflow settings.
- Access administration screens.

**Account Manager (AM)**
- Create projects.
- Define requirements.
- Set dates and timelines.
- Assign project owners and team members.
- Create tasks.
- Update project status.
- Add comments and review progress.
- Track client-facing delivery.

**Lead**
- Review project requirements.
- Assign or reassign work.
- Break projects into tasks and subtasks.
- Review estimates.
- Monitor team workload.
- Review progress and blockers.
- Coordinate development and QI.

**Developer**
- View assigned projects and tasks.
- Add comments.
- Create subtasks where permitted.
- Enter estimated and actual hours.
- Update task statuses.
- Report blockers.
- Track progress and add technical links.

**Designer**
- Access assigned design projects.
- Add design links and assets.
- Update design progress.
- Add comments and manage revisions.

**QI / QA**
- View work ready for inspection.
- Record inspection results.
- Flag bugs.
- Add defect descriptions.
- Approve or reject work.
- Update inspection status.

**CRO Specialist**
- Manage CRO-related projects.
- Record hypotheses and recommendations.
- Track analysis and implementation status.

**A/B Testing Specialist**
- Manage experiments.
- Track variants, schedules, experiment status and results.
- Record relevant conversion metrics.

Use a permission matrix or central permission utility rather than scattering role checks across components.

For example, a developer should not see the same project-creation controls as an admin if that role is not authorized in the prototype.

Show a clear visual distinction between disabled actions and hidden actions.

Add code comments explaining that all permissions must eventually be enforced by the backend and must not rely on frontend role switching.

---

## 13. QI / QA Workflow

Create a dedicated QI section.

Include:
- Tasks awaiting inspection.
- In-progress inspections.
- Approved tasks.
- Rejected tasks.
- Bugs found during inspection.
- Assigned QI owner.
- Inspection date.
- Notes and results.

Provide a detail panel with actions such as:
- Start inspection.
- Pass.
- Fail.
- Request changes.
- Create bug.

Use realistic mock data to demonstrate a task moving from development into inspection and then to approval or rework.

The UI should make it easy to understand what is waiting for whom.

---

## 14. CRO and A/B Testing

Create functional, sample-data-driven pages for CRO and A/B testing.

### CRO projects

Display:
- Client.
- Hypothesis.
- Problem statement.
- Proposed change.
- Status.
- Owner.
- Priority.
- Expected outcome.
- Linked implementation tasks.

### A/B testing

Display:
- Experiment name.
- Client.
- Hypothesis.
- Control and variant names.
- Start date.
- End date.
- Experiment status.
- Owner.
- Primary metric.
- Baseline conversion rate.
- Variant conversion rate.
- Sample size.
- Results summary.

Use plausible illustrative sample values and label them as demo data.

Do not imply that these metrics are connected to live analytics.

The UI should support creating and editing experiments, but statistical significance calculations or actual analytics integrations are not required in this phase.

Add TODO comments for future GA4, analytics, experimentation-platform, and reporting integrations.

---

## 15. Calendar and Timeline

Build a practical visual representation of project schedules.

### Calendar

- Monthly calendar view.
- Navigate between months.
- Display projects and tasks on their due dates.
- Distinguish project deadlines from task deadlines.
- Click an event to open its details.
- Provide filters by client, assignee, and status.

### Timeline / Roadmap

- Show project start and end dates.
- Display tasks nested under projects where practical.
- Distinguish completed, active, blocked, and overdue work.
- Highlight upcoming deadlines.
- Allow date-range navigation.
- Make the layout usable without excessive horizontal scrolling.

If drag-and-drop scheduling is implemented, update local state and show a clear visual response.

Do not make the timeline a static illustration. Use actual dates from the mock data.

---

## 16. Global Search, Notifications, and Activity

### Global search

Create a functional search interface that searches mock data across:
- Clients.
- Projects.
- Tasks.
- Bugs.
- Team members.

Show grouped search results with icons and useful metadata.

Selecting a result should navigate to the relevant record.

### Notifications

Provide sample notifications for:
- New task assignment.
- New comment.
- Approaching deadline.
- Overdue work.
- Task returned from QI.
- Project status change.

Support marking notifications as read and opening the related record.

### Activity

Track local prototype actions such as:
- Project creation.
- Task creation.
- Assignment changes.
- Status updates.
- Due date updates.
- Comments.

Use a reusable activity utility so different screens show consistent event formats.

Add code comments indicating where real-time notifications, persistent activity storage, email, and Slack integrations will be connected later.

---

## 17. Mock Data and Data Models

Create a separate mock-data layer containing realistic interconnected data.

At minimum, seed:

- 6 clients.
- 8–12 projects.
- 15–25 tasks.
- Several nested subtasks.
- 8 team members.
- All roles described above.
- Multiple task and project statuses.
- Overdue, upcoming, in-progress and completed records.
- Several comments and activity events.
- A few bugs.
- QI records.
- CRO projects.
- A/B testing experiments.
- Example project templates.
- Example notifications.

Use realistic dates around the demo period, with a mixture of past, current, and future work. Keep date-dependent indicators derived from actual dates rather than hardcoding labels such as "Overdue."

Use the following TypeScript model concepts, adapting the exact fields as needed:

- `User`
- `Role`
- `Team`
- `Client`
- `Project`
- `ProjectType`
- `ProjectStatus`
- `Task`
- `TaskStatus`
- `Priority`
- `Comment`
- `ActivityEvent`
- `Notification`
- `Attachment`
- `ProjectTemplate`
- `CustomFieldDefinition`
- `CustomFieldValue`
- `QIRecord`
- `Bug`
- `CROExperiment`
- `ABTestExperiment`

Use stable mock IDs and explicit relationships.

For example:
- A project references a client.
- A project has an owner and team members.
- A task references its parent project.
- A subtask references its parent task.
- A comment references its author and related project or task.
- A notification references the related record.
- A QI record references the inspected task.
- An A/B experiment references a client and optionally linked projects.

Create mock API-like functions such as:

- `getClients()`
- `getProjects(filters)`
- `getProjectById(id)`
- `createProject(input)`
- `updateProject(id, updates)`
- `getTasks(filters)`
- `createTask(input)`
- `updateTask(id, updates)`
- `createComment(input)`
- `getActivity(recordId)`
- `getNotifications(userId)`
- `updateNotification(id, updates)`

These functions should operate on the mock data and simulate the structure of future API requests without making real network calls.

Keep the mock layer replaceable by a real API client.

Where useful, add a short simulated delay for loading states, but do not make the interface unnecessarily slow.

Ensure related components reflect the same state. For example, changing a task's status should update the task table, Kanban board, dashboard counts, and related project progress.

Do not duplicate hardcoded records across pages.

---

## 18. Future Integration TODO Comments

This requirement is mandatory.

Whenever the code reaches a point where real infrastructure or an external integration will eventually be required, add a clear TODO comment in the relevant file.

Use descriptive comments such as:

`// TODO(BACKEND): Replace mock data with the production API and persistent database.`

`// TODO(NOTION-MIGRATION): Map source Notion database properties and relations to this project model.`

`// TODO(AUTH): Replace simulated user selection with company SSO and authenticated sessions.`

`// TODO(RBAC): Enforce permissions on the backend; frontend checks are only for UI behavior.`

`// TODO(FILE-STORAGE): Connect secure file uploads and downloads to the approved storage provider.`

`// TODO(NOTIFICATIONS): Replace local notifications with persistent server-side events.`

`// TODO(AUDIT): Persist activity events and enforce audit-log access rules.`

`// TODO(ANALYTICS): Connect A/B test metrics to the approved analytics provider.`

`// TODO(REALTIME): Add server-side synchronization or WebSocket updates for team collaboration.`

`// TODO(SECURITY): Add server-side input validation, authorization, and rate limiting.`

`// TODO(MIGRATION-VALIDATION): Compare imported records, relations, and field values against the Notion source.`

Add equivalent comments wherever necessary for:
- Database persistence.
- API error handling.
- Search indexing.
- File storage.
- Email and Slack.
- Background jobs and automations.
- External client portals.
- Data backups.
- Deployment and environment configuration.

Do not scatter vague comments such as "TODO: implement later" everywhere.

Each TODO must explain what needs to be integrated and, where appropriate, what the replacement behavior should be.

Create a central `docs/integration-roadmap.md` listing the integration points, affected files, required company decisions, and dependencies.

The app must run without these integrations.

---

## 19. Interaction and UX Requirements

Every visible control should have meaningful behavior.

Implement:
- Navigation between pages.
- Create and edit dialogs.
- Search.
- Filters.
- Sorting.
- Dropdowns.
- Tabs.
- Status selectors.
- Assignee selectors.
- Date pickers.
- Task creation.
- Subtask creation.
- Comment submission.
- Notification actions.
- Theme switching.
- Role switching.
- View switching.
- Expandable sections.
- Confirmation dialogs for destructive actions.
- Toasts or equivalent feedback.
- Empty states.
- Form validation.
- Unsaved-change handling where appropriate.

Use realistic interaction patterns.

For example, creating a project should open a form, validate required fields, create the mock record, update the relevant list, and navigate to the new project.

Changing a task status should update all relevant views using the shared state.

Deleting a project should require confirmation and should handle related records coherently in the prototype.

Do not implement controls that look functional but do nothing.

Where a capability is intentionally out of scope, make that limitation clear rather than displaying a fake successful action.

---

## 20. Accessibility and Responsive Design

Follow practical accessibility principles:
- Semantic HTML.
- Keyboard-accessible navigation.
- Visible focus indicators.
- Proper form labels.
- Accessible dialog behavior.
- Appropriate contrast in both themes.
- Clear status labels that do not depend on color alone.
- Useful tooltips for icon-only controls.

Support:
- Desktop: full sidebar and information-dense tables.
- Tablet: collapsible sidebar and adaptable layouts.
- Mobile: compact navigation, stacked content, and horizontally manageable tables.

Desktop is the primary target, but the application must remain usable at narrower screen sizes.

---

## 21. Suggested Project Structure

Use a clean structure similar to:

`src/`
- `app/` — app shell, routes, providers.
- `components/` — reusable UI components.
- `components/layout/` — sidebar, topbar, breadcrumbs.
- `components/projects/` — project header, project table, project detail sections.
- `components/tasks/` — task table, task editor, subtasks.
- `components/clients/` — client table and client overview.
- `components/calendar/` — calendar and timeline.
- `components/activity/` — comments and activity feed.
- `components/forms/` — reusable form controls.
- `pages/` — dashboard, clients, projects, tasks, QI, CRO, experiments, settings.
- `data/` — mock records and seed data.
- `services/` — mock data-access functions.
- `types/` — TypeScript interfaces and enums.
- `hooks/` — reusable state and interaction hooks.
- `lib/` — utilities, permissions, date handling and calculations.
- `styles/` — theme variables and global styles.

`docs/`
- `integration-roadmap.md`
- `data-model.md`
- `README.md`

Adjust this structure if the existing project already follows a good convention.

Avoid putting the entire application in one giant component.

---

## 22. Acceptance Criteria

The implementation is complete when:

1. The application launches successfully using the project's documented development command.
2. The main dashboard contains consistent, data-driven mock metrics.
3. The user can navigate between clients, projects, tasks, QI, CRO, experiments, calendar, and settings.
4. The user can open a client and view its related projects.
5. The user can create and edit projects.
6. The user can open a project detail page and inspect its full information.
7. The user can create tasks and nested subtasks.
8. The user can change statuses and assignments.
9. The user can add comments and view activity.
10. Task and project changes are reflected consistently across the application.
11. The role switcher changes the simulated UI permissions.
12. The light and dark themes both work throughout the application.
13. The calendar and timeline use the same mock project and task data.
14. The QI, CRO, and A/B testing pages contain realistic, functional examples.
15. The application contains appropriate empty states, validation, and user feedback.
16. Future backend and integration points have useful TODO comments in the relevant code.
17. The codebase includes the integration roadmap and data model documentation.
18. No live Notion credentials, external API secrets, or production data are required.
19. The project builds successfully without TypeScript errors.
20. No primary navigation item or major visible action is left as a dead control.

---

## 23. Implementation Instructions

Work in the following order:

1. Inspect the existing repository and identify the current framework, dependencies, and entry point.
2. Establish the shared data model and realistic mock dataset.
3. Build the app shell, navigation, theme system, and reusable UI components.
4. Implement the dashboard and client workspace.
5. Implement the project table and complete project detail experience.
6. Implement tasks, subtasks, comments, activity, and role-aware UI behavior.
7. Implement calendar, timeline, QI, CRO, and A/B testing views.
8. Implement global search, notifications, and settings.
9. Add the future integration TODO comments and documentation.
10. Run the available build, lint, and type-check commands.
11. Fix implementation errors and verify the main user journeys.

Prioritize a coherent, working application over implementing every advanced feature superficially.

If time or output limits require prioritization, complete the application shell, dashboard, client workspace, project details, task management, theme switching, role switching, and mock-data consistency first. Then continue with the remaining modules.

Do not stop at wireframes, a design proposal, or a list of recommendations.

**Build the application in the available project environment, implement the interactions, and leave it in a runnable state.**