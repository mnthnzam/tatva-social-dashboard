import type { FunnelKey, FunnelStage, ReportMonth } from '../types'
import { DATA, monthContent, monthEnd, planById } from '../lib/data'
import { day, n, pct, plural } from '../lib/format'

const STAGES: { key: 'reach' | FunnelKey; label: string; hint: string }[] = [
  { key: 'reach', label: 'People reached', hint: 'Organic reach added across posts' },
  { key: 'conversations', label: 'Conversations', hint: 'Messages and WhatsApp chats started' },
  { key: 'enquiries', label: 'Enquiries', hint: 'Leads in the admissions tracker' },
  { key: 'visits', label: 'Campus visits', hint: 'Visits recorded against a lead' },
  { key: 'admissions', label: 'Admissions', hint: 'Admissions against a lead' },
]

/** Reach → conversations → enquiries → visits → admissions. Unknown stages say so; they never show as zero. */
export function FunnelStrip({ month }: { month: ReportMonth }) {
  const L = month.leads
  const tracked = !!L?.tracked
  const stages = STAGES.map((st) => {
    if (st.key === 'reach') return { ...st, stage: { value: month.summary.plain.reached } as FunnelStage }
    return { ...st, stage: L?.funnel[st.key] ?? { value: null } }
  })
  return (
    <>
      <div className="funnel">
        {stages.map((st, i) => {
          const v = st.stage.value
          const prev = i > 0 ? stages[i - 1].stage.value : null
          // Reach is summed across posts (a parent seen three times counts three), so no rate from reach to messages.
          const rate = i > 1 && v !== null && prev ? v / prev : null
          const srcs = Object.entries(st.stage.sources ?? {})
          return (
            <div key={st.key} className={`fn-stage${v === null ? ' empty' : ''}`}>
              {i > 0 && <span className="fn-rate" aria-hidden={rate === null}>{rate !== null ? (rate < 0.001 ? '<0.1%' : pct(rate, rate < 0.1 ? 1 : 0)) : ''}</span>}
              <span className="fn-l">{st.label}</span>
              <strong className="fn-v">{v !== null ? n(v) : tracked ? 'Awaiting' : 'Not tracked'}</strong>
              <span className="fn-h" title={st.stage.basis}>{st.stage.basis ?? st.hint}</span>
              {srcs.length > 0 && v !== null && (
                <ul className="fn-src">
                  {srcs.map(([k, x]) => <li key={k}><span>{k}</span><b>{x === null ? '…' : n(x)}</b></li>)}
                  {st.stage.untagged !== undefined && st.stage.untagged !== null && <li className="untagged"><span>No source recorded</span><b>{n(st.stage.untagged)}</b></li>}
                </ul>
              )}
            </div>
          )
        })}
      </div>
      {!tracked && L?.trackingNote && <p className="fine" style={{ marginTop: 10 }}>{L.trackingNote}</p>}
      {tracked && <p className="fine" style={{ marginTop: 10 }}>From conversations on, each step shows its share of the step before. Leads with no source recorded are counted openly, not left out.</p>}
    </>
  )
}

/** Who made the month's own posts: Zamstars, the Tatva team or not yet confirmed. Collabs are noted, not counted. */
export function WhoPosted({ month }: { month: ReportMonth }) {
  const cs = monthContent(month.id)
  const groups = [
    { key: 'Zamstars', color: 'var(--org)', items: cs.filter((c) => (c.marker === 'planned' && c.planId && planById.get(c.planId)?.owner === 'Zamstars') || c.marker === 'lastminute') },
    { key: 'Tatva team', color: 'var(--brand)', items: cs.filter((c) => c.marker === 'planned' && c.planId && planById.get(c.planId)?.owner === 'Tatva') },
    { key: 'Not yet confirmed', color: 'var(--mute-mark)', items: cs.filter((c) => c.marker === 'unconfirmed') },
  ].filter((g) => g.items.length > 0)
  const collabs = cs.filter((c) => c.marker === 'collab').length
  const total = groups.reduce((a, g) => a + g.items.length, 0)
  return (
    <div className="who">
      <div className="split" style={{ height: 10 }}>
        {groups.map((g) => <span key={g.key} style={{ flex: g.items.length, background: g.color }} title={`${g.key}: ${g.items.length}`} />)}
      </div>
      <ul className="who-list">
        {groups.map((g) => (
          <li key={g.key}><i style={{ background: g.color }} /><span>{g.key}</span><b>{g.items.length}</b><em>{pct(g.items.length / total)}</em></li>
        ))}
      </ul>
      {collabs > 0 && <p className="fine">Plus {plural(collabs, 'collab post')} from partner pages, counted separately below.</p>}
    </div>
  )
}

/** Paid is reported apart from organic, so a paused ad never reads as an organic drop. */
export function PaidBlock({ month }: { month: ReportMonth }) {
  const s = month.summary
  const camps = month.leads?.paid.campaigns ?? []
  const spend = month.leads?.paid.spend ?? null
  if (camps.length === 0 && s.boosted === 0) return <p className="muted">No paid boosts or ads ran this month.</p>
  return (
    <div className="paid">
      <div className="paid-sum">
        <div><strong>{s.boosted}</strong><span>boosted {s.boosted === 1 ? 'post' : 'posts'}</span></div>
        <div><strong>{n(s.boostReach)}</strong><span>extra reach from boosts</span></div>
        <div><strong>{camps.length}</strong><span>separate {camps.length === 1 ? 'ad' : 'ads'}</span></div>
        <div><strong>{spend === null ? '—' : `₹${n(spend)}`}</strong><span>{spend === null ? 'spend not in yet' : 'spend'}</span></div>
      </div>
      {camps.length > 0 && (
        <ul className="paid-list">
          {camps.map((c) => (
            <li key={c.name}>
              <div>
                <span className="dl-t">{c.name}</span>
                <span className="dl-s"> · {c.platform}{c.start ? ` · ${day(c.start)}${c.end ? `–${day(c.end)}` : ''}` : ''}</span>
                {c.note && <p className="fine" style={{ marginTop: 2 }}>{c.note}</p>}
              </div>
              <div className="paid-n">
                <span><b>{c.reach === null ? '—' : n(c.reach)}</b> reach</span>
                <span><b>{c.results === null ? '—' : n(c.results)}</b> {c.resultType ?? 'results'}</span>
                <span><b>{c.spend === null || !c.results ? '—' : `₹${n(c.spend / c.results)}`}</b> per result</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="fine">Reach and engagement in the rest of this page are organic only.</p>
    </div>
  )
}

/** Shown when the export stopped before the month ended. */
export function PartialNotice({ month }: { month: ReportMonth }) {
  const end = monthEnd(month.id)
  if (DATA.dataCutoff >= end) return null
  const missing = Math.round((new Date(end).getTime() - new Date(DATA.dataCutoff).getTime()) / 86_400_000)
  return <p className="partial">Numbers run to {day(DATA.dataCutoff)}. Posts from the last {plural(missing, 'day')} of {month.label} aren’t counted yet.</p>
}

export function MonthContext({ month }: { month: ReportMonth }) {
  const items = month.leads?.context ?? []
  if (items.length === 0) return null
  return (
    <ul className="ctx">
      {items.map((x, i) => <li key={i}><span className="dl-date">{x.date ? day(x.date) : '—'}</span><span>{x.text}</span></li>)}
    </ul>
  )
}
