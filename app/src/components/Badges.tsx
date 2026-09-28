import type { Content, Marker, PlanStatus, VerdictKey } from '../types'
import { MARKERS } from '../lib/data'
import { Icon } from './Icon'

const VERDICT: Record<VerdictKey, { cls: string; icon: string; hint: string }> = {
  standout: { cls: 'chip-good', icon: 'up', hint: 'Clearly above a typical post of the same format (reach and engagement combined).' },
  steady: { cls: '', icon: 'flat', hint: 'Around a typical post of the same format.' },
  quiet: { cls: 'chip-warn', icon: 'down', hint: 'Below a typical post of the same format.' },
  boosted: { cls: 'chip-paid', icon: '', hint: 'Paid boost: judged on what the boost added, not against organic posts.' },
}

export function VerdictChip({ c }: { c: Content }) {
  if (!c.verdict) return c.partner ? <span className="chip">Collab · {c.partner}</span> : null
  const v = VERDICT[c.verdict.key]
  return (
    <span className={`chip ${v.cls}`} title={v.hint}>
      {v.icon && <Icon name={v.icon} size={13} />}
      {c.verdict.label}
    </span>
  )
}

export function MarkerChip({ marker, partner }: { marker: Marker; partner?: string }) {
  const cls = { planned: '', lastminute: 'chip-accent', unconfirmed: 'chip-outline', collab: '' }[marker]
  return <span className={`chip ${cls}`} title={MARKERS[marker].hint}>{marker === 'collab' && partner ? `Collab · ${partner}` : MARKERS[marker].short}</span>
}

const STATUS_CLS: Record<PlanStatus, string> = {
  'On date': 'chip-good', Early: '', Late: 'chip-warn', 'Not posted': 'chip-bad', Replaced: '', Upcoming: '', Planned: '',
}
export function StatusChip({ status, lag }: { status: PlanStatus; lag?: number | null }) {
  const extra = status === 'Late' && lag ? ` · ${lag}d` : status === 'Early' && lag ? ` · ${-lag}d` : ''
  return <span className={`chip ${STATUS_CLS[status]}`}>{status}{extra}</span>
}

export function BoostChip({ actual, planned }: { actual?: boolean; planned?: boolean }) {
  if (actual) return <span className="chip chip-paid" title="Meta reports reach or views from ads">Boosted</span>
  if (planned) return <span className="chip chip-outline" title="Marked 💵 in the calendar">💵 Boost planned</span>
  return null
}

export function Dot({ tone }: { tone: 'good' | 'warn' | 'neutral' }) {
  return <span className={`dot dot-${tone}`} />
}
