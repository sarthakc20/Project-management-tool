# Integration Roadmap

Ecom Workspace is currently a **frontend-only prototype**. Every point where real infrastructure
or an external service is needed is marked in code with a tagged comment, e.g.
`// TODO(BACKEND): …`. Search for a tag to find every affected location:

```bash
grep -rn "TODO(FILE-STORAGE)" src
```

The app runs without any of these integrations. Nothing in the prototype contacts an external
service; UI copy says so wherever an action would normally reach one.

---

## Summary

| Tag | Integration | Primary files | Blocks |
| --- | --- | --- | --- |
| `BACKEND` | Production API + persistent database | `src/services/api.ts`, `src/services/store.ts`, `src/hooks/useData.ts`, `src/data/index.ts`, `src/lib/utils.ts` (IDs), `src/lib/workflow.ts`, `src/lib/calculations.ts`, `src/hooks/useSimulatedLoad.ts`, `src/pages/admin/WorkflowsPage.tsx`, `src/pages/admin/TemplatesPage.tsx`, `src/data/templates.ts`, `src/data/quality.ts` | Everything below |
| `API-ERRORS` | Typed API errors, rollback of optimistic updates | `src/services/api.ts`, `src/hooks/useTaskActions.ts` | `BACKEND` |
| `SECURITY` | Server-side validation, authorisation, rate limiting | `src/services/api.ts` | `BACKEND`, `AUTH` |
| `AUTH` | Company SSO, sessions, user provisioning | `src/services/session.ts`, `src/lib/permissions.ts`, `src/data/people.ts`, `src/components/layout/Topbar.tsx` (role switcher), `src/pages/admin/TeamPage.tsx` | — |
| `RBAC` | Server-enforced permissions | `src/lib/permissions.ts`, `src/components/common/gate.tsx`, `src/services/api.ts`, `src/pages/admin/TeamPage.tsx` | `AUTH`, `BACKEND` |
| `NOTION-MIGRATION` | Import from the existing Notion workspace | `src/types/index.ts`, `src/data/projects.ts`, `src/data/tasks.ts`, `src/data/clients.ts`, `src/data/templates.ts` | `BACKEND` |
| `MIGRATION-VALIDATION` | Reconcile imported data against Notion | `src/types/index.ts` | `NOTION-MIGRATION` |
| `AUDIT` | Persistent, access-controlled activity log | `src/services/api.ts` (`logActivity`), `src/data/collaboration.ts` | `BACKEND`, `RBAC` |
| `NOTIFICATIONS` | Server-side notification events | `src/services/api.ts` (`notify`), `src/data/collaboration.ts`, `src/components/activity/Comments.tsx` | `BACKEND` |
| `REALTIME` | Live updates between teammates | `src/services/store.ts`, `src/services/api.ts`, `src/components/projects/ProjectActivity.tsx` | `BACKEND` |
| `EMAIL-SLACK` | Email digests and Slack delivery | `src/services/api.ts`, `src/data/collaboration.ts`, `src/pages/ClientDetailPage.tsx` | `NOTIFICATIONS` |
| `JOBS` | Background jobs / automations (deadline reminders, overdue alerts) | `src/services/api.ts` | `BACKEND`, `NOTIFICATIONS` |
| `FILE-STORAGE` | Secure uploads & downloads | `src/components/projects/ProjectFiles.tsx`, `src/services/api.ts`, `src/data/collaboration.ts` | `BACKEND`, `RBAC` |
| `SEARCH` | Server-side search index | `src/lib/filters.ts`, `src/components/layout/GlobalSearch.tsx` | `BACKEND`, `RBAC` |
| `GIT-INTEGRATION` | Resolve handoff branches against GitHub (exists, PR, CI status) | `src/services/api.ts` (`createComment`), `src/components/projects/ProjectCard.tsx` (GitHub PR link) | `BACKEND`, `AUTH` |
| `SHOPIFY-THEMES` | Verify handoff theme ID / preview URL via Shopify Admin API | `src/services/api.ts` (`createComment`) | `BACKEND` |
| `CLIENT-PORTAL` | Sync with the external client portal | `src/data/clients.ts`, `src/components/projects/ProjectCard.tsx` | `BACKEND` |
| `TIME-DOCTOR` | Sync estimate / used hours and QI sessions with Time Doctor | `src/types/index.ts` (`ProjectAutomation`), `src/services/api.ts` (`startQiTimer`), `src/components/projects/ProjectCard.tsx` | `BACKEND`, `AUTH` |
| `NOTION-AUTOMATIONS` | Replace Notion card automations (Processed, billing cycle) with server jobs | `src/types/index.ts`, `src/components/projects/ProjectCard.tsx` | `BACKEND`, `JOBS` |
| `ANALYTICS` | GA4 / analytics metrics for CRO and A/B | `src/pages/ExperimentsPage.tsx`, `src/pages/CROPage.tsx`, `src/data/growth.ts`, `src/services/api.ts` | `BACKEND` |
| `EXPERIMENTATION-PLATFORM` | Sync experiments from the testing platform | `src/pages/ExperimentsPage.tsx` | `ANALYTICS` |
| `REPORTING` | Client-facing experiment / delivery reports | `src/pages/ExperimentsPage.tsx` | `ANALYTICS` |
| `BACKUPS` | Database backups & point-in-time restore | `src/services/store.ts` | `BACKEND` |
| `DEPLOYMENT` | Hosting, environments, configuration | `vite.config.ts` | — |

---

## Details

### BACKEND — production API and database
**Today:** `src/services/store.ts` holds an in-memory copy of the seed data. `src/services/api.ts`
exposes API-shaped functions (`getProjects(filters)`, `updateTask(id, updates)`, `createComment(input)`, …)
that mutate the store synchronously. Data resets on page reload.

**Replacement:** keep the function signatures in `api.ts` and replace bodies with HTTP calls.
Swap the read hooks in `src/hooks/useData.ts` for a query cache (e.g. TanStack Query) so components
keep the same interface. IDs (`uid()` in `src/lib/utils.ts`) must come from the server.
Aggregates in `src/lib/calculations.ts` (progress, schedule health, hours) can stay client-side
initially but portfolio rollups should move to server queries as data grows.

**Decisions needed:** API style (REST vs GraphQL), database (Postgres recommended for relational
project/task data), hosting provider, soft-delete and retention policy for deleted projects.

### AUTH / RBAC — identity and permissions
**Today:** the user menu → “Preview as role…” sets `currentUserId` in localStorage. The central
permission matrix in `src/lib/permissions.ts` decides whether controls are hidden or shown
disabled with a lock icon.

**Replacement:** sign in with company SSO; the server returns the user and role. Remove the role
switcher. **Every mutating endpoint must re-check permissions server-side**, including
record-level rules the prototype does not model (e.g. “developers may only edit tasks on projects
they're assigned to”, “clients' data visible only to assigned team”).

**Decisions needed:** identity provider (Google Workspace / Okta / Azure AD), whether roles map to
IdP groups, whether a user can hold multiple roles, contractor access rules.

### NOTION-MIGRATION / MIGRATION-VALIDATION
**Today:** the seed data reproduces the categories of information on a Notion project card. The
Shepherds Fashion reference project (`SF-104`) preserves the supplied values and carries a
`notionSourceId`. Field mapping notes are in `src/data/projects.ts` and `docs/data-model.md`.

**Replacement:** a one-off (re-runnable) import script reading the Notion API: Clients → `Client`,
Projects → `Project`, “Tasks & Bugs” → `Task` / `Bug`, people properties → `User` by email.
Unmapped properties become `CustomFieldDefinition` + `CustomFieldValue`. Validation compares row
counts per database, relation integrity (task→project), dates, hours and statuses, and outputs a
discrepancy report before Notion is retired.

**Decisions needed:** cut-over date, how far back to import historical projects, read-only period
for Notion, owner for resolving discrepancies, Notion integration token custody.

### AUDIT
**Today:** `logActivity()` appends events to memory; feeds render them via `src/lib/activity.ts`.
**Replacement:** write events server-side in the same transaction as the change; make them
append-only; restrict who can read which events.

### NOTIFICATIONS / REALTIME / EMAIL-SLACK / JOBS
**Today:** `notify()` creates in-app notifications for assignments, mentions, comments, status
changes and QI returns. Deadline and overdue notifications exist only as seed data.
**Replacement:** server emits notification events; deliver in-app via WebSocket/SSE; fan out to
email and Slack per user preferences; a scheduled job generates “due soon” and “overdue” alerts.
**Decisions needed:** Slack workspace/app ownership, which events go to client channels vs DMs,
email provider, quiet hours.

### FILE-STORAGE
**Today:** “Add file placeholder” records only file name and size; no bytes leave the browser.
**Replacement:** signed upload URLs to object storage (S3 / GCS / R2), malware scanning, size/type
limits, per-project access control, short-lived signed download URLs.
**Decisions needed:** storage provider, retention, max size, whether clients can upload.

### SEARCH
**Today:** client-side filtering over the in-memory store.
**Replacement:** server search endpoint (Postgres full-text or a hosted index), results filtered
by the user's permissions.

### GIT-INTEGRATION / SHOPIFY-THEMES — developer handoff comments
**Today:** developers attach a structured handoff to a comment (git branch + link, theme name / ID /
preview URL, video and image proof links, QI steps). It is stored on the comment record and rendered
as a panel; nothing is checked against GitHub or Shopify.
**Replacement:** store `handoff` with the comment (JSON column or child table). Optionally offer
branch autocomplete from GitHub and theme pickers from the client store's Shopify Admin API, show PR /
CI status next to the branch, and warn if the preview theme no longer exists.
**Decisions needed:** GitHub org/app access, which stores grant theme-read API access, whether proof
links should move into file storage instead of external links.

### CLIENT-PORTAL
**Today:** client portal URLs are manually entered links.
**Replacement:** generate or sync project pages in the external client portal; decide which
fields are client-visible.

### ANALYTICS / EXPERIMENTATION-PLATFORM / REPORTING
**Today:** CRO and A/B metrics are manually entered, labelled “Demo data”, and lift is a simple
relative difference with no significance testing.
**Replacement:** pull metric snapshots from GA4 and the experimentation platform with the date
range they cover; compute significance server-side; generate client reports.
**Decisions needed:** approved platforms per client, data-sharing agreements, who signs off results.

### API-ERRORS / SECURITY
Mutations currently cannot fail. With a real API, map 4xx/5xx/409 to typed errors, roll back
optimistic updates, and show actionable toasts. Validate all input server-side; the form
validation in the UI is for usability only. Add rate limiting on write endpoints.

### BACKUPS / DEPLOYMENT
Set up automated database backups with point-in-time restore, and environment configuration
(API base URL, SSO issuer, storage bucket) through `import.meta.env` in `vite.config.ts`.
Decide hosting (static frontend + API), environments (dev / staging / prod) and secrets management.

---

## Suggested order

1. `AUTH` + `BACKEND` (schema from `docs/data-model.md`) + `RBAC`
2. `NOTION-MIGRATION` → `MIGRATION-VALIDATION`
3. `AUDIT`, `NOTIFICATIONS`, `REALTIME`
4. `FILE-STORAGE`, `SEARCH`
5. `EMAIL-SLACK`, `JOBS`
6. `CLIENT-PORTAL`, `ANALYTICS`, `EXPERIMENTATION-PLATFORM`, `REPORTING`
7. `BACKUPS`, `DEPLOYMENT` hardening (in parallel with 1 for staging)
