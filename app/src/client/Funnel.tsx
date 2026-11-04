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
          // Only visits and admissions are subsets of the step before. Reach is summed across posts, and lead forms
          // don't pass through messages, so no rate is shown into conversations or enquiries.
          const rate = i > 2 && v !== null && prev ? v / prev : null
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
      {tracked && <p className="fine" style={{ marginTop: 10 }}>Visits and admissions show their share of the step before. Lead-form enquiries don’t pass through messages, so those two aren’t chained. Leads with no source recorded are counted openly, not left out.</p>}
    </>
  )
}

/** Who made the month's own posts: Zamstars, the Tatva team or not yet confirmed. Collabs are noted, not counted. */
export function WhoPosted({ month }: { month: ReportMonth }) {
  const cs = monthContent(month.id)
  const groups = [
    { key: 'Zamstars', color: 'var(--org)', items: cs.filter((c) => (c.marker === 'planned' && c.planId && planById.get(c.planId)?.owner === 'Zamstars') || c.marker === 'lastminute') },
    { key: 'Tatva team', color: 'var(--brand)', items: cs.filter((c) => (c.marker === 'planned' && c.planId && planById.get(c.planId)?.owner === 'Tatva') || c.marker === 'tatva') },
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
const inr = (x: number) => `₹${x >= 100000 ? (x / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L' : x >= 1000 ? (x / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : Math.round(x)}`

export function PaidBlock({ month }: { month: ReportMonth }) {
  const s = month.summary
  const P = month.leads?.paid
  const camps = P?.campaigns ?? []
  if (camps.length === 0 && s.boosted === 0) return <p className="muted">No paid boosts or ads ran this month.</p>
  const spend = P?.spend ?? null
  const leadCamps = camps.filter((c) => c.platform === 'Meta' && c.resultType === 'leads')
  const metaLeads = leadCamps.reduce((a, c) => a + (c.results ?? 0), 0)
  const metaLeadSpend = leadCamps.reduce((a, c) => a + (c.spend ?? 0), 0)
  const platforms = [...new Set(camps.map((c) => c.platform))]
  return (
    <div className="paid">
      <div className="paid-sum">
        <div><strong>{spend === null ? '—' : inr(spend)}</strong><span>{spend === null ? 'spend not in yet' : `spent${P?.spendBy ? ` · ${Object.entries(P.spendBy).map(([k, v]) => `${k} ${inr(v)}`).join(', ')}` : ''}`}</span></div>
        <div><strong>{metaLeads ? n(metaLeads) : '—'}</strong><span>admissions leads from Meta ads</span></div>
        <div><strong>{metaLeads ? `₹${Math.round(metaLeadSpend / metaLeads)}` : '—'}</strong><span>per Meta lead</span></div>
        <div><strong>{n(s.boostReach)}</strong><span>extra reach on boosted posts</span></div>
      </div>
      {platforms.map((pl) => (
        <div key={pl}>
          <h4 className="paid-h">{pl}</h4>
          <ul className="paid-list">
            {camps.filter((c) => c.platform === pl).sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0)).map((c) => (
              <li key={c.name}>
                <div>
                  <span className="dl-t">{c.name}</span>
                  {c.status && <span className="dl-s"> · {c.status}</span>}
                  {c.note && <p className="fine" style={{ marginTop: 2 }}>{c.note}</p>}
                </div>
                <div className="paid-n">
                  <span><b>{c.spend === null ? '—' : inr(c.spend)}</b> spent</span>
                  <span><b>{c.results === null ? '—' : n(c.results)}</b> {c.resultType ?? 'results'}</span>
                  <span><b>{c.spend === null || !c.results ? '—' : `₹${c.spend / c.results < 10 ? (c.spend / c.results).toFixed(2) : Math.round(c.spend / c.results)}`}</b> each</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="fine">Reach and engagement elsewhere on this page are organic only. Results are counted the way each platform reports them, so leads, visits and clicks are not added together.</p>
    </div>
  )
}

/** Where website sessions came from (GA4). Social channels are highlighted. */
export function WebBlock({ month }: { month: ReportMonth }) {
  const W = month.leads?.web
  if (!W) return null
  const total = W.channels.reduce((a, c) => a + c.sessions, 0)
  const max = Math.max(...W.channels.map((c) => c.sessions))
  const social = (k: string) => /Social/.test(k)
  return (
    <div className="panel">
      <div className="panel-head"><h3>Website visits by channel</h3><span className="muted">{n(total)} sessions</span></div>
      <ul className="web-list">
        {W.channels.map((c) => (
          <li key={c.name} className={social(c.name) ? 'hl' : ''}>
            <span>{c.name}</span>
            <span className="web-bar"><i style={{ width: `${(c.sessions / max) * 100}%` }} /></span>
            <b>{n(c.sessions)}</b>
            <em>{c.sessions ? pct(c.engaged / c.sessions) : '—'} engaged</em>
          </li>
        ))}
      </ul>
      <p className="fine" style={{ marginTop: 10 }}>{W.basis}{W.excluded ? ` ${n(W.excluded)} sessions removed.` : ''} Form submissions by channel aren’t in this export yet.</p>
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
