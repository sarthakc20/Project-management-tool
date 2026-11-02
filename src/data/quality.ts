import type { Bug, QIChecklistItem, QIRecord, QITimeEntry } from '@/types'
import { hoursAgo, timestampOffset } from '@/lib/dates'

export const DEFAULT_QI_CHECKLIST = [
  'Matches approved design on desktop',
  'Matches approved design on mobile',
  'Cross-browser: Chrome, Safari, Firefox',
  'Theme editor settings work as documented',
  'No console errors or broken analytics events',
  'Accessibility basics: focus, labels, contrast',
]

export function makeChecklist(results: QIChecklistItem['result'][] = []): QIChecklistItem[] {
  return DEFAULT_QI_CHECKLIST.map((label, i) => ({ id: `chk_${i + 1}`, label, result: results[i] ?? null }))
}

const ALL_PASS: QIChecklistItem['result'][] = ['pass', 'pass', 'pass', 'pass', 'pass', 'pass']
const DEVICES = ['iPhone 15 · Safari', 'Pixel 8 · Chrome', 'macOS · Chrome', 'macOS · Safari', 'Windows · Firefox']

/**
 * QI records demonstrate the full loop: dev → QI → changes requested → rework → pass.
 * TODO(BACKEND): Persist QI records with an immutable result history per round.
 */
export const seedQIRecords: QIRecord[] = [
  {
    id: 'qi_11', taskId: 't_sf110_1', projectId: 'p_sf_mic', inspectorId: 'u_jordan', status: 'awaiting', round: 1,
    submittedById: 'u_sarthak', submittedAt: hoursAgo(18), notes: '', checklist: makeChecklist(), bugIds: [], devices: [],
  },
  {
    id: 'qi_1', taskId: 't_sf104_1', projectId: 'p_sf_sbv', inspectorId: 'u_jordan', status: 'passed', round: 1,
    submittedById: 'u_sarthak', submittedAt: '2026-10-24T11:00:00.000Z', startedAt: '2026-10-25T09:30:00.000Z', completedAt: '2026-10-25T10:40:00.000Z',
    notes: 'Page matches design. Video grid lazy-loads correctly.', checklist: makeChecklist(ALL_PASS), bugIds: [], devices: DEVICES,
  },
  {
    id: 'qi_2', taskId: 't_sf104_2', projectId: 'p_sf_sbv', inspectorId: 'u_jordan', status: 'changes_requested', round: 1,
    submittedById: 'u_sarthak', submittedAt: '2026-10-24T17:00:00.000Z', startedAt: '2026-10-25T10:45:00.000Z', completedAt: '2026-10-25T11:10:00.000Z',
    notes: 'Video does not autoplay on iOS Safari. Logged SF-B1.', checklist: makeChecklist(['pass', 'fail', 'fail', 'pass', 'pass', 'pass']), bugIds: ['b_1'], devices: DEVICES,
  },
  {
    id: 'qi_3', taskId: 't_sf104_2', projectId: 'p_sf_sbv', inspectorId: 'u_jordan', status: 'passed', round: 2,
    submittedById: 'u_sarthak', submittedAt: '2026-10-25T13:25:00.000Z', startedAt: '2026-10-26T14:30:00.000Z', completedAt: '2026-10-26T15:05:00.000Z',
    notes: 'Autoplay fixed (playsinline + muted). Verified SF-B1.', checklist: makeChecklist(ALL_PASS), bugIds: [], devices: DEVICES,
  },
  {
    id: 'qi_4', taskId: 't_wp221_3', projectId: 'p_wp_bfcm', inspectorId: 'u_jordan', status: 'awaiting', round: 1,
    submittedById: 'u_sarthak', submittedAt: timestampOffset(0, 9, 28),
    notes: '', checklist: makeChecklist(), bugIds: [], devices: [],
  },
  {
    id: 'qi_5', taskId: 't_mm34_1', projectId: 'p_mm_engrave', inspectorId: 'u_jordan', status: 'in_progress', round: 1,
    submittedById: 'u_sarthak', submittedAt: timestampOffset(-2, 17), startedAt: timestampOffset(0, 8, 45),
    notes: 'Desktop checks complete. Mobile in progress.', checklist: makeChecklist(['pass', null, 'pass', 'pass', null, null]), bugIds: [], devices: DEVICES.slice(2),
  },
  {
    id: 'qi_6', taskId: 't_mm34_2', projectId: 'p_mm_engrave', inspectorId: 'u_jordan', status: 'changes_requested', round: 1,
    submittedById: 'u_sarthak', submittedAt: timestampOffset(-2, 17), startedAt: timestampOffset(-1, 10), completedAt: timestampOffset(-1, 12),
    notes: 'Character limit bypassed with iOS predictive text. Returned to dev.', checklist: makeChecklist(['pass', 'fail', 'pass', 'pass', 'pass', 'pass']), bugIds: ['b_3'], devices: DEVICES,
  },
  {
    id: 'qi_7', taskId: 't_mbg12_1', projectId: 'p_mbg_mig1', inspectorId: 'u_jordan', status: 'failed', round: 1,
    submittedById: 'u_sarthak', submittedAt: timestampOffset(-25, 16), startedAt: timestampOffset(-24, 9), completedAt: timestampOffset(-24, 11),
    notes: 'Mega menu overlaps the search drawer on tablet. Logged MBG-B2.', checklist: makeChecklist(['pass', 'fail', 'fail', 'pass', 'pass', 'pass']), bugIds: ['b_4'], devices: DEVICES,
  },
  {
    id: 'qi_8', taskId: 't_mbg12_1', projectId: 'p_mbg_mig1', inspectorId: 'u_jordan', status: 'passed', round: 2,
    submittedById: 'u_sarthak', submittedAt: timestampOffset(-21, 12), startedAt: timestampOffset(-20, 10), completedAt: timestampOffset(-20, 11),
    notes: 'Overlap fixed. Verified on iPad and Galaxy Tab.', checklist: makeChecklist(ALL_PASS), bugIds: [], devices: DEVICES,
  },
  {
    id: 'qi_9', taskId: 't_mbg12_2', projectId: 'p_mbg_mig1', inspectorId: 'u_jordan', status: 'passed', round: 1,
    submittedById: 'u_alex', submittedAt: timestampOffset(-22, 16), startedAt: timestampOffset(-21, 9), completedAt: timestampOffset(-21, 12),
    notes: 'Filters and sort work as expected.', checklist: makeChecklist(ALL_PASS), bugIds: [], devices: DEVICES,
  },
  {
    id: 'qi_10', taskId: 't_wf61_1', projectId: 'p_wf_ab', inspectorId: 'u_jordan', status: 'passed', round: 1,
    submittedById: 'u_sarthak', submittedAt: timestampOffset(-12, 13), startedAt: timestampOffset(-11, 9), completedAt: timestampOffset(-11, 10),
    notes: 'Variant renders only for the test audience. Control untouched.', checklist: makeChecklist(ALL_PASS), bugIds: [], devices: DEVICES,
  },
]

/** QI Start → QI End sessions (Notion "All QI Time Tracker Entries"). */
export const seedQITimeEntries: QITimeEntry[] = [
  { id: 'qit_p1_1', projectId: 'p_sf_p1', inspectorId: 'u_jordan', startedAt: timestampOffset(-108, 10, 2), endedAt: timestampOffset(-108, 10, 54) },
  { id: 'qit_p1_2', projectId: 'p_sf_p1', inspectorId: 'u_jordan', startedAt: timestampOffset(-107, 10, 15), endedAt: timestampOffset(-107, 10, 41) },
  { id: 'qit_p1_3', projectId: 'p_sf_p1', inspectorId: 'u_jordan', startedAt: timestampOffset(-107, 14, 5), endedAt: timestampOffset(-107, 14, 20) },
  { id: 'qit_sbv_1', projectId: 'p_sf_sbv', inspectorId: 'u_jordan', startedAt: '2026-10-25T10:00:00.000Z', endedAt: '2026-10-25T11:10:00.000Z' },
  { id: 'qit_sbv_2', projectId: 'p_sf_sbv', inspectorId: 'u_jordan', startedAt: '2026-10-26T14:30:00.000Z', endedAt: '2026-10-26T14:55:00.000Z' },
]

export const seedBugs: Bug[] = [
  {
    id: 'b_p1_1', key: 'SF-B5', projectId: 'p_sf_p1', taskId: 't_sf101_1',
    title: 'Mobile drawer overlaps the announcement bar on iPhone',
    description: 'With the drawer open, the announcement bar sits on top of the first menu level.',
    stepsToReproduce: '1. Open any page on iPhone\n2. Tap the menu icon\n3. First menu row is hidden behind the announcement bar',
    environment: 'iPhone 15 · iOS 18 · Safari', severity: 'minor', status: 'verified',
    reporterId: 'u_jordan', assigneeId: 'u_sarthak', createdAt: timestampOffset(-108, 11, 40), updatedAt: timestampOffset(-107, 11),
  },
  {
    id: 'b_1', key: 'SF-B1', projectId: 'p_sf_sbv', taskId: 't_sf104_2', qiRecordId: 'qi_2',
    title: 'Video does not autoplay on iOS Safari in Video-Text section',
    description: 'On iOS Safari the video in the Video-Text section shows a play button instead of autoplaying.',
    stepsToReproduce: '1. Open /collections/dresses on iPhone\n2. Scroll to the Video-Text section\n3. Video does not start',
    environment: 'iPhone 15 · iOS 18 · Safari', severity: 'major', status: 'verified',
    reporterId: 'u_jordan', assigneeId: 'u_sarthak', createdAt: '2026-10-25T11:12:00.000Z', updatedAt: '2026-10-26T15:05:00.000Z',
  },
  {
    id: 'b_2', key: 'WP-B7', projectId: 'p_wp_bug', taskId: 't_wp224_1',
    title: 'Cart shipping estimate differs from checkout rate for oversized items',
    description: 'Client reported a rate difference between the cart estimator and checkout for oversized SKUs.',
    stepsToReproduce: '1. Add an oversized item (e.g. 65L duffel) to cart\n2. Estimate shipping to a CA address\n3. Compare with checkout shipping step',
    environment: 'All browsers · production', severity: 'critical', status: 'open',
    reporterId: 'u_rufus', assigneeId: 'u_alex', createdAt: timestampOffset(-5, 15), updatedAt: timestampOffset(-2, 11),
  },
  {
    id: 'b_3', key: 'MM-B3', projectId: 'p_mm_engrave', taskId: 't_mm34_2', qiRecordId: 'qi_6',
    title: 'Engraving field accepts 21 characters with iOS predictive text',
    description: 'Character limit (20) is enforced on keypress but not when predictive text inserts a full word.',
    stepsToReproduce: '1. Open an engravable product on iPhone\n2. Type 18 characters\n3. Tap a predictive text suggestion',
    environment: 'iPhone 15 · iOS 18 · Safari', severity: 'minor', status: 'in_progress',
    reporterId: 'u_jordan', assigneeId: 'u_sarthak', createdAt: timestampOffset(-1, 12), updatedAt: timestampOffset(-1, 12),
  },
  {
    id: 'b_4', key: 'MBG-B2', projectId: 'p_mbg_mig1', taskId: 't_mbg12_1', qiRecordId: 'qi_7',
    title: 'Mega menu overlaps search drawer on tablet',
    description: 'At 768–1024px the mega menu remains open beneath the search drawer.',
    stepsToReproduce: '1. Open site on iPad\n2. Open Shop mega menu\n3. Tap search icon',
    environment: 'iPad Air · Safari', severity: 'major', status: 'verified',
    reporterId: 'u_jordan', assigneeId: 'u_sarthak', createdAt: timestampOffset(-24, 11), updatedAt: timestampOffset(-20, 11),
  },
  {
    id: 'b_5', key: 'WP-B8', projectId: 'p_wp_bfcm', taskId: 't_wp221_3',
    title: 'Countdown bar shifts layout on first paint',
    description: 'Announcement bar renders after hydration and pushes the header down (CLS).',
    stepsToReproduce: '1. Hard refresh the homepage on mobile\n2. Observe header shift',
    environment: 'Mobile · Chrome', severity: 'minor', status: 'open',
    reporterId: 'u_rufus', assigneeId: 'u_sarthak', createdAt: timestampOffset(-1, 17), updatedAt: timestampOffset(-1, 17),
  },
]
