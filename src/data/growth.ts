import type { ABTestExperiment, CROExperiment } from '@/types'
import { dayOffset, timestampOffset } from '@/lib/dates'

/**
 * CRO and A/B testing sample records. All metrics are illustrative demo values and are
 * NOT connected to any analytics source.
 * TODO(ANALYTICS): Connect A/B test metrics to the approved analytics provider (GA4 /
 * experimentation platform export) and store snapshots with the date range they cover.
 */
export const seedCRO: CROExperiment[] = [
  {
    id: 'cro_1', clientId: 'c_madebymary', projectId: 'p_mm_cro', title: 'Simplify the engraving personalisation step',
    pageArea: 'PDP · Personalisation', status: 'researching', ownerId: 'u_maya', priority: 'high', impactScore: 8,
    problemStatement: 'Session recordings show customers abandoning after opening the engraving options; the form has 5 fields before ATC.',
    hypothesis: 'If we collapse font and placement into a single visual picker, more customers will complete personalisation and add to cart.',
    proposedChange: 'Replace dropdowns with a visual font picker and default placement; move gift note to cart.',
    expectedOutcome: 'Higher personalisation completion rate and PDP → ATC rate.',
    recommendations: 'Pending funnel analysis (MM-33-2).',
    linkedTaskIds: ['t_mm33_2'], createdAt: timestampOffset(-7, 10), updatedAt: timestampOffset(-1, 15),
  },
  {
    id: 'cro_2', clientId: 'c_madebymary', projectId: 'p_mm_cro', title: 'Show delivery estimate above add-to-cart',
    pageArea: 'PDP · Buy box', status: 'ready', ownerId: 'u_maya', priority: 'medium', impactScore: 6,
    problemStatement: 'Customer service tickets frequently ask whether personalised items arrive before gifting dates.',
    hypothesis: 'Showing an estimated delivery date near the ATC button will reduce hesitation for gift purchases.',
    proposedChange: 'Add a delivery estimate line using production lead time + shipping method.',
    expectedOutcome: 'Fewer pre-purchase support tickets; improved ATC rate in Q4.',
    recommendations: 'Ready for implementation once lead-time metafield is populated.',
    linkedTaskIds: [], createdAt: timestampOffset(-6, 12), updatedAt: timestampOffset(-3, 9),
  },
  {
    id: 'cro_3', clientId: 'c_wonderfold', title: 'Wagon comparison table on collection page',
    pageArea: 'Collection · Wagons', status: 'idea', ownerId: 'u_maya', priority: 'low', impactScore: 5,
    problemStatement: 'Shoppers bounce between 3 wagon PDPs to compare seat count and features.',
    hypothesis: 'A comparison table on the collection page will shorten the path to the right model.',
    proposedChange: 'Add a comparison section above the product grid.',
    expectedOutcome: 'Lower PDP bounce rate and fewer back-and-forth navigations.',
    recommendations: '', linkedTaskIds: [], createdAt: timestampOffset(-4, 11), updatedAt: timestampOffset(-4, 11),
  },
  {
    id: 'cro_4', clientId: 'c_shepherds', projectId: 'p_sf_sbv', title: 'Shoppable product tags on Shop by Video',
    pageArea: 'Shop by Video page', status: 'implemented', ownerId: 'u_maya', priority: 'medium', impactScore: 7,
    problemStatement: 'Video content drove engagement but few clicks to product pages.',
    hypothesis: 'Linking each video to the featured products will increase product page visits from the video page.',
    proposedChange: 'Show product cards beneath each video tile.',
    expectedOutcome: 'More PDP visits originating from the video page.',
    recommendations: 'Implemented as part of SF-104.',
    linkedTaskIds: ['t_sf104_1'], createdAt: timestampOffset(-30, 10), updatedAt: '2026-10-26T12:00:00.000Z',
  },
  {
    id: 'cro_5', clientId: 'c_wolfpak', projectId: 'p_wp_bfcm', title: 'Progress indicator in bundle builder',
    pageArea: 'BFCM landing · Bundle builder', status: 'implementing', ownerId: 'u_maya', priority: 'high', impactScore: 7,
    problemStatement: 'Multi-step builders without progress cues tend to see drop-off at step 2.',
    hypothesis: 'A visible step indicator and discount tier meter will increase bundle completion.',
    proposedChange: 'Add a 3-step indicator and a "next tier" discount meter.',
    expectedOutcome: 'Higher bundle completion rate during BFCM.',
    recommendations: 'Included in the bundle builder build.',
    linkedTaskIds: ['t_wp221_2'], createdAt: timestampOffset(-12, 10), updatedAt: timestampOffset(-4, 10),
  },
]

export const seedABTests: ABTestExperiment[] = [
  {
    id: 'ab_1', key: 'WF-AB-3', clientId: 'c_wonderfold', linkedProjectIds: ['p_wf_ab'], name: 'PDP sticky add-to-cart (mobile)',
    hypothesis: 'A sticky ATC bar on mobile PDPs will increase add-to-cart rate by keeping the CTA visible while browsing media and reviews.',
    controlName: 'Current PDP', variantName: 'Sticky ATC bar', startDate: dayOffset(-9), endDate: dayOffset(12), status: 'running',
    ownerId: 'u_chris', primaryMetric: 'Add-to-cart rate (mobile)', baselineConversionRate: 6.8, variantConversionRate: 7.4,
    sampleSize: 18_400, trafficSplit: 50, platform: 'Shoplift',
    resultsSummary: 'Interim read only — variant trending ahead; no decision until the planned end date.',
    createdAt: timestampOffset(-20, 14), updatedAt: timestampOffset(-1, 10),
  },
  {
    id: 'ab_2', key: 'SF-AB-1', clientId: 'c_shepherds', linkedProjectIds: [], name: 'Video lookbook vs. static lookbook',
    hypothesis: 'Video-led lookbooks will drive more product page visits than static image lookbooks.',
    controlName: 'Static lookbook', variantName: 'Video lookbook', startDate: dayOffset(-75), endDate: dayOffset(-45), status: 'completed',
    ownerId: 'u_chris', primaryMetric: 'Lookbook → PDP click-through', baselineConversionRate: 11.2, variantConversionRate: 13.6,
    sampleSize: 42_000, trafficSplit: 50, platform: 'Intelligems',
    resultsSummary: 'Variant outperformed control on the primary metric. Recommendation adopted and informed the Shop by Video rebuild (SF-104).',
    createdAt: timestampOffset(-80, 10), updatedAt: timestampOffset(-44, 12),
  },
  {
    id: 'ab_3', key: 'WP-AB-2', clientId: 'c_wolfpak', linkedProjectIds: ['p_wp_bfcm'], name: 'Free-shipping threshold messaging',
    hypothesis: 'Showing "$X away from free shipping" in the cart will increase average order value during BFCM.',
    controlName: 'No threshold message', variantName: 'Threshold progress bar', startDate: dayOffset(5), endDate: dayOffset(26), status: 'scheduled',
    ownerId: 'u_chris', primaryMetric: 'Average order value', sampleSize: undefined, trafficSplit: 50, platform: 'Shoplift',
    resultsSummary: '', createdAt: timestampOffset(-6, 10), updatedAt: timestampOffset(-2, 10),
  },
  {
    id: 'ab_4', key: 'MM-AB-1', clientId: 'c_madebymary', linkedProjectIds: ['p_mm_engrave'], name: 'Engraving preview open by default',
    hypothesis: 'Opening the engraving preview by default will increase personalised add-to-carts.',
    controlName: 'Preview collapsed', variantName: 'Preview expanded', status: 'draft',
    ownerId: 'u_chris', primaryMetric: 'Personalised ATC rate', trafficSplit: 50, platform: 'To be decided',
    resultsSummary: '', createdAt: timestampOffset(-2, 10), updatedAt: timestampOffset(-2, 10),
  },
  {
    id: 'ab_5', key: 'MBG-AB-1', clientId: 'c_mbg', linkedProjectIds: [], name: 'Collection grid: 3 vs 4 columns',
    hypothesis: 'A denser 4-column grid on desktop will increase product clicks per session.',
    controlName: '3 columns', variantName: '4 columns', startDate: dayOffset(-50), endDate: dayOffset(-36), status: 'stopped',
    ownerId: 'u_chris', primaryMetric: 'Product clicks per session', baselineConversionRate: 2.1, variantConversionRate: 2.05,
    sampleSize: 9_800, trafficSplit: 50, platform: 'Intelligems',
    resultsSummary: 'Stopped early: no meaningful difference and the variant reduced image legibility per client feedback.',
    createdAt: timestampOffset(-55, 10), updatedAt: timestampOffset(-36, 12),
  },
]
