import type { ActivityEvent, Attachment, Comment, Notification } from '@/types'
import { dayOffset, hoursAgo, timestampOffset } from '@/lib/dates'

export const seedComments: Comment[] = [
  {
    id: 'cm_handoff_mic', authorId: 'u_sarthak', projectId: 'p_sf_mic', taskId: 't_sf110_1', createdAt: hoursAgo(18), mentionIds: ['u_jordan'],
    body: "Rebuild the **Made in Canada Badge** as per the live site.\n\n**The badge**\n- Added the **MADE IN CANADA** maple leaf badge, using the same icon as live. It shows on products that have the tag `MADE IN CANADA` ({red}the tag has to match exactly{/}).\n- It sits at the bottom left of the image on:\n  - **Product cards:** collection pages, search and homepage product sections.\n  - **Product page:** first image only, not on videos, thumbnails or the zoomed image.\n  - **Cart drawer:** on the product thumbnail.\n- **Cart page:** the badge shows there too and can be turned off in the theme customizer ({bg:yellow}pending clarification 1{/}).\n- Sizes can be changed in **Theme settings → Made in Canada badge**.\nThe defaults match live.\n\n**Product URLs for reference:** `/collections/all/made-in-canada` (every product in this collection has the tag)\n\n**Note:**\nThe design system (padding, spacing, font family, other font stylings) is kept intact as the new **Release Theme**, *just* replicated the component and functionality from the live site.\n\nCompare the functionality with the dev theme and the live site to test this rebuild project. @Jordan Lee QI steps are below.",
    handoff: {
      gitBranch: {
        name: '153.15790/Project-ReleaseThemeMigrationMadeInCanadaBadge',
        url: 'https://github.example/ecom/shepherds-theme/tree/153.15790/Project-ReleaseThemeMigrationMadeInCanadaBadge',
      },
      theme: {
        name: '153.15790/ReleaseThemeMigrationMadeInCanadaBadge',
        themeId: '158806300417',
        previewUrl: 'https://shepherdsfashion.example/?_ab=0&_fd=0&_sc=1&preview_theme_id=158806300417',
      },
      videoProofs: [
        'https://loom.example/share/sf-made-in-canada-badge-desktop',
        'https://loom.example/share/sf-made-in-canada-badge-mobile',
      ],
      imageProofs: [
        'https://drive.example/sf-110/collection-product-cards.png',
        'https://drive.example/sf-110/pdp-first-image.png',
        'https://drive.example/sf-110/cart-drawer-thumbnail.png',
      ],
      qiSteps: [
        'Open /collections/all/made-in-canada on the preview theme and confirm the badge is on every product card (bottom left of the image).',
        'Check search results and the homepage product sections show the badge for tagged products.',
        'Open a tagged product: badge on the first image only, not on videos, thumbnails or the zoomed image.',
        'Add a tagged product to cart and confirm the badge on the cart drawer thumbnail.',
        'Open the cart page, then turn the badge off in the theme customizer and confirm it hides.',
        'Theme settings → Made in Canada badge: change the sizes and confirm they apply; reset to defaults.',
        'Open an untagged product (and one tagged "Made in Canada" with different casing) and confirm no badge.',
        'Compare against the live site on desktop and mobile (Safari + Chrome).',
      ],
    },
  },
  // SF-101 Phase 1 — dev handoff thread (mirrors the Notion card comments)
  {
    id: 'cm_p1_handoff', authorId: 'u_sarthak', projectId: 'p_sf_p1', createdAt: timestampOffset(-109, 18), mentionIds: ['u_jordan'],
    body: "Rebuild the **header, mega menu, mobile drawer and footer** as per the live site.\n\n**Header**\n- Logo, search, account and cart count, sticky on scroll (same breakpoint as live).\n- **Mega menu:** tiles use the collection metafield `custom.mega_menu_image`; collections without an image fall back to text links.\n- **Mobile drawer:** nested levels, same order as desktop.\n\n**Announcement bar & footer**\n- Messages rotate every 5s and are edited in **Theme settings → Announcement bar**.\n- Footer has the 4 menu columns, newsletter signup and payment icons.\n\n**Note:**\nThe design system (padding, spacing, font family, other font stylings) is kept intact as the new **Release Theme**, *just* replicated the components and functionality from the live site.\n\nCompare the functionality with the dev theme and the live site to test this rebuild project. @Jordan Lee QI steps are below.",
    handoff: {
      gitBranch: {
        name: '153.15701/Project-ReleaseThemeMigrationHeaderFooter',
        url: 'https://github.example/ecom/shepherds-theme/tree/153.15701/Project-ReleaseThemeMigrationHeaderFooter',
      },
      theme: {
        name: '153.15701/ReleaseThemeMigrationHeaderFooter',
        themeId: '158793990101',
        previewUrl: 'https://shepherdsfashion.example/?_ab=0&_fd=0&_sc=1&preview_theme_id=158793990101',
      },
      videoProofs: ['https://loom.example/share/sf-101-header-footer-walkthrough'],
      imageProofs: ['https://drive.example/sf-101/mega-menu-desktop.png', 'https://drive.example/sf-101/drawer-mobile.png'],
      qiSteps: [
        'Hover each top-level menu item on desktop and compare the mega menu tiles with live.',
        'Scroll any page and confirm the header sticks at the same point as live.',
        'Open the mobile drawer and walk every nested level; order must match desktop.',
        'Theme settings → Announcement bar: edit a message and confirm it rotates.',
        'Footer: submit the newsletter form with a test email; check payment icons.',
      ],
    },
  },
  {
    id: 'cm_p1_qi', authorId: 'u_jordan', projectId: 'p_sf_p1', createdAt: timestampOffset(-108, 12), mentionIds: ['u_sarthak'],
    body: '@Sarthak Chatterjee QI round 1: on iPhone the mobile drawer overlaps the announcement bar when it is open. Logged SF-B5 with a video. Everything else matches live.',
  },
  {
    id: 'cm_p1_fix', authorId: 'u_sarthak', projectId: 'p_sf_p1', createdAt: timestampOffset(-108, 16), mentionIds: ['u_jordan'],
    body: 'Fixed — the drawer now starts below the announcement bar and locks body scroll. Pushed to the same branch/theme. @Jordan Lee ready for a re-check.',
  },
  {
    id: 'cm_p1_pass', authorId: 'u_jordan', projectId: 'p_sf_p1', createdAt: timestampOffset(-107, 11), mentionIds: [],
    body: 'Re-checked on iPhone 15, Pixel 8, macOS Safari/Chrome. **Passed.**',
  },
  {
    id: 'cm_p1_merge', authorId: 'u_rufus', projectId: 'p_sf_p1', createdAt: timestampOffset(-105, 15), mentionIds: [],
    body: 'Header & footer successfully merged to new main Release theme. Marking card as done.',
  },
  // SF-104 reference project
  {
    id: 'cm_1', authorId: 'u_rufus', projectId: 'p_sf_sbv', createdAt: '2026-10-12T09:40:00.000Z', mentionIds: ['u_alex'],
    body: '@Alex Morgan client signed off on the Shop by Video layout in the portal. Scope is the page plus the reusable Video-Text section for collections.',
  },
  {
    id: 'cm_2', authorId: 'u_alex', projectId: 'p_sf_sbv', createdAt: '2026-10-13T10:05:00.000Z', mentionIds: ['u_sarthak'],
    body: 'Estimated at 4 dev hours total. @Sarthak Chatterjee can you pick this up after the phase 3 hotfix? Use the release theme video component rather than the legacy snippet.',
  },
  {
    id: 'cm_3', authorId: 'u_sarthak', taskId: 't_sf104_2', projectId: 'p_sf_sbv', createdAt: '2026-10-25T13:20:00.000Z', mentionIds: [],
    body: 'Fixed the iOS autoplay issue — videos now carry playsinline + muted. Pushed back to QI.',
  },
  {
    id: 'cm_4', authorId: 'u_jordan', projectId: 'p_sf_sbv', createdAt: '2026-10-27T14:25:00.000Z', mentionIds: ['u_rufus'],
    body: 'QI passed on iPhone 15 (Safari), Pixel 8 (Chrome), and desktop Chrome/Safari/Firefox. @Rufus good to publish.',
  },
  // SF-105
  {
    id: 'cm_5', authorId: 'u_alex', taskId: 't_sf105_3', projectId: 'p_sf_p5', createdAt: timestampOffset(-1, 16), mentionIds: [],
    body: 'PR is up for the size guide modal. Focus trap and escape-to-close are in; needs a second look on the metaobject schema.',
  },
  // WP-221
  {
    id: 'cm_6', authorId: 'u_rufus', projectId: 'p_wp_bfcm', createdAt: timestampOffset(-3, 11), mentionIds: ['u_sarthak'],
    body: '@Sarthak Chatterjee the client wants the countdown to end at midnight Mountain time, not UTC. Can you confirm the bar uses store timezone?',
  },
  {
    id: 'cm_7', authorId: 'u_sarthak', taskId: 't_wp221_3', projectId: 'p_wp_bfcm', createdAt: timestampOffset(0, 9, 30), mentionIds: ['u_jordan'],
    body: 'Countdown bar now reads the store timezone from the metaobject. Moved to Ready for QI — @Jordan Lee test plan is in the task description.',
  },
  // WP-224
  {
    id: 'cm_8', authorId: 'u_alex', projectId: 'p_wp_bug', createdAt: timestampOffset(-1, 14), mentionIds: ['u_rufus'],
    body: '@Rufus still blocked — we need read access to their shipping app settings to compare rate tables. Can you chase Marcus?',
  },
  {
    id: 'cm_9', authorId: 'u_rufus', projectId: 'p_wp_bug', createdAt: timestampOffset(-1, 16, 45), mentionIds: [],
    body: 'Chased on Slack. They expect to grant access tomorrow morning their time. I moved the revised due date out by a day.',
  },
  // MM-34
  {
    id: 'cm_10', authorId: 'u_jordan', taskId: 't_mm34_2', projectId: 'p_mm_engrave', createdAt: timestampOffset(-1, 12), mentionIds: ['u_sarthak'],
    body: 'Returning to dev: on iOS with predictive text, the field accepts 21 characters. Logged as MM-B3. @Sarthak Chatterjee',
  },
  // WF-58
  {
    id: 'cm_11', authorId: 'u_priya', projectId: 'p_wf_home', createdAt: timestampOffset(-2, 15), mentionIds: [],
    body: 'Hi-fi hero is in Figma. Gift guide modules will be ready for internal review on Thursday.',
  },
]

/**
 * Seed activity events. New events are appended at runtime through `logActivity`.
 * TODO(AUDIT): Persist activity events and enforce audit-log access rules.
 */
export const seedActivity: ActivityEvent[] = [
  { id: 'a_p1_1', type: 'project_created', actorId: 'u_rufus', projectId: 'p_sf_p1', clientId: 'c_shepherds', createdAt: timestampOffset(-130, 10), meta: {} },
  { id: 'a_p1_2', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_sf_p1', createdAt: timestampOffset(-118, 9), meta: { field: 'project', from: 'ready_to_start', to: 'in_progress' } },
  { id: 'a_p1_3', type: 'status_changed', actorId: 'u_sarthak', projectId: 'p_sf_p1', createdAt: timestampOffset(-109, 18), meta: { field: 'project', from: 'in_progress', to: 'quality_inspection' } },
  { id: 'a_p1_4', type: 'bug_created', actorId: 'u_jordan', projectId: 'p_sf_p1', createdAt: timestampOffset(-108, 11, 40), meta: { title: 'Mobile drawer overlaps the announcement bar on iPhone' } },
  { id: 'a_p1_5', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_sf_p1', createdAt: timestampOffset(-105, 15), meta: { field: 'project', from: 'quality_inspection', to: 'done' } },
  { id: 'a_p1_6', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_sf_p1', createdAt: timestampOffset(-60, 11), meta: { field: 'project', from: 'done', to: 'archive' } },
  { id: 'a_mic_1', type: 'project_created', actorId: 'u_rufus', projectId: 'p_sf_mic', clientId: 'c_shepherds', createdAt: timestampOffset(-6, 10), meta: {} },
  { id: 'a_mic_2', type: 'status_changed', actorId: 'u_sarthak', projectId: 'p_sf_mic', taskId: 't_sf110_1', createdAt: hoursAgo(18.1), meta: { field: 'task', from: 'in_progress', to: 'ready_for_qi' } },
  { id: 'a_mic_3', type: 'comment_added', actorId: 'u_sarthak', projectId: 'p_sf_mic', taskId: 't_sf110_1', createdAt: hoursAgo(18), meta: { commentId: 'cm_handoff_mic' } },
  { id: 'a_mic_4', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_sf_mic', createdAt: hoursAgo(17), meta: { field: 'project', from: 'in_progress', to: 'quality_inspection' } },
  // SF-104 lifecycle with explicit dates
  { id: 'a_1', type: 'project_created', actorId: 'u_rufus', projectId: 'p_sf_sbv', clientId: 'c_shepherds', createdAt: '2026-10-12T09:15:00.000Z', meta: {} },
  { id: 'a_2', type: 'task_created', actorId: 'u_rufus', projectId: 'p_sf_sbv', taskId: 't_sf104_1', createdAt: '2026-10-12T09:30:00.000Z', meta: { title: 'Shop by video page' } },
  { id: 'a_3', type: 'task_created', actorId: 'u_rufus', projectId: 'p_sf_sbv', taskId: 't_sf104_2', createdAt: '2026-10-12T09:32:00.000Z', meta: { title: 'Video-Text Section in Collection Pages' } },
  { id: 'a_4', type: 'assignee_changed', actorId: 'u_alex', projectId: 'p_sf_sbv', taskId: 't_sf104_1', createdAt: '2026-10-13T10:06:00.000Z', meta: { from: null, to: 'u_sarthak' } },
  { id: 'a_5', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_sf_sbv', createdAt: '2026-10-21T08:30:00.000Z', meta: { field: 'project', from: 'ready_to_start', to: 'in_progress' } },
  { id: 'a_6', type: 'status_changed', actorId: 'u_sarthak', projectId: 'p_sf_sbv', taskId: 't_sf104_2', createdAt: '2026-10-24T17:00:00.000Z', meta: { field: 'task', from: 'in_progress', to: 'ready_for_qi' } },
  { id: 'a_7', type: 'qi_result', actorId: 'u_jordan', projectId: 'p_sf_sbv', taskId: 't_sf104_2', createdAt: '2026-10-25T11:10:00.000Z', meta: { result: 'changes_requested', round: 1 } },
  { id: 'a_8', type: 'bug_created', actorId: 'u_jordan', projectId: 'p_sf_sbv', taskId: 't_sf104_2', createdAt: '2026-10-25T11:12:00.000Z', meta: { title: 'Video does not autoplay on iOS Safari' } },
  { id: 'a_9', type: 'comment_added', actorId: 'u_sarthak', projectId: 'p_sf_sbv', taskId: 't_sf104_2', createdAt: '2026-10-25T13:20:00.000Z', meta: { commentId: 'cm_3' } },
  { id: 'a_10', type: 'task_completed', actorId: 'u_sarthak', projectId: 'p_sf_sbv', taskId: 't_sf104_1', createdAt: '2026-10-26T12:00:00.000Z', meta: {} },
  { id: 'a_11', type: 'qi_result', actorId: 'u_jordan', projectId: 'p_sf_sbv', taskId: 't_sf104_2', createdAt: '2026-10-26T15:05:00.000Z', meta: { result: 'passed', round: 2 } },
  { id: 'a_12', type: 'task_completed', actorId: 'u_jordan', projectId: 'p_sf_sbv', taskId: 't_sf104_4', createdAt: '2026-10-27T14:20:00.000Z', meta: {} },
  { id: 'a_13', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_sf_sbv', createdAt: '2026-10-27T16:40:00.000Z', meta: { field: 'project', from: 'quality_inspection', to: 'done' } },

  // Recent activity across the workspace
  { id: 'a_20', type: 'status_changed', actorId: 'u_sarthak', projectId: 'p_wp_bfcm', taskId: 't_wp221_3', createdAt: timestampOffset(0, 9, 28), meta: { field: 'task', from: 'in_progress', to: 'ready_for_qi' } },
  { id: 'a_21', type: 'comment_added', actorId: 'u_sarthak', projectId: 'p_wp_bfcm', taskId: 't_wp221_3', createdAt: timestampOffset(0, 9, 30), meta: { commentId: 'cm_7' } },
  { id: 'a_22', type: 'qi_started', actorId: 'u_jordan', projectId: 'p_mm_engrave', taskId: 't_mm34_1', createdAt: timestampOffset(0, 8, 45), meta: { round: 1 } },
  { id: 'a_23', type: 'qi_result', actorId: 'u_jordan', projectId: 'p_mm_engrave', taskId: 't_mm34_2', createdAt: timestampOffset(-1, 12), meta: { result: 'changes_requested', round: 1 } },
  { id: 'a_24', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_mm_engrave', createdAt: timestampOffset(-2, 10), meta: { field: 'project', from: 'in_progress', to: 'quality_inspection' } },
  { id: 'a_25', type: 'due_date_changed', actorId: 'u_rufus', projectId: 'p_wp_bug', createdAt: timestampOffset(-1, 16, 40), meta: { field: 'revisedDueDate', from: dayOffset(-2), to: dayOffset(1) } },
  { id: 'a_26', type: 'status_changed', actorId: 'u_alex', projectId: 'p_wp_bug', taskId: 't_wp224_1', createdAt: timestampOffset(-2, 11), meta: { field: 'task', from: 'in_progress', to: 'blocked' } },
  { id: 'a_27', type: 'comment_added', actorId: 'u_alex', projectId: 'p_wp_bug', createdAt: timestampOffset(-1, 14), meta: { commentId: 'cm_8' } },
  { id: 'a_28', type: 'task_completed', actorId: 'u_alex', projectId: 'p_wp_bfcm', taskId: 't_wp221_2a', createdAt: timestampOffset(-2, 15), meta: {} },
  { id: 'a_29', type: 'assignee_changed', actorId: 'u_alex', projectId: 'p_sf_p5', taskId: 't_sf105_2', createdAt: timestampOffset(-1, 9), meta: { from: 'u_alex', to: 'u_sarthak' } },
  { id: 'a_30', type: 'project_created', actorId: 'u_taylor', projectId: 'p_pp_onboard', clientId: 'c_petplanet', createdAt: timestampOffset(-3, 10), meta: {} },
  { id: 'a_31', type: 'project_created', actorId: 'u_jordan', projectId: 'p_pp_qa', clientId: 'c_petplanet', createdAt: timestampOffset(-2, 16), meta: {} },
  { id: 'a_32', type: 'comment_added', actorId: 'u_priya', projectId: 'p_wf_home', createdAt: timestampOffset(-2, 15), meta: { commentId: 'cm_11' } },
  { id: 'a_33', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_mbg_filters', createdAt: timestampOffset(-1, 11), meta: { field: 'project', from: 'in_progress', to: 'pause' } },
  { id: 'a_34', type: 'link_added', actorId: 'u_priya', projectId: 'p_wf_home', createdAt: timestampOffset(-2, 15, 5), meta: { title: 'WonderFold Holiday Homepage — Figma' } },
  { id: 'a_35', type: 'task_completed', actorId: 'u_maya', projectId: 'p_mm_cro', taskId: 't_mm33_1', createdAt: timestampOffset(-4, 17), meta: {} },
  { id: 'a_36', type: 'status_changed', actorId: 'u_rufus', projectId: 'p_mbg_mig1', createdAt: timestampOffset(-18, 17), meta: { field: 'project', from: 'quality_inspection', to: 'done' } },
  { id: 'a_37', type: 'project_created', actorId: 'u_rufus', projectId: 'p_sf_p5', clientId: 'c_shepherds', createdAt: timestampOffset(-14, 11), meta: {} },
]

/**
 * TODO(NOTIFICATIONS): Replace local notifications with persistent server-side events.
 * TODO(EMAIL-SLACK): Fan out the same events to email digests and the client Slack channels
 * based on per-user notification preferences.
 */
export const seedNotifications: Notification[] = [
  { id: 'n_mic', userId: 'u_jordan', type: 'mention', title: 'Sarthak Chatterjee shared 8 QI steps on SF-110', body: 'Made in Canada Badge — branch, preview theme, video and image proof attached.', createdAt: hoursAgo(18), read: false, actorId: 'u_sarthak', ref: { kind: 'task', id: 't_sf110_1' } },
  // Rufus
  { id: 'n_1', userId: 'u_rufus', type: 'comment', title: 'Alex Morgan commented on WP-224', body: 'Still blocked — we need read access to their shipping app settings…', createdAt: timestampOffset(-1, 14), read: false, actorId: 'u_alex', ref: { kind: 'project', id: 'p_wp_bug' } },
  { id: 'n_2', userId: 'u_rufus', type: 'overdue', title: 'WP-224 is past its original due date', body: 'Checkout Shipping Rate Mismatch — revised due date set.', createdAt: timestampOffset(-1, 8), read: false, ref: { kind: 'project', id: 'p_wp_bug' } },
  { id: 'n_3', userId: 'u_rufus', type: 'deadline_approaching', title: 'Client review round 1 due in 3 days', body: 'WonderFold - Holiday Homepage Redesign', createdAt: timestampOffset(0, 7), read: false, ref: { kind: 'task', id: 't_wf58_3' } },
  { id: 'n_4', userId: 'u_rufus', type: 'mention', title: 'Jordan Lee mentioned you', body: 'QI passed on all devices. Good to publish.', createdAt: '2026-10-27T14:25:00.000Z', read: true, actorId: 'u_jordan', ref: { kind: 'project', id: 'p_sf_sbv' } },
  // Sarthak
  { id: 'n_5', userId: 'u_sarthak', type: 'qi_returned', title: 'Task returned from QI', body: 'Font selector with character limit — changes requested (MM-B3).', createdAt: timestampOffset(-1, 12), read: false, actorId: 'u_jordan', ref: { kind: 'task', id: 't_mm34_2' } },
  { id: 'n_6', userId: 'u_sarthak', type: 'task_assigned', title: 'Alex Morgan assigned you a task', body: 'Cart drawer with upsell slots (SF-105-2)', createdAt: timestampOffset(-1, 9), read: false, actorId: 'u_alex', ref: { kind: 'task', id: 't_sf105_2' } },
  { id: 'n_7', userId: 'u_sarthak', type: 'mention', title: 'Rufus mentioned you on WP-221', body: 'The client wants the countdown to end at midnight Mountain time…', createdAt: timestampOffset(-3, 11), read: true, actorId: 'u_rufus', ref: { kind: 'project', id: 'p_wp_bfcm' } },
  { id: 'n_8', userId: 'u_sarthak', type: 'deadline_approaching', title: 'Countdown announcement bar is due today', body: 'WOLFPak - BFCM Landing Page & Bundle Builder', createdAt: timestampOffset(0, 7), read: false, ref: { kind: 'task', id: 't_wp221_3' } },
  // Alex
  { id: 'n_9', userId: 'u_alex', type: 'overdue', title: 'Investigate shipping rate mismatch is overdue', body: 'WP-224-1 is blocked and past due.', createdAt: timestampOffset(0, 7), read: false, ref: { kind: 'task', id: 't_wp224_1' } },
  { id: 'n_10', userId: 'u_alex', type: 'comment', title: 'Rufus replied on WP-224', body: 'Chased on Slack. They expect to grant access tomorrow…', createdAt: timestampOffset(-1, 16, 45), read: false, actorId: 'u_rufus', ref: { kind: 'project', id: 'p_wp_bug' } },
  // Jordan
  { id: 'n_11', userId: 'u_jordan', type: 'status_changed', title: 'Countdown announcement bar is ready for QI', body: 'Submitted by Sarthak Chatterjee', createdAt: timestampOffset(0, 9, 28), read: false, actorId: 'u_sarthak', ref: { kind: 'task', id: 't_wp221_3' } },
  { id: 'n_12', userId: 'u_jordan', type: 'task_assigned', title: 'You are QI owner on SF-105', body: 'SF - Release Theme Migration Phase 5: PDP & Cart Drawer', createdAt: timestampOffset(-13, 11), read: true, actorId: 'u_rufus', ref: { kind: 'project', id: 'p_sf_p5' } },
  // Priya
  { id: 'n_13', userId: 'u_priya', type: 'deadline_approaching', title: 'Hi-fi hero & gift guide due in 2 days', body: 'WonderFold - Holiday Homepage Redesign', createdAt: timestampOffset(0, 7), read: false, ref: { kind: 'task', id: 't_wf58_2' } },
  { id: 'n_14', userId: 'u_priya', type: 'status_changed', title: 'MBG-14 was put on hold', body: 'Collection Filters Enhancement — client evaluating apps.', createdAt: timestampOffset(-1, 11), read: true, actorId: 'u_rufus', ref: { kind: 'project', id: 'p_mbg_filters' } },
  // Maya, Chris, Taylor
  { id: 'n_15', userId: 'u_maya', type: 'deadline_approaching', title: 'Personalisation funnel analysis due in 2 days', body: 'Made by Mary - Personalisation Flow CRO Audit', createdAt: timestampOffset(0, 7), read: false, ref: { kind: 'task', id: 't_mm33_2' } },
  { id: 'n_16', userId: 'u_chris', type: 'deadline_approaching', title: 'Mid-test readout due in 2 days', body: 'WonderFold - PDP Sticky Add-to-Cart Experiment', createdAt: timestampOffset(0, 7), read: false, ref: { kind: 'task', id: 't_wf61_3' } },
  { id: 'n_17', userId: 'u_taylor', type: 'task_assigned', title: 'Kickoff call & access checklist', body: 'Pet Planet - Store Onboarding & Theme Audit', createdAt: timestampOffset(-3, 10, 5), read: false, ref: { kind: 'task', id: 't_pp01_1' } },
  { id: 'n_18', userId: 'u_taylor', type: 'overdue', title: 'WP-224 is past its original due date', body: 'Checkout Shipping Rate Mismatch', createdAt: timestampOffset(-1, 8), read: false, ref: { kind: 'project', id: 'p_wp_bug' } },
]

/**
 * Links and file placeholders. No file bytes exist in the prototype.
 * TODO(FILE-STORAGE): Connect secure file uploads and downloads to the approved storage provider.
 */
export const seedAttachments: Attachment[] = [
  { id: 'at_1', projectId: 'p_sf_sbv', kind: 'figma', title: 'Shop by Video — page design', url: 'https://figma.example/file/sf-shop-by-video', addedById: 'u_rufus', createdAt: '2026-10-12T09:45:00.000Z' },
  { id: 'at_2', projectId: 'p_sf_sbv', kind: 'github', title: 'PR #412 — Shop by Video page + Video-Text section', url: 'https://github.example/ecom/shepherds-theme/pull/412', addedById: 'u_sarthak', createdAt: '2026-10-24T16:50:00.000Z' },
  { id: 'at_3', projectId: 'p_sf_sbv', kind: 'client_portal', title: 'Client portal — SF-104', url: 'https://portal.ecomworkspace.example/c/shepherds-fashion/projects/sf-104', addedById: 'u_rufus', createdAt: '2026-10-12T09:20:00.000Z' },
  { id: 'at_4', projectId: 'p_sf_sbv', kind: 'file', title: 'Video asset list', fileName: 'shop-by-video-assets.xlsx', fileSizeBytes: 48_200, addedById: 'u_rufus', createdAt: '2026-10-12T09:50:00.000Z' },
  { id: 'at_5', projectId: 'p_sf_sbv', kind: 'design_reference', title: 'Reference: competitor video commerce page', url: 'https://reference.example/video-commerce', addedById: 'u_rufus', createdAt: '2026-10-12T09:52:00.000Z' },
  { id: 'at_p1_1', projectId: 'p_sf_p1', kind: 'github', title: 'PR #351 — Release header, mega menu & footer', url: 'https://github.example/ecom/shepherds-theme/pull/351', addedById: 'u_sarthak', createdAt: timestampOffset(-109, 18) },
  { id: 'at_p1_2', projectId: 'p_sf_p1', kind: 'client_portal', title: 'Client portal — SF-101', url: 'https://portal.ecomworkspace.example/c/shepherds-fashion/projects/sf-101', addedById: 'u_rufus', createdAt: timestampOffset(-125, 10) },
  { id: 'at_6', projectId: 'p_wp_bfcm', kind: 'figma', title: 'BFCM landing page — final', url: 'https://figma.example/file/wp-bfcm-2026', addedById: 'u_priya', createdAt: timestampOffset(-5, 16) },
  { id: 'at_7', projectId: 'p_wp_bfcm', kind: 'github', title: 'PR #88 — Countdown bar', url: 'https://github.example/ecom/wolfpak-theme/pull/88', addedById: 'u_sarthak', createdAt: timestampOffset(0, 9) },
  { id: 'at_8', projectId: 'p_wf_home', kind: 'figma', title: 'WonderFold Holiday Homepage — Figma', url: 'https://figma.example/file/wf-holiday-home', addedById: 'u_priya', createdAt: timestampOffset(-2, 15, 5) },
  { id: 'at_9', projectId: 'p_mm_engrave', kind: 'github', title: 'PR #57 — Engraving preview', url: 'https://github.example/ecom/madebymary-theme/pull/57', addedById: 'u_sarthak', createdAt: timestampOffset(-3, 18) },
  { id: 'at_10', projectId: 'p_wp_bug', kind: 'file', title: 'Client screenshot — checkout rate', fileName: 'checkout-rate-diff.png', fileSizeBytes: 312_000, addedById: 'u_rufus', createdAt: timestampOffset(-5, 15) },
]
