import type { Task } from '@/types'
import { dayOffset, hoursAgo, timestampOffset } from '@/lib/dates'

type Seed = Pick<Task, 'id' | 'key' | 'projectId' | 'title' | 'status' | 'type'> & Partial<Task>

let order = 0
function task(t: Seed): Task {
  order += 1
  const createdAt = t.createdAt ?? timestampOffset(-10)
  return {
    description: '',
    priority: 'medium',
    reporterId: 'u_alex',
    updatedAt: createdAt,
    order,
    ...t,
    createdAt,
  }
}

/**
 * Seed tasks and subtasks. The first four belong to the Shepherds Fashion reference project
 * and preserve the values from the existing Notion card (task duration → estimatedHours).
 * TODO(NOTION-MIGRATION): Import from the Notion "Tasks & Bugs" database; map "Assigned
 * Developer" → assigneeId, "Task Duration" → estimatedHours, relation → projectId.
 */
export const seedTasks: Task[] = [
  // ── SF-104 Shop by Video (reference project) ──
  task({
    id: 't_sf104_1', key: 'SF-104-1', projectId: 'p_sf_sbv', title: 'Shop by video page', status: 'done', type: 'development',
    description: 'Build the Shop by Video landing page with release theme sections: hero, video grid with product links, and FAQ.',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'medium',
    startDate: '2026-10-21', dueDate: '2026-10-23', estimatedHours: 2.5,
    createdAt: '2026-10-12T09:30:00.000Z', updatedAt: '2026-10-26T12:00:00.000Z', completedAt: '2026-10-26T12:00:00.000Z',
    notionSourceId: 'notion-task-sbv-1',
  }),
  task({
    id: 't_sf104_2', key: 'SF-104-2', projectId: 'p_sf_sbv', title: 'Video-Text Section in Collection Pages', status: 'done', type: 'development',
    description: 'Reusable video + rich text section, placeable on collection templates via the theme editor.',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'medium',
    startDate: '2026-10-22', dueDate: '2026-10-24', estimatedHours: 1.5,
    createdAt: '2026-10-12T09:32:00.000Z', updatedAt: '2026-10-26T15:10:00.000Z', completedAt: '2026-10-26T15:10:00.000Z',
    notionSourceId: 'notion-task-sbv-2',
  }),
  task({
    id: 't_sf104_3', key: 'SF-104-3', projectId: 'p_sf_sbv', title: 'Buffer', status: 'done', type: 'buffer',
    description: 'Buffer time for QI feedback and client tweaks.',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'low',
    dueDate: '2026-10-26', estimatedHours: 1,
    createdAt: '2026-10-12T09:33:00.000Z', updatedAt: '2026-10-26T16:00:00.000Z', completedAt: '2026-10-26T16:00:00.000Z',
  }),
  task({
    id: 't_sf104_4', key: 'SF-104-4', projectId: 'p_sf_sbv', title: 'Quality Inspection', status: 'done', type: 'quality_inspection',
    description: 'Cross-browser and device QI for the Shop by Video page and Video-Text section.',
    assigneeId: 'u_jordan', reporterId: 'u_rufus', priority: 'medium',
    dueDate: '2026-10-27', estimatedHours: 1,
    createdAt: '2026-10-12T09:34:00.000Z', updatedAt: '2026-10-27T14:20:00.000Z', completedAt: '2026-10-27T14:20:00.000Z',
  }),

  // ── SF-105 PDP & Cart Drawer ──
  task({
    id: 't_sf105_1', key: 'SF-105-1', projectId: 'p_sf_p5', title: 'PDP main product section rebuild', status: 'in_progress', type: 'development',
    description: 'Rebuild the main product section on the release theme. Broken into subtasks for variant picker, media gallery and sticky ATC.',
    assigneeId: 'u_sarthak', reporterId: 'u_alex', priority: 'high',
    startDate: dayOffset(-5), dueDate: dayOffset(3), estimatedHours: 6, actualHours: 3.5, createdAt: timestampOffset(-13),
  }),
  task({
    id: 't_sf105_1a', key: 'SF-105-1.1', projectId: 'p_sf_p5', parentTaskId: 't_sf105_1', title: 'Variant picker with colour swatches', status: 'done', type: 'development',
    assigneeId: 'u_sarthak', priority: 'high', startDate: dayOffset(-5), dueDate: dayOffset(-3), estimatedHours: 2, actualHours: 2,
    completedAt: timestampOffset(-3, 17), createdAt: timestampOffset(-13),
  }),
  task({
    id: 't_sf105_1b', key: 'SF-105-1.2', projectId: 'p_sf_p5', parentTaskId: 't_sf105_1', title: 'Media gallery with video support', status: 'in_progress', type: 'development',
    assigneeId: 'u_sarthak', priority: 'high', startDate: dayOffset(-2), dueDate: dayOffset(1), estimatedHours: 2, actualHours: 1.5, createdAt: timestampOffset(-13),
  }),
  task({
    id: 't_sf105_1c', key: 'SF-105-1.3', projectId: 'p_sf_p5', parentTaskId: 't_sf105_1', title: 'Sticky add-to-cart bar (mobile)', status: 'backlog', type: 'development',
    assigneeId: 'u_sarthak', priority: 'medium', dueDate: dayOffset(3), estimatedHours: 2, createdAt: timestampOffset(-13),
  }),
  task({
    id: 't_sf105_2', key: 'SF-105-2', projectId: 'p_sf_p5', title: 'Cart drawer with upsell slots', status: 'ready', type: 'development',
    description: 'Slide-out cart drawer with free-shipping progress bar and two upsell slots driven by product metafields.',
    assigneeId: 'u_sarthak', reporterId: 'u_alex', priority: 'high', startDate: dayOffset(3), dueDate: dayOffset(6), estimatedHours: 5, createdAt: timestampOffset(-13),
  }),
  task({
    id: 't_sf105_3', key: 'SF-105-3', projectId: 'p_sf_p5', title: 'Size guide modal (metaobjects)', status: 'in_review', type: 'development',
    description: 'Size guide content moved to metaobjects and rendered in an accessible modal.',
    assigneeId: 'u_alex', reporterId: 'u_alex', priority: 'medium', startDate: dayOffset(-4), dueDate: dayOffset(-1), estimatedHours: 1.5, actualHours: 1.5, createdAt: timestampOffset(-13),
  }),
  task({
    id: 't_sf105_4', key: 'SF-105-4', projectId: 'p_sf_p5', title: 'Buffer', status: 'backlog', type: 'buffer',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'low', dueDate: dayOffset(8), estimatedHours: 2, createdAt: timestampOffset(-13),
  }),
  task({
    id: 't_sf105_5', key: 'SF-105-5', projectId: 'p_sf_p5', title: 'Quality Inspection', status: 'backlog', type: 'quality_inspection',
    assigneeId: 'u_jordan', reporterId: 'u_rufus', priority: 'medium', dueDate: dayOffset(9), estimatedHours: 2, createdAt: timestampOffset(-13),
  }),

  // ── WP-221 BFCM ──
  task({
    id: 't_wp221_1', key: 'WP-221-1', projectId: 'p_wp_bfcm', title: 'BFCM landing page design', status: 'done', type: 'design',
    description: 'Desktop + mobile designs for the BFCM landing page, including bundle builder steps.',
    assigneeId: 'u_priya', reporterId: 'u_rufus', priority: 'urgent', startDate: dayOffset(-10), dueDate: dayOffset(-4),
    estimatedHours: 6, actualHours: 7, completedAt: timestampOffset(-5, 16), createdAt: timestampOffset(-17),
  }),
  task({
    id: 't_wp221_2', key: 'WP-221-2', projectId: 'p_wp_bfcm', title: 'Bundle builder (build-your-own kit)', status: 'in_progress', type: 'development',
    description: 'Three-step bundle builder: choose items, review bundle, add to cart with tiered discount.',
    assigneeId: 'u_alex', reporterId: 'u_alex', priority: 'urgent', startDate: dayOffset(-4), dueDate: dayOffset(5),
    estimatedHours: 10, actualHours: 5, createdAt: timestampOffset(-16),
  }),
  task({
    id: 't_wp221_2a', key: 'WP-221-2.1', projectId: 'p_wp_bfcm', parentTaskId: 't_wp221_2', title: 'Product selection step', status: 'done', type: 'development',
    assigneeId: 'u_alex', priority: 'urgent', startDate: dayOffset(-4), dueDate: dayOffset(-2), estimatedHours: 3, actualHours: 3, completedAt: timestampOffset(-2, 15), createdAt: timestampOffset(-16),
  }),
  task({
    id: 't_wp221_2b', key: 'WP-221-2.2', projectId: 'p_wp_bfcm', parentTaskId: 't_wp221_2', title: 'Tiered bundle discount (Shopify Functions)', status: 'in_progress', type: 'development',
    assigneeId: 'u_sarthak', priority: 'urgent', startDate: dayOffset(-1), dueDate: dayOffset(3), estimatedHours: 4, actualHours: 2, createdAt: timestampOffset(-16),
  }),
  task({
    id: 't_wp221_2c', key: 'WP-221-2.3', projectId: 'p_wp_bfcm', parentTaskId: 't_wp221_2', title: 'Bundle summary & add to cart', status: 'backlog', type: 'development',
    assigneeId: 'u_alex', priority: 'high', dueDate: dayOffset(5), estimatedHours: 3, createdAt: timestampOffset(-16),
  }),
  task({
    id: 't_wp221_3', key: 'WP-221-3', projectId: 'p_wp_bfcm', title: 'Countdown announcement bar', status: 'ready_for_qi', type: 'development',
    description: 'Sitewide countdown bar driven by a metaobject with start/end times in store timezone.',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'high', startDate: dayOffset(-2), dueDate: dayOffset(0),
    estimatedHours: 1.5, actualHours: 1.5, createdAt: timestampOffset(-15),
  }),
  task({
    id: 't_wp221_4', key: 'WP-221-4', projectId: 'p_wp_bfcm', title: 'Quality Inspection', status: 'backlog', type: 'quality_inspection',
    assigneeId: 'u_jordan', reporterId: 'u_rufus', priority: 'high', dueDate: dayOffset(10), estimatedHours: 3, createdAt: timestampOffset(-15),
  }),

  // ── WP-224 Shipping bug ──
  task({
    id: 't_wp224_1', key: 'WP-224-1', projectId: 'p_wp_bug', title: 'Investigate shipping rate mismatch at checkout', status: 'blocked', type: 'bug',
    description: 'Blocked: waiting on the client to share read access to their carrier-calculated shipping app so rates can be compared.',
    assigneeId: 'u_alex', reporterId: 'u_rufus', priority: 'high', startDate: dayOffset(-4), dueDate: dayOffset(-2),
    estimatedHours: 2, actualHours: 2.5, createdAt: timestampOffset(-5, 15),
  }),
  task({
    id: 't_wp224_2', key: 'WP-224-2', projectId: 'p_wp_bug', title: 'Patch rate rounding in cart estimator', status: 'backlog', type: 'bug',
    assigneeId: 'u_sarthak', reporterId: 'u_alex', priority: 'high', dueDate: dayOffset(1), estimatedHours: 2, createdAt: timestampOffset(-4),
  }),

  // ── WF-58 Holiday homepage ──
  task({
    id: 't_wf58_1', key: 'WF-58-1', projectId: 'p_wf_home', title: 'Homepage wireframes', status: 'done', type: 'design',
    assigneeId: 'u_priya', reporterId: 'u_rufus', priority: 'high', startDate: dayOffset(-8), dueDate: dayOffset(-5),
    estimatedHours: 4, actualHours: 4, completedAt: timestampOffset(-5, 14), createdAt: timestampOffset(-11),
  }),
  task({
    id: 't_wf58_2', key: 'WF-58-2', projectId: 'p_wf_home', title: 'Holiday hero & gift guide modules (hi-fi)', status: 'in_progress', type: 'design',
    description: 'High-fidelity designs for the hero, gift guide by family size, and reviews carousel.',
    assigneeId: 'u_priya', reporterId: 'u_rufus', priority: 'high', startDate: dayOffset(-4), dueDate: dayOffset(2),
    estimatedHours: 8, actualHours: 5, createdAt: timestampOffset(-11),
  }),
  task({
    id: 't_wf58_3', key: 'WF-58-3', projectId: 'p_wf_home', title: 'Client review round 1', status: 'ready', type: 'account_management',
    assigneeId: 'u_rufus', reporterId: 'u_rufus', priority: 'medium', dueDate: dayOffset(3), estimatedHours: 1, createdAt: timestampOffset(-11),
  }),
  task({
    id: 't_wf58_4', key: 'WF-58-4', projectId: 'p_wf_home', title: 'Design handoff to development', status: 'backlog', type: 'design',
    assigneeId: 'u_priya', reporterId: 'u_rufus', priority: 'medium', dueDate: dayOffset(6), estimatedHours: 2, createdAt: timestampOffset(-11),
  }),

  // ── WF-61 Sticky ATC experiment ──
  task({
    id: 't_wf61_1', key: 'WF-61-1', projectId: 'p_wf_ab', title: 'Build sticky ATC variant', status: 'done', type: 'development',
    assigneeId: 'u_sarthak', reporterId: 'u_chris', priority: 'medium', startDate: dayOffset(-14), dueDate: dayOffset(-12),
    estimatedHours: 3, actualHours: 2.5, completedAt: timestampOffset(-12, 13), createdAt: timestampOffset(-19),
  }),
  task({
    id: 't_wf61_2', key: 'WF-61-2', projectId: 'p_wf_ab', title: 'Configure experiment & verify tracking', status: 'done', type: 'ab_test',
    assigneeId: 'u_chris', reporterId: 'u_chris', priority: 'medium', startDate: dayOffset(-11), dueDate: dayOffset(-10),
    estimatedHours: 2, actualHours: 2, completedAt: timestampOffset(-10, 11), createdAt: timestampOffset(-19),
  }),
  task({
    id: 't_wf61_3', key: 'WF-61-3', projectId: 'p_wf_ab', title: 'Mid-test readout for client', status: 'in_progress', type: 'ab_test',
    assigneeId: 'u_chris', reporterId: 'u_chris', priority: 'medium', startDate: dayOffset(-1), dueDate: dayOffset(2), estimatedHours: 2, actualHours: 0.5, createdAt: timestampOffset(-19),
  }),

  // ── MM-33 CRO audit ──
  task({
    id: 't_mm33_1', key: 'MM-33-1', projectId: 'p_mm_cro', title: 'Heatmap & session recording review', status: 'done', type: 'cro',
    assigneeId: 'u_maya', reporterId: 'u_maya', priority: 'medium', startDate: dayOffset(-7), dueDate: dayOffset(-4),
    estimatedHours: 4, actualHours: 4.5, completedAt: timestampOffset(-4, 17), createdAt: timestampOffset(-8),
  }),
  task({
    id: 't_mm33_2', key: 'MM-33-2', projectId: 'p_mm_cro', title: 'Personalisation funnel analysis', status: 'in_progress', type: 'cro',
    assigneeId: 'u_maya', reporterId: 'u_maya', priority: 'high', startDate: dayOffset(-3), dueDate: dayOffset(2), estimatedHours: 5, actualHours: 2, createdAt: timestampOffset(-8),
  }),
  task({
    id: 't_mm33_3', key: 'MM-33-3', projectId: 'p_mm_cro', title: 'Recommendations deck', status: 'backlog', type: 'cro',
    assigneeId: 'u_maya', reporterId: 'u_maya', priority: 'medium', dueDate: dayOffset(6), estimatedHours: 3, createdAt: timestampOffset(-8),
  }),

  // ── MM-34 Engraving preview ──
  task({
    id: 't_mm34_1', key: 'MM-34-1', projectId: 'p_mm_engrave', title: 'Live engraving preview on PDP', status: 'ready_for_qi', type: 'development',
    description: 'Canvas-based preview that renders the engraving text on the product image as the customer types.',
    assigneeId: 'u_sarthak', reporterId: 'u_alex', priority: 'high', startDate: dayOffset(-12), dueDate: dayOffset(-3),
    estimatedHours: 8, actualHours: 9, createdAt: timestampOffset(-15),
  }),
  task({
    id: 't_mm34_2', key: 'MM-34-2', projectId: 'p_mm_engrave', title: 'Font selector with character limit', status: 'in_progress', type: 'development',
    description: 'Returned from QI: character limit not enforced on mobile keyboards with autocomplete. See bug MM-B3.',
    assigneeId: 'u_sarthak', reporterId: 'u_alex', priority: 'high', startDate: dayOffset(-6), dueDate: dayOffset(-1),
    estimatedHours: 3, actualHours: 3.5, createdAt: timestampOffset(-15),
  }),
  task({
    id: 't_mm34_3', key: 'MM-34-3', projectId: 'p_mm_engrave', title: 'Quality Inspection', status: 'in_progress', type: 'quality_inspection',
    assigneeId: 'u_jordan', reporterId: 'u_rufus', priority: 'high', dueDate: dayOffset(0), estimatedHours: 2, actualHours: 1, createdAt: timestampOffset(-15),
  }),

  // ── PP-01 Onboarding ──
  task({
    id: 't_pp01_1', key: 'PP-01-1', projectId: 'p_pp_onboard', title: 'Kickoff call & access checklist', status: 'ready', type: 'account_management',
    assigneeId: 'u_taylor', reporterId: 'u_taylor', priority: 'high', dueDate: dayOffset(2), estimatedHours: 1.5, createdAt: timestampOffset(-3),
  }),
  task({
    id: 't_pp01_2', key: 'PP-01-2', projectId: 'p_pp_onboard', title: 'Theme & app stack audit', status: 'backlog', type: 'development',
    assigneeId: 'u_alex', reporterId: 'u_taylor', priority: 'medium', startDate: dayOffset(4), dueDate: dayOffset(9), estimatedHours: 6, createdAt: timestampOffset(-3),
  }),

  // ── MBG-12 Migration phase 1 (completed, late vs original due date) ──
  task({
    id: 't_mbg12_1', key: 'MBG-12-1', projectId: 'p_mbg_mig1', title: 'Header, footer & mega menu', status: 'done', type: 'development',
    assigneeId: 'u_sarthak', reporterId: 'u_alex', priority: 'medium', startDate: dayOffset(-40), dueDate: dayOffset(-30),
    estimatedHours: 6, actualHours: 7, completedAt: timestampOffset(-24, 12), createdAt: timestampOffset(-47),
  }),
  task({
    id: 't_mbg12_2', key: 'MBG-12-2', projectId: 'p_mbg_mig1', title: 'Collection & search templates', status: 'done', type: 'development',
    assigneeId: 'u_alex', reporterId: 'u_alex', priority: 'medium', startDate: dayOffset(-32), dueDate: dayOffset(-24),
    estimatedHours: 8, actualHours: 9.5, completedAt: timestampOffset(-22, 16), createdAt: timestampOffset(-47),
  }),
  task({
    id: 't_mbg12_3', key: 'MBG-12-3', projectId: 'p_mbg_mig1', title: 'Buffer', status: 'done', type: 'buffer',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'low', dueDate: dayOffset(-21), estimatedHours: 2, actualHours: 2, completedAt: timestampOffset(-20, 15), createdAt: timestampOffset(-47),
  }),
  task({
    id: 't_mbg12_4', key: 'MBG-12-4', projectId: 'p_mbg_mig1', title: 'Quality Inspection', status: 'done', type: 'quality_inspection',
    assigneeId: 'u_jordan', reporterId: 'u_rufus', priority: 'medium', dueDate: dayOffset(-19), estimatedHours: 3, actualHours: 3.5, completedAt: timestampOffset(-19, 13), createdAt: timestampOffset(-47),
  }),

  // ── SF-101 Phase 1 header & footer (archived card; QI task never got a date) ──
  task({
    id: 't_sf101_1', key: 'SF-101-1', projectId: 'p_sf_p1', title: 'Header, mega menu & mobile drawer', status: 'done', type: 'development',
    description: 'Release theme header with sticky behaviour, mega menu tiles from collection metafields and nested mobile drawer.',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', startDate: dayOffset(-118), dueDate: dayOffset(-112),
    estimatedHours: 6, actualHours: 6.5, createdAt: timestampOffset(-125, 10), completedAt: timestampOffset(-112, 17),
  }),
  task({
    id: 't_sf101_2', key: 'SF-101-2', projectId: 'p_sf_p1', title: 'Announcement bar & footer', status: 'done', type: 'development',
    description: 'Rotating announcement bar (theme settings) and four-column footer with newsletter signup.',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', startDate: dayOffset(-112), dueDate: dayOffset(-110),
    estimatedHours: 4, actualHours: 3.5, createdAt: timestampOffset(-125, 10), completedAt: timestampOffset(-110, 16),
  }),
  task({
    id: 't_sf101_3', key: 'SF-101-3', projectId: 'p_sf_p1', title: 'Buffer', status: 'done', type: 'buffer',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'low', startDate: dayOffset(-108), dueDate: dayOffset(-108),
    estimatedHours: 2, actualHours: 1.5, createdAt: timestampOffset(-125, 10), completedAt: timestampOffset(-108, 15),
  }),
  task({
    id: 't_sf101_4', key: 'SF-101-4', projectId: 'p_sf_p1', title: 'Quality Inspection | SF - Release Theme Migration Phase 1: Header, Footer & Navigation', status: 'backlog', type: 'quality_inspection',
    description: 'Auto-created QI task. Inspection was tracked with the QI Start / QI End buttons on the card, so this task was never scheduled.',
    assigneeId: 'u_jordan', reporterId: 'u_rufus', estimatedHours: 2, createdAt: timestampOffset(-125, 10),
  }),

  // ── SF-110 Made in Canada badge (dev handed off to QI) ──
  task({
    id: 't_sf110_1', key: 'SF-110-1', projectId: 'p_sf_mic', title: 'Rebuild Made in Canada badge', status: 'ready_for_qi', type: 'development',
    description: 'Badge on product cards, PDP first image, cart drawer thumbnail and cart page; sizes in Theme settings. See handoff comment for branch, theme and QI steps.',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'medium', startDate: dayOffset(-4), dueDate: dayOffset(-1),
    estimatedHours: 3, actualHours: 2.75, createdAt: timestampOffset(-6, 10), updatedAt: hoursAgo(18),
  }),
  task({
    id: 't_sf110_2', key: 'SF-110-2', projectId: 'p_sf_mic', title: 'Buffer', status: 'backlog', type: 'buffer',
    assigneeId: 'u_sarthak', reporterId: 'u_rufus', priority: 'low', dueDate: dayOffset(1), estimatedHours: 0.5, createdAt: timestampOffset(-6, 10),
  }),
  task({
    id: 't_sf110_3', key: 'SF-110-3', projectId: 'p_sf_mic', title: 'Quality Inspection', status: 'backlog', type: 'quality_inspection',
    assigneeId: 'u_jordan', reporterId: 'u_rufus', priority: 'medium', dueDate: dayOffset(2), estimatedHours: 1, createdAt: timestampOffset(-6, 10),
  }),

  // ── MBG-14 Filters (on hold) ──
  task({
    id: 't_mbg14_1', key: 'MBG-14-1', projectId: 'p_mbg_filters', title: 'Filter UX spec & mobile drawer design', status: 'on_hold', type: 'design',
    description: 'Paused: client is evaluating the Search & Discovery app against custom filters before we continue.',
    assigneeId: 'u_priya', reporterId: 'u_rufus', priority: 'low', startDate: dayOffset(-3), dueDate: dayOffset(10), estimatedHours: 3, actualHours: 1, createdAt: timestampOffset(-6),
  }),
]
