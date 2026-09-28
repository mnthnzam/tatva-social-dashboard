import { useState } from 'react'
import type { Content, ReportMonth } from '../types'
import type { Selection } from './Drawer'
import { DATA, monthContent, reportMonths } from '../lib/data'
import { monthShort, n, pct, plural } from '../lib/format'
import { Columns, CompareRows, DailyLines, HRows, TipBody } from './Charts'

type Def = { label: string; get: (c: Content) => number; month: (m: ReportMonth) => number; hint?: string }
export const METRIC_DEFS: Record<string, Def> = {
  reached: { label: 'People reached', get: (c) => c.plain.reached, month: (m) => m.summary.plain.reached, hint: 'Organic reach added across posts.' },
  reactions: { label: 'Reactions & comments', get: (c) => c.plain.reactions, month: (m) => m.summary.plain.reactions },
  passedOn: { label: 'Shares & saves', get: (c) => c.plain.passedOn, month: (m) => m.summary.plain.passedOn },
  follows: { label: 'New followers', get: (c) => c.plain.follows, month: (m) => m.summary.plain.follows },
  views_org: { label: 'Organic views', get: (c) => c.metrics.views_org, month: (m) => m.summary.views_org },
  inter_org: { label: 'Interactions (organic)', get: (c) => c.metrics.inter_org, month: (m) => m.summary.inter_org },
}

const own = (mid: string) => monthContent(mid).filter((c) => c.marker !== 'collab')
const sum = (cs: Content[], f: (c: Content) => number) => cs.reduce((a, c) => a + f(c), 0)

export function MetricSheet({ id, onOpen }: { id: string; onOpen: (s: Selection) => void }) {
  if (id.startsWith('acct|')) return <AccountMetricSheet id={id} />
  const [key, mid] = id.split('|')
  const def = METRIC_DEFS[key]
  const month = reportMonths.find((m) => m.id === mid)
  if (!def || !month) return null
  return <MonthMetricSheet def={def} month={month} onOpen={onOpen} />
}

function MonthMetricSheet({ def, month, onOpen }: { def: Def; month: ReportMonth; onOpen: (s: Selection) => void }) {
  const idx = reportMonths.findIndex((m) => m.id === month.id)
  const others = reportMonths.filter((m) => m.id !== month.id)
  const [vsId, setVsId] = useState<string>((reportMonths[idx - 1] ?? others[0])?.id ?? '')
  const vs = reportMonths.find((m) => m.id === vsId)
  const cur = own(month.id)
  const prv = vs ? own(vs.id) : []
  const v = def.month(month)
  const pv = vs ? def.month(vs) : 0
  const d = pv ? (v - pv) / pv : null
  const top = [...cur].sort((a, b) => def.get(b) - def.get(a)).slice(0, 6)
  const byFmt = (cs: Content[], f: string) => sum(cs.filter((c) => c.format === f), def.get)
  const planned = (cs: Content[]) => sum(cs.filter((c) => c.marker === 'planned'), def.get)
  const outside = (cs: Content[]) => sum(cs.filter((c) => c.marker !== 'planned'), def.get)

  return (
    <div className="sheet-body" style={{ gridTemplateColumns: '1fr' }}>
      <div className="sheet-info" style={{ paddingRight: 36 }}>
        <header className="sheet-h">
          <span className="eyebrow">{month.label} {month.year}</span>
          <h2>{def.label}</h2>
          <div className="acct-big">
            <strong>{n(v)}</strong>
            {d !== null && vs && <span className={d >= 0 ? 'tile-d up' : 'tile-d down'}>{d >= 0 ? '↑' : '↓'} {pct(Math.abs(d))} vs {vs.label} ({n(pv)})</span>}
          </div>
          {def.hint && <p className="fine">{def.hint}</p>}
        </header>

        <section>
          <h4 className="fine" style={{ marginBottom: 8 }}>Month by month · click a bar to compare with that month</h4>
          <Columns height={140} items={reportMonths.map((m) => ({ key: m.id, label: monthShort(m.id), value: def.month(m), emph: m.id === month.id, sub: plural(m.summary.posts, 'post') }))}
            onPick={(k) => k !== month.id && setVsId(k)} tipLabel={(i) => <TipBody value={n(i.value)} label={`${def.label} · ${i.label}`} />} />
        </section>

        <section className="vstack" style={{ gap: 12 }}>
          <div className="s-head" style={{ marginBottom: 0 }}>
            <h3 className="s-title" style={{ fontSize: 16 }}>Compared with</h3>
            <select className="sel" value={vsId} onChange={(e) => setVsId(e.target.value)} aria-label="Compare with month">
              {others.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          {vs && (
            <CompareRows aLabel={month.label} bLabel={vs.label} rows={[
              { key: 'tot', label: 'Total', a: v, b: pv },
              { key: 'avg', label: 'Per post', a: cur.length ? v / cur.length : 0, b: prv.length ? pv / prv.length : 0 },
              { key: 'st', label: 'Static posts', a: byFmt(cur, 'Static'), b: byFmt(prv, 'Static') },
              { key: 'ca', label: 'Carousels', a: byFmt(cur, 'Carousel'), b: byFmt(prv, 'Carousel') },
              { key: 're', label: 'Reels', a: byFmt(cur, 'Reel'), b: byFmt(prv, 'Reel') },
              { key: 'pl', label: 'From planned posts', a: planned(cur), b: planned(prv) },
              { key: 'ou', label: 'From posts outside the plan', a: outside(cur), b: outside(prv) },
            ]} />
          )}
          <p className="fine">{month.label}: {plural(cur.length, 'post')} · {vs?.label}: {plural(prv.length, 'post')}. “Per post” evens out months with more or fewer posts.</p>
        </section>

        <section>
          <h3 className="s-title" style={{ fontSize: 16, marginBottom: 10 }}>Biggest contributors in {month.label}</h3>
          <HRows items={top.map((c) => ({ key: c.id, label: c.title, value: def.get(c), tone: 'emph', onClick: () => onOpen({ kind: 'c', id: c.id }),
            tip: <TipBody value={n(def.get(c))} label={`${c.title} · ${v ? pct(def.get(c) / v) : ''} of the month`} /> }))} />
        </section>
      </div>
    </div>
  )
}

const ACCT_LABEL: Record<string, string> = {
  views: 'Views', reach: 'Accounts reached', viewers: 'Viewers', interactions: 'Content interactions', follows: 'New follows',
  unfollows: 'Unfollows', visits: 'Page visits', conversations: 'Conversations started',
}

function AccountMetricSheet({ id }: { id: string }) {
  const [, plat, metric] = id.split('|') as [string, 'instagram' | 'facebook', string]
  const A = DATA.account
  const p = A.platforms[plat]
  const m = p?.metrics[metric]
  if (!p || !m) return null
  const prevOf = (x: { value: number; change: number }) => (x.change > -1 ? x.value / (1 + x.change) : 0)
  const other = plat === 'instagram' ? A.platforms.facebook : A.platforms.instagram
  const series = [
    { key: plat, label: p.label, color: plat === 'instagram' ? 'var(--ig)' : 'var(--fb)', values: p.daily[metric] },
    ...(other.daily[metric] ? [{ key: 'o', label: other.label, color: plat === 'instagram' ? 'var(--fb)' : 'var(--ig)', values: other.daily[metric] }] : []),
  ].filter((s) => s.values)
  return (
    <div className="sheet-body" style={{ gridTemplateColumns: '1fr' }}>
      <div className="sheet-info" style={{ paddingRight: 36 }}>
        <header className="sheet-h">
          <span className="eyebrow">{p.label} · {A.period.label}</span>
          <h2>{ACCT_LABEL[metric] ?? metric}</h2>
          <div className="acct-big">
            <strong>{n(m.value)}</strong>
            <span className={`tile-d ${Math.abs(m.change) < 0.02 ? 'flat' : (m.change > 0) !== (metric === 'unfollows') ? 'up' : 'down'}`}>
              {m.change > 0.02 ? '↑' : m.change < -0.02 ? '↓' : '→'} {pct(Math.abs(m.change))} vs the {A.period.compare} (about {n(prevOf(m))})
            </span>
          </div>
        </header>
        {series.length > 0 && (
          <section>
            <h4 className="fine" style={{ marginBottom: 8 }}>By day · hover for values</h4>
            <DailyLines days={A.days} series={series as { key: string; label: string; color: string; values: (number | null)[] }[]} />
          </section>
        )}
        <section>
          <h3 className="s-title" style={{ fontSize: 16, marginBottom: 10 }}>{p.label}: this period vs the one before</h3>
          <CompareRows aLabel={A.period.label} bLabel={A.period.compare} rows={Object.entries(p.metrics).map(([k, x]) => ({ key: k, label: ACCT_LABEL[k] ?? k, a: x.value, b: prevOf(x) }))} />
          <p className="fine" style={{ marginTop: 8 }}>Previous-period values are worked back from Meta’s % change, so they’re approximate.</p>
        </section>
        {p.note && <p className="callout">{p.note}</p>}
      </div>
    </div>
  )
}
