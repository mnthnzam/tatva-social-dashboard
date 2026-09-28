import { useState } from 'react'
import type { Selection } from '../components/Drawer'
import type { Route } from '../App'
import { DATA, reportMonths } from '../lib/data'
import { monthShort, n, pct } from '../lib/format'
import { Columns, HRows, TipBody } from '../components/Charts'
import { TeamCard } from './common'

const METRICS = [
  { key: 'reached', label: 'People reached', get: (m: (typeof reportMonths)[number]) => m.summary.plain.reached },
  { key: 'views', label: 'Organic views', get: (m: (typeof reportMonths)[number]) => m.summary.views_org },
  { key: 'passed', label: 'Shares & saves', get: (m: (typeof reportMonths)[number]) => m.summary.plain.passedOn },
  { key: 'follows', label: 'New followers', get: (m: (typeof reportMonths)[number]) => m.summary.follows },
  { key: 'delivery', label: 'Plan delivered', get: (m: (typeof reportMonths)[number]) => m.summary.delivered / Math.max(m.summary.due, 1) },
] as const

export function Trends({ open, go }: { open: (s: Selection) => void; go: (r: Partial<Route>) => void }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('reached')
  const def = METRICS.find((m) => m.key === metric)!
  const own = DATA.content.filter((c) => c.marker !== 'collab')
  const top = [...own].filter((c) => c.verdict?.score).sort((a, b) => b.verdict!.score! - a.verdict!.score!).slice(0, 4)
  const shared = [...own].sort((a, b) => b.plain.passedOn - a.plain.passedOn).slice(0, 8)
  const buckets = new Map<string, number[]>()
  for (const c of own) {
    const p = c.planId ? DATA.plan.find((x) => x.id === c.planId) : undefined
    if (!p || c.verdict?.score == null) continue
    const b = p.bucket.replace(/\s*\(.*\)/, '').replace(/\s+/g, ' ').trim()
    buckets.set(b, [...(buckets.get(b) ?? []), c.verdict.score])
  }
  const bucketRows = [...buckets.entries()].filter(([, v]) => v.length >= 2)
    .map(([k, v]) => ({ k, med: [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)], cnt: v.length }))
    .sort((a, b) => b.med - a.med)
  const fmtVal = metric === 'delivery' ? (x: number) => pct(x) : n

  return (
    <div className="vstack" style={{ gap: 28 }}>
      <section className="panel">
        <div className="panel-head">
          <h3>Month by month</h3>
          <div className="seg">{METRICS.map((m) => <button key={m.key} className={metric === m.key ? 'on' : ''} onClick={() => setMetric(m.key)}>{m.label}</button>)}</div>
        </div>
        <Columns format={fmtVal} items={reportMonths.map((m, i) => ({
          key: m.id, label: monthShort(m.id), value: def.get(m), emph: i === reportMonths.length - 1,
          sub: `${m.summary.posts} posts`,
        }))} tipLabel={(i) => <TipBody value={fmtVal(i.value)} label={`${def.label} · ${i.label}`} />} onPick={(k) => go({ month: k, view: 'overview' })} />
        <p className="fine">Click a month to open its overview. People reached is added across posts (organic).</p>
      </section>

      <div className="two">
        <section className="panel">
          <div className="panel-head"><h3>Where posts came from</h3></div>
          <table className="mini">
            <thead><tr><th /><th>Planned</th><th>Last-minute</th><th>Outside plan</th><th>Collab</th></tr></thead>
            <tbody>{reportMonths.map((m) => (
              <tr key={m.id}><td>{m.label}</td><td>{m.summary.markers.planned ?? 0}</td><td>{m.summary.markers.lastminute ?? 0}</td><td>{m.summary.markers.unconfirmed ?? 0}</td><td>{m.summary.collab.posts}</td></tr>
            ))}</tbody>
          </table>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Verdicts by month</h3></div>
          <table className="mini">
            <thead><tr><th /><th>Standout</th><th>Steady</th><th>Quiet</th><th>Boosted</th></tr></thead>
            <tbody>{reportMonths.map((m) => (
              <tr key={m.id}><td>{m.label}</td><td>{m.summary.verdicts.standout}</td><td>{m.summary.verdicts.steady}</td><td>{m.summary.verdicts.quiet}</td><td>{m.summary.verdicts.boosted}</td></tr>
            ))}</tbody>
          </table>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h3>Calendar buckets</h3><span className="muted">Median score against format typical (1.0 = typical) · buckets with 2+ live posts</span></div>
        <HRows format={(x) => `${x.toFixed(2)}×`} baseline={1} baselineLabel="1.0× = a typical post"
          items={bucketRows.map((b) => ({ key: b.k, label: `${b.k} (${b.cnt})`, value: b.med, tone: b.med >= 1 ? 'good' : 'bad' }))} />
      </section>

      <div className="two">
        <section>
          <div className="s-head"><h2 className="s-title">Best of Jul–Sep</h2></div>
          <div className="grid g4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>{top.map((c) => <TeamCard key={c.id} c={c} open={open} />)}</div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Most shared & saved</h3><span className="muted">Strongest sign parents passed it on</span></div>
          <HRows items={shared.map((c) => ({ key: c.id, label: c.title, value: c.plain.passedOn, tone: 'emph', onClick: () => open({ kind: 'c', id: c.id }) }))} />
        </section>
      </div>
    </div>
  )
}
