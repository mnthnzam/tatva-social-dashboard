import raw from '../data/tgs.json'
import type { Content, Dataset, FunnelJob, Marker, PlanItem, PlanStatus, ReportMonth } from '../types'

export const DATA = raw as unknown as Dataset

export const contentById = new Map<string, Content>(DATA.content.map((c) => [c.id, c]))
export const planById = new Map<string, PlanItem>(DATA.plan.map((p) => [p.id, p]))

export const RANGE = DATA.rangeLabel ?? 'Jul–Sep'

export const reportMonths = DATA.months.filter((m): m is ReportMonth => m.kind === 'report')

export const MARKERS: Record<Marker, { label: string; short: string; hint: string }> = {
  planned: { label: 'Planned', short: 'Planned', hint: 'In the content calendar and matched to a live post.' },
  tatva: { label: 'Added by Tatva', short: 'Added by Tatva', hint: 'Not in the calendar. Posted by the Tatva team (an event, award or impromptu reel).' },
  lastminute: { label: 'Last-minute · Zamstars', short: 'Last-minute', hint: 'Not in the calendar. Designed by Zamstars (found in the month’s Canva file).' },
  unconfirmed: { label: 'Outside plan · unconfirmed', short: 'Unconfirmed', hint: 'Not in the calendar and no Zamstars design found. Likely posted by the Tatva team; needs a tag.' },
  collab: { label: 'Collab', short: 'Collab', hint: 'Posted by a partner account with Tatva as collaborator. Kept out of calendar numbers.' },
}

export const STATUS_ORDER: PlanStatus[] = ['On date', 'Rescheduled', 'Replaced', 'Not posted', 'Upcoming', 'Planned']

export const statusClass = (s: PlanStatus) =>
  ({ 'On date': 'ok', Rescheduled: 'late', 'Not posted': 'miss', Replaced: 'swap', Upcoming: 'soon', Planned: 'plan' })[s]

export const monthContent = (monthId: string) => DATA.content.filter((c) => c.month === monthId)
export const monthPlan = (monthId: string) => DATA.plan.filter((p) => p.month === monthId)

export const baselineFor = (c: Content) => DATA.baselines[c.format]?.median ?? null

export const imageFor = (c: Content | undefined, p?: PlanItem) => c?.image ?? p?.creative ?? null

export const noPreview = (c: Content) =>
  c.marker === 'collab' ? 'Partner post — Meta doesn’t share its image' : c.format === 'Reel' ? 'Reel cover not available from Meta' : 'No preview'

export const JOB_LABEL: Record<FunnelJob, string> = { reach: 'Reach', enquiry: 'Enquiry', visit: 'Visit' }

/** Last day of a 'YYYY-MM' month, as 'YYYY-MM-DD'. */
export const monthEnd = (id: string) => {
  const [y, m] = id.split('-').map(Number)
  const d = new Date(y, m, 0)
  return `${y}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Report for a month is due on the 3rd working day (Mon–Fri) of the next month. */
export const reportDue = (id: string) => {
  const [y, m] = id.split('-').map(Number)
  const d = new Date(y, m, 1)
  let left = 3
  for (;;) {
    if (d.getDay() !== 0 && d.getDay() !== 6 && --left === 0) break
    d.setDate(d.getDate() + 1)
  }
  return d
}

/** 'Rescheduled · 3 days later' / '· 5 days earlier'. */
export const movedBy = (lag: number | null | undefined) =>
  !lag ? '' : `${Math.abs(lag)} day${Math.abs(lag) === 1 ? '' : 's'} ${lag > 0 ? 'later' : 'earlier'}`
