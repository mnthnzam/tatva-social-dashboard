import { noPreview } from '../lib/data'
import type { Content, PlanItem } from '../types'
import type { Selection } from '../components/Drawer'
import { planById } from '../lib/data'
import { day, dayLong, n } from '../lib/format'
import { Creative } from '../components/Creative'
import { BoostChip, MarkerChip, StatusChip, VerdictChip } from '../components/Badges'
import { Icon } from '../components/Icon'

/** Team card: verdict + tag, organic views, why. */
export function TeamCard({ c, open }: { c: Content; open: (s: Selection) => void }) {
  const p = c.planId ? planById.get(c.planId) : undefined
  const own = c.marker !== 'collab'
  return (
    <button className="pcard" onClick={() => open({ kind: 'c', id: c.id })}>
      <Creative img={c.image} format={c.format} label={c.title} placeholder={noPreview(c)} />
      <div className="pcard-meta">
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {own && <VerdictChip c={c} />}
          {c.marker !== 'planned' && <MarkerChip marker={c.marker} partner={c.partner} />}
          {p && (p.status === 'Late' || p.status === 'Early') && <StatusChip status={p.status} lag={p.lag} />}
        </div>
        <span className="pcard-title">{c.title}</span>
        <span className="pcard-date">{day(c.date)} · {c.platforms} · {c.format}</span>
        <span className="pcard-row" style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
          <span><strong style={{ color: 'var(--ink)', fontSize: 15 }}>{n(own ? c.metrics.views_org : c.metrics.views)}</strong> {own ? 'organic views' : 'views'}</span>
          {c.metrics.views_ads > 0 && <span style={{ fontSize: 12.5 }}>+{n(c.metrics.views_ads)} paid</span>}
        </span>
      </div>
    </button>
  )
}

export function PlanCard({ p, open }: { p: PlanItem; open: (s: Selection) => void }) {
  const st = stageOf(p)
  return (
    <button className="pcard" onClick={() => open({ kind: 'p', id: p.id })}>
      <Creative img={p.creative} format={p.format} label={p.title} placeholder={p.format === 'Reel' ? 'Reel · needs footage' : 'Design in progress'} />
      <div className="pcard-meta">
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span className={`chip ${st.cls}`}>{st.label}</span>
          <BoostChip planned={p.boostPlanned} />
          {p.platforms.includes('LinkedIn') && <span className="chip"><Icon name="linkedin" size={11} /> LinkedIn</span>}
        </div>
        <span className="pcard-title">{p.title}</span>
        <span className="pcard-date">{dayLong(p.date)} · {p.format} · {p.bucket}</span>
      </div>
    </button>
  )
}

export function stageOf(p: PlanItem): { label: string; cls: string; st: string } {
  if (p.needsFootage) return { label: 'Needs footage', cls: 'chip-bad', st: 'st-miss' }
  if ((p.state ?? '').startsWith('Design ready')) return { label: 'Design ready', cls: 'chip-good', st: 'st-ok' }
  if ((p.state ?? '').startsWith('Script ready')) return { label: 'Script ready', cls: 'chip-warn', st: 'st-late' }
  return { label: p.state ?? p.sheetStatus ?? 'Planned', cls: '', st: 'st-plan' }
}

export const STATUS_ST: Record<string, string> = {
  'On date': 'st-ok', Early: 'st-early', Late: 'st-late', 'Not posted': 'st-miss', Replaced: 'st-swap', Upcoming: 'st-soon', Planned: 'st-plan',
}
