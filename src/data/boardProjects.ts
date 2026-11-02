import type { Project } from '@/types'
import { dayOffset, timestampOffset } from '@/lib/dates'

type CardSeed = Pick<Project, 'id' | 'key' | 'title' | 'clientId' | 'type' | 'status' | 'ownerId' | 'priority'> & Partial<Project>

/** Compact builder for project cards that don't need a task breakdown in the prototype. */
function card(p: CardSeed): Project {
  const createdAt = p.createdAt ?? timestampOffset(-30, 10)
  return {
    description: '',
    requirements: [],
    customFields: [],
    tags: [],
    archived: false,
    developerIds: [],
    designerIds: [],
    pmStatus: 'not_reviewed',
    accountManagerId: 'u_rufus',
    updatedAt: createdAt,
    ...p,
    createdAt,
  }
}

/**
 * Additional projects so each client's status board shows a realistic spread of the Notion
 * statuses: earlier migration phases (Done / Archive Soon / Archive), upcoming ideas, and work
 * sitting in review, QI-fix and release stages.
 */
export const seedBoardProjects: Project[] = [
  card({
    id: 'p_sf_mic', key: 'SF-110', title: 'SF - Release Theme Migration: Made in Canada Badge', clientId: 'c_shepherds',
    type: 'theme_migration', status: 'quality_inspection', ownerId: 'u_rufus', priority: 'medium', leadId: 'u_alex', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-4), originalDueDate: dayOffset(2), projectedDevHours: 3, bufferHours: 0.5,
    projectedQiHours: 1, daysNeeded: 1, percentPushedToQi: 100, pmStatus: 'approved',
    description: 'Rebuild the MADE IN CANADA maple-leaf badge on the release theme to match the live site: product cards, product page, cart drawer and cart page.',
    requirements: [
      { id: 'r_mic_1', text: 'Badge shows only on products tagged exactly "MADE IN CANADA"', done: true },
      { id: 'r_mic_2', text: 'Same icon and placement (bottom-left of image) as the live site', done: true },
      { id: 'r_mic_3', text: 'Badge sizes configurable in Theme settings; defaults match live', done: true },
      { id: 'r_mic_4', text: 'Confirm whether the badge should show on the cart page (clarification 1)', done: false },
    ],
    clientPortalUrl: 'https://portal.ecomworkspace.example/c/shepherds-fashion/projects/sf-110',
    tags: ['theme-migration', 'badge'],
    customFields: [
      { fieldId: 'cf_source_theme', value: 'Legacy custom theme' },
      { fieldId: 'cf_release_branch', value: '153.15790/Project-ReleaseThemeMigrationMadeInCanadaBadge' },
    ],
    templateId: 'tpl_theme_migration',
    createdAt: timestampOffset(-6, 10),
  }),
  card({
    id: 'p_sf_p1', key: 'SF-101', title: 'SF - Release Theme Migration Phase 1: Header, Footer & Navigation', clientId: 'c_shepherds',
    type: 'theme_migration', status: 'archive', ownerId: 'u_rufus', priority: 'medium', leadId: 'u_alex', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-120), originalDueDate: dayOffset(-104), completedAt: dayOffset(-105),
    projectedDevHours: 10, bufferHours: 2, projectedQiHours: 2, daysNeeded: 2, percentPushedToQi: 100, pmStatus: 'approved',
    tags: ['theme-migration', 'phase-1'], createdAt: timestampOffset(-130, 10), updatedAt: timestampOffset(-60, 11),
    description: "## 1. Task Summary\nThe client is moving the store to the Release theme. Phase 1 rebuilds the global shell — announcement bar, header with mega menu, mobile drawer and footer — so every later phase builds on the same navigation (sheet rows 1–9).\n\nThe live header is custom built. It reads the `main-menu` and `footer` menus plus a collection metafield (`custom.mega_menu_image`) for the mega menu tiles. None of this comes over when the theme changes.\n\nWe work in the Main Release theme (`Shepherds-Fashion/Release-Theme/Main`). The client makes their changes in ClientChanges (`Shepherds-Fashion/Release-Theme/ClientChanges`). When we merge, we bring in their changes first and then sort out any conflicts ourselves.\n\nWhen this is done, every page on Release shows the same header, mega menu and footer as the live site.\n\n## 2. Scope\n- **Announcement bar:** rotating messages, editable in Theme settings.\n- **Header:** logo, search, account, cart count; sticky on scroll.\n- **Mega menu:** collection image tiles from `custom.mega_menu_image`.\n- **Mobile drawer:** nested menu levels, same order as desktop.\n- **Footer:** 4 menu columns, newsletter signup, payment icons.\n\n## 3. Out of scope\n- Search results page (phase 2).\n- Menu content — the client keeps editing menus in Shopify admin.\n\n## 4. References\n- Live site: https://www.shepherdsfashions.example/\n- Design system: Release theme defaults (no new fonts or spacing).",
    requirements: [
      { id: 'r_p1_1', text: 'Header, mega menu and mobile drawer match the live site on desktop and mobile', done: true },
      { id: 'r_p1_2', text: 'Menus come from Shopify navigation (no hard-coded links)', done: true },
      { id: 'r_p1_3', text: 'Mega menu tiles read custom.mega_menu_image on each collection', done: true },
      { id: 'r_p1_4', text: 'Announcement bar messages editable in Theme settings', done: true },
    ],
    releaseNotes: 'Merged into Release-Theme/Main after ClientChanges was pulled in. No conflicts in header/footer sections.',
    clientPortalUrl: 'https://portal.ecomworkspace.example/c/shepherds-fashion/projects/sf-101',
    githubPrUrl: 'https://github.example/ecom/shepherds-theme/pull/351',
    bugVideoUrl: 'https://loom.example/share/sf-101-drawer-overlap',
    qiTestDate: dayOffset(-107),
    relativePotentialRevenue: 0,
    nonBillable: false,
    statusChangedAt: timestampOffset(-60, 11),
    automation: {
      processed: true, cycleMonth: timestampOffset(-121, 23, 1), addToTimeDoctor: true,
      timeDoctorEstimateHours: 14, timeDoctorUsedHours: 13.5, scheduledDate: dayOffset(-118),
    },
    notionSourceId: 'notion-page-sf-101',
  }),
  card({
    id: 'p_sf_p2', key: 'SF-102', title: 'SF - Release Theme Migration Phase 2: Collection & Search', clientId: 'c_shepherds',
    type: 'theme_migration', status: 'archive_soon', ownerId: 'u_rufus', priority: 'medium', leadId: 'u_alex', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-80), originalDueDate: dayOffset(-62), revisedDueDate: dayOffset(-58), completedAt: dayOffset(-59),
    projectedDevHours: 12, bufferHours: 2, projectedQiHours: 2, percentPushedToQi: 100, pmStatus: 'approved',
    tags: ['theme-migration', 'phase-2'], createdAt: timestampOffset(-90, 10),
  }),
  card({
    id: 'p_sf_p3', key: 'SF-103', title: 'SF - Release Theme Migration Phase 3: Blog & Lookbook Templates', clientId: 'c_shepherds',
    type: 'theme_migration', status: 'done', ownerId: 'u_rufus', priority: 'medium', leadId: 'u_alex', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-40), originalDueDate: dayOffset(-28), completedAt: dayOffset(-29),
    projectedDevHours: 6, bufferHours: 1, projectedQiHours: 1, percentPushedToQi: 100, pmStatus: 'approved',
    tags: ['theme-migration', 'phase-3'], createdAt: timestampOffset(-45, 10),
  }),
  card({
    id: 'p_sf_sizecopy', key: 'SF-106', title: 'SF - Size Guide Copy & Fit Notes Update', clientId: 'c_shepherds',
    type: 'general', status: 'client_reviewing', ownerId: 'u_rufus', priority: 'low', developerIds: ['u_sarthak'],
    startDate: dayOffset(-4), originalDueDate: dayOffset(4), projectedDevHours: 1,
    description: 'Copy changes delivered on staging; waiting on the client to approve fit notes per category.',
    tags: ['content'], createdAt: timestampOffset(-6, 10),
  }),
  card({
    id: 'p_sf_p6', key: 'SF-107', title: 'SF - Release Theme Migration Phase 6: Account Pages', clientId: 'c_shepherds',
    type: 'theme_migration', status: 'idea', ownerId: 'u_rufus', priority: 'low', originalDueDate: dayOffset(45),
    description: 'Next migration phase: customer account, order history and addresses.',
    tags: ['theme-migration', 'phase-6'], createdAt: timestampOffset(-2, 10),
  }),
  card({
    id: 'p_sf_hotfix', key: 'SF-108', title: 'SF - Predictive Search Results Hotfix', clientId: 'c_shepherds',
    type: 'bug_fix', status: 'ready_to_deploy', ownerId: 'u_alex', priority: 'high', leadId: 'u_alex', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-3), originalDueDate: dayOffset(1), projectedDevHours: 2, bufferHours: 0.5,
    projectedQiHours: 0.5, percentPushedToQi: 100, pmStatus: 'approved', tags: ['search', 'hotfix'], createdAt: timestampOffset(-4, 10),
  }),
  card({
    id: 'p_sf_wishlist', key: 'SF-109', title: 'SF - Wishlist Drawer QI Fixes', clientId: 'c_shepherds',
    type: 'development', status: 'fixing_issues', ownerId: 'u_rufus', priority: 'medium', leadId: 'u_alex', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-9), originalDueDate: dayOffset(2), projectedDevHours: 5, bufferHours: 1,
    projectedQiHours: 1, percentPushedToQi: 80, tags: ['wishlist'], createdAt: timestampOffset(-12, 10),
  }),
  card({
    id: 'p_wp_bis', key: 'WP-219', title: 'WOLFPak - Back-in-Stock Klaviyo Form', clientId: 'c_wolfpak',
    type: 'development', status: 'peer_review', ownerId: 'u_rufus', priority: 'medium', leadId: 'u_alex', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-6), originalDueDate: dayOffset(3), projectedDevHours: 4, bufferHours: 1,
    projectedQiHours: 1, tags: ['klaviyo'], createdAt: timestampOffset(-8, 10),
  }),
  card({
    id: 'p_wp_reviews', key: 'WP-225', title: 'WOLFPak - PDP Reviews Widget Restyle', clientId: 'c_wolfpak',
    type: 'design', status: 'lead_review', ownerId: 'u_priya', priority: 'low', designerIds: ['u_priya'], leadId: 'u_alex',
    originalDueDate: dayOffset(18), tags: ['pdp', 'reviews'], createdAt: timestampOffset(-1, 10),
  }),
  card({
    id: 'p_wf_bundle', key: 'WF-62', title: 'WonderFold - Accessory Bundle Upsell', clientId: 'c_wonderfold',
    type: 'development', status: 'prep_for_deployment', ownerId: 'u_rufus', priority: 'medium', developerIds: ['u_sarthak'],
    qiOwnerId: 'u_jordan', startDate: dayOffset(-15), originalDueDate: dayOffset(1), projectedDevHours: 6, bufferHours: 1,
    projectedQiHours: 1, percentPushedToQi: 100, pmStatus: 'approved', tags: ['upsell'], createdAt: timestampOffset(-18, 10),
  }),
  card({
    id: 'p_mm_gift', key: 'MM-35', title: 'Made by Mary - Gift Message at Checkout', clientId: 'c_madebymary',
    type: 'development', status: 'issues_found', ownerId: 'u_rufus', priority: 'high', developerIds: ['u_sarthak'], qiOwnerId: 'u_jordan',
    startDate: dayOffset(-10), originalDueDate: dayOffset(-1), projectedDevHours: 3, bufferHours: 0.5, projectedQiHours: 1,
    percentPushedToQi: 100, description: 'QI found the gift message is dropped when customers edit the cart.',
    tags: ['checkout'], createdAt: timestampOffset(-12, 10),
  }),
  card({
    id: 'p_mbg_giftcard', key: 'MBG-15', title: 'Mind Body Green - Digital Gift Card Page', clientId: 'c_mbg',
    type: 'design', status: 'ready_for_client', ownerId: 'u_priya', priority: 'medium', designerIds: ['u_priya'],
    startDate: dayOffset(-7), originalDueDate: dayOffset(2), tags: ['gift-card'], createdAt: timestampOffset(-9, 10),
  }),
  card({
    id: 'p_pp_subs', key: 'PP-03', title: 'Pet Planet - Autoship Landing Page', clientId: 'c_petplanet',
    type: 'development', status: 'idea', ownerId: 'u_taylor', accountManagerId: 'u_taylor', priority: 'low',
    originalDueDate: dayOffset(40), tags: ['subscriptions'], createdAt: timestampOffset(-1, 10),
  }),
]
