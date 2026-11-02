# Ecom Workspace — Prototype Guide

Internal project management prototype for a Shopify Plus agency, intended to replace the
Notion project-card workflow. **UI/UX prototype only**: data is local, in memory, and resets on
reload. Nothing connects to Notion, SSO, Slack, analytics or file storage.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run typecheck
npm run lint
```

Requires Node 20+.

## What to try (reviewer walkthrough)

1. **Overview** — metrics, “Requires attention”, workload and status charts all derive from the
   same dataset. Click any metric to land on the filtered view.
2. **All Clients → Shepherds Fashion** — client workspace with Overview / Status board / Projects /
   Tasks / Activity / Details tabs and a *Create project* button.
   **Status board** stacks every project of the client under its Notion status. Choose which
   status columns appear with the chip multi-select (remove a chip with ×, or use *All*,
   *With projects*, *Open work*, *None*); toggle *Hide empty columns*. The choice is saved in the
   browser and also applies to the *Board* view on All Projects. Drag cards to change status.
3. **Project card** (e.g. `/projects/p_sf_p1`, SF-101) — one scrollable page laid out like the
   Notion card: header properties (Status, Client, Late?, % Pushed to QI, Client portal), property
   sections (Project info, Time & date, QI info with **QI Start / QI End** timer, Dev & designer,
   Strategy, Automation), Comments, Project tasks (*Tasks only / Bugs only / Tasks & bugs* with a
   Task health column and summed hours), a day-by-day Calendar, Project details, Files & links and
   Activity history. The sticky bar under the header jumps between sections.
   **SF-104 Shop by Video Page Rebuild** is the original reference project. Look at its QI history: round 1 *changes requested* → bug SF-B1 → round 2 *passed*.
4. **Change a task status** (any table, board, or the task panel) — the project progress ring,
   dashboard tiles and calendar update immediately. Drag cards on the board views.
5. **Ready for QI** — move a task to *Ready for QI*; it appears on **Quality Inspection**.
   Switch to *Jordan Lee* (user menu → Preview as role…), start the inspection, then Pass or
   Request changes. The developer gets an in-app notification.
6. **Comments & dev handoff** — in a project card's *Comments* section (or a task panel), type `@` to
   mention a teammate. Use the composer toolbar to attach **Git branch**, **Theme** details, multiple
   **Video proof** / **Image proof** links and numbered **QI steps** (or *Dev handoff* to add all).
   The formatting toolbar adds bold, italic, underline, strikethrough, code, equation, links and
   text / background colours (Ctrl+B / I / U / E, Ctrl+Shift+X, Ctrl+K); use *Preview* to check before
   posting. Text is stored with lightweight markers (see `src/lib/textFormat.ts`). See the demo on
   **SF-110 Made in Canada Badge**. Posting QI steps notifies the project's QI owner.
7. **Roles** — switch to *Sarthak Chatterjee (Developer)*: “New project” disappears (hidden),
   delete/assign controls show a lock with an explanation (disabled). Admin screens are read-only.
8. **Theme** — sun/moon icon in the top bar or Settings. Follows the OS on first visit.
9. **Search** — `Ctrl/⌘ + K`.

## Project structure

```
src/
  app/            App shell, router (lazy routes), providers
  components/
    ui/           Primitives: button, dialog/sheet, menu/popover, form controls, badges, tabs
    common/       Domain building blocks: status/priority badges, pickers, people, gates
    layout/       Sidebar, top bar, global search
    projects/     Project table, board, header, overview, files, activity, filters
    tasks/        Task table (nested), Kanban board, task detail panel
    calendar/     Month calendar, timeline/roadmap
    activity/     Activity feed, comments, notifications
    dashboard/    Metric tiles, status distribution, workload bars
    forms/        Project & task dialogs, form shell with unsaved-change guard
    qi/           Bug form
  pages/          One file per route; admin/ for administration
  data/           Seed records (clients, projects, tasks, collaboration, QI, growth, templates)
  services/       store (mock DB), api (mock API), session (persisted prefs), ui (transient UI)
  hooks/          Reactive data hooks, task actions, theme, URL-driven task panel
  lib/            dates, calculations, filters, permissions, workflow config, activity formatting
  types/          Domain model
  styles/         Tailwind v4 theme tokens (light + dark)
docs/
  integration-roadmap.md   Every TODO(...) integration point, affected files and decisions
  data-model.md            Entities, relations, Notion field mapping, calculated values
```

## Conventions

- **Single source of truth.** Pages never hold copies of records; they read from the store via
  hooks and derive metrics with `src/lib/calculations.ts`.
- **Writes go through `services/api.ts`.** It also records activity events and notifications so
  every screen shows consistent history.
- **Permissions** are checked only through `src/lib/permissions.ts` (`useCan`, `<Gate>`).
  `mode="hide"` for irrelevant actions, `mode="disable"` (lock + tooltip) for visible-but-restricted.
- **Dates** — status labels like “overdue” are always derived from today's date.
- **Theme** — colours are CSS variables in `src/styles/index.css`; components use semantic
  tokens (`bg-surface`, `text-muted-foreground`, `bg-tone-green-bg`) so both themes stay correct.
- **Integration points** are tagged `TODO(TAG)`; see `integration-roadmap.md`.

## Known prototype limitations

- Data is in memory; refresh or *Settings → Reset demo data* restores the seed.
- Workflow statuses are displayed but not editable (needs a workflow service).
- Saved views are predefined URL queries; saving custom views needs a backend.
- A/B metrics are illustrative demo values; no significance testing.
- File “uploads” store only name and size.
