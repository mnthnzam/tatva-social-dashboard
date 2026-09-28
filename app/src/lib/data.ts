import raw from '../data/tgs.json'
import type { Content, Dataset, Marker, PlanItem, PlanStatus, ReportMonth } from '../types'

export const DATA = raw as unknown as Dataset

export const contentById = new Map<string, Content>(DATA.content.map((c) => [c.id, c]))
export const planById = new Map<string, PlanItem>(DATA.plan.map((p) => [p.id, p]))

export const reportMonths = DATA.months.filter((m): m is ReportMonth => m.kind === 'report')

export const MARKERS: Record<Marker, { label: string; short: string; hint: string }> = {
  planned: { label: 'Planned', short: 'Planned', hint: 'In the content calendar and matched to a live post.' },
  lastminute: { label: 'Last-minute · Zamstars', short: 'Last-minute', hint: 'Not in the calendar. Designed by Zamstars (found in the month’s Canva file).' },
  unconfirmed: { label: 'Outside plan · unconfirmed', short: 'Unconfirmed', hint: 'Not in the calendar and no Zamstars design found. Likely posted by the Tatva team; needs a tag.' },
  collab: { label: 'Collab', short: 'Collab', hint: 'Posted by a partner account with Tatva as collaborator. Kept out of calendar numbers.' },
}

export const STATUS_ORDER: PlanStatus[] = ['On date', 'Early', 'Late', 'Replaced', 'Not posted', 'Upcoming', 'Planned']

export const statusClass = (s: PlanStatus) =>
  ({ 'On date': 'ok', Early: 'info', Late: 'late', 'Not posted': 'miss', Replaced: 'swap', Upcoming: 'soon', Planned: 'plan' })[s]

export const monthContent = (monthId: string) => DATA.content.filter((c) => c.month === monthId)
export const monthPlan = (monthId: string) => DATA.plan.filter((p) => p.month === monthId)

export const baselineFor = (c: Content) => DATA.baselines[c.format]?.median ?? null

export const imageFor = (c: Content | undefined, p?: PlanItem) => c?.image ?? p?.creative ?? null

export const noPreview = (c: Content) =>
  c.marker === 'collab' ? 'Partner post — Meta doesn’t share its image' : c.format === 'Reel' ? 'Reel cover is a blank frame' : 'No preview'
