import type { ReportMonth } from '../types'
import type { Selection } from '../components/Drawer'
import type { Route } from '../App'
import { DATA, contentById, monthContent, monthPlan, planById, reportMonths } from '../lib/data'
import { day, n, pct, plural } from '../lib/format'
import { Dot, StatusChip } from '../components/Badges'
import { HRows, StatTile } from '../components/Charts'
import { Icon } from '../components/Icon'
import { STATUS_ST, TeamCard } from './common'

type P = { month: ReportMonth; open: (s: Selection) => void; go: (r: Partial<Route>) => void }
const ORDER = ['On date', 'Early', 'Late', 'Replaced', 'Not posted', 'Upcoming'] as const

export function Overview({ month, open, go }: P) {
  const s = month.summary
  const idx = reportMonths.findIndex((m) => m.id === month.id)
  const prev = idx > 0 ? reportMonths[idx - 1] : undefined
  const upto = reportMonths.slice(0, idx + 1)
  const spark = (f: (m: ReportMonth) => number) => upto.map((m) => ({ label: m.label, value: f(m) }))
  const own = monthContent(month.id).filter((c) => c.marker !== 'collab')
  const pl = monthPlan(month.id)
  const top = [...own].filter((c) => c.index !== null).sort((a, b) => (b.index ?? 0) - (a.index ?? 0)).slice(0, 4)
  const outside = own.filter((c) => c.marker !== 'planned').sort((a, b) => b.metrics.views_org - a.metrics.views_org)
  const missed = pl.filter((p) => p.status === 'Not posted' || p.status === 'Replaced')

  return (
    <div className="vstack" style={{ gap: 28 }}>
      <p className="lede">
        {plural(s.posts, 'post')} on TGS’s own pages · {s.delivered}/{s.due} planned posts delivered · {n(s.views_org)} organic views
        {s.collab.posts > 0 && ` · ${plural(s.collab.posts, 'collab post')} counted separately`}.
      </p>

      <div className="tiles">
        <StatTile label="Organic views" value={n(s.views_org)} cur={s.views_org} prev={prev?.summary.views_org} prevLabel={prev?.label} spark={spark((m) => m.summary.views_org)} />
        <StatTile label="Plan delivered" value={`${s.delivered}/${s.due}`} cur={s.delivered / Math.max(s.due, 1)} prev={prev ? prev.summary.delivered / Math.max(prev.summary.due, 1) : undefined} prevLabel={prev?.label}
          spark={spark((m) => m.summary.delivered / Math.max(m.summary.due, 1))} note={s.status['Upcoming'] ? `${s.status['Upcoming']} still upcoming` : undefined} />
        <StatTile label="Interactions (organic)" value={n(s.inter_org)} cur={s.inter_org} prev={prev?.summary.inter_org} prevLabel={prev?.label} spark={spark((m) => m.summary.inter_org)} />
        <StatTile label="Follows from posts" value={n(s.follows)} cur={s.follows} prev={prev?.summary.follows} prevLabel={prev?.label} spark={spark((m) => m.summary.follows)} />
      </div>

      <section>
        <div className="s-head"><h2 className="s-title">What the month says</h2><span className="s-note">Generated from the data · click to open the post</span></div>
        <div className="insights">
          {month.insights.map((i) => (
            <button key={i.kind} className="insight" disabled={!i.refs.length} onClick={() => {
              const r = i.refs[0]
              if (contentById.has(r)) open({ kind: 'c', id: r })
              else if (planById.has(r)) open({ kind: 'p', id: r })
            }}>
              <span className="insight-t"><Dot tone={i.tone} />{i.title}</span>
              <span className="insight-b">{i.body}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="two">
        <section className="panel">
          <div className="panel-head"><h3>Plan delivery</h3><button className="link" onClick={() => go({ view: 'plan' })}>Plan vs live <Icon name="arrow" size={14} /></button></div>
          <div className="dl-bar" style={{ height: 12 }}>
            {ORDER.filter((k) => s.status[k]).map((k) => <span key={k} className={STATUS_ST[k]} style={{ flex: s.status[k], background: 'var(--st)' }} title={`${k}: ${s.status[k]}`} />)}
          </div>
          <div className="legend">{ORDER.filter((k) => s.status[k]).map((k) => <span key={k} className={`lg ${STATUS_ST[k]}`}>{k} {s.status[k]}</span>)}</div>
          <div style={{ marginTop: 18 }}>
            <HRows format={(x) => pct(x)} items={Object.entries(s.byOwner).map(([o, v]) => ({
              key: o, label: o === 'Tatva' ? `Needs Tatva input · ${v.delivered}/${v.due}` : `Zamstars-made · ${v.delivered}/${v.due}`,
              value: v.delivered / Math.max(v.due, 1), tone: v.delivered / Math.max(v.due, 1) >= 0.8 ? 'good' : 'bad',
            }))} />
          </div>
          {missed.length > 0 && (
            <ul className="rows" style={{ marginTop: 10 }}>
              {missed.map((p) => (
                <li key={p.id}>
                  <button className="row" onClick={() => open({ kind: 'p', id: p.id })}>
                    <span className="row-date">{day(p.date)}</span>
                    <span className="row-title">{p.title}</span>
                    <StatusChip status={p.status} />
                    <span className="row-meta">{p.format}{p.dependency ? ` · ${p.dependency}` : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Formats this month</h3><span className="muted">Median organic views · ▏= Jul–Sep typical</span></div>
          {Object.entries(s.formats).sort((a, b) => b[1].median - a[1].median).map(([f, v]) => (
            <div key={f} style={{ marginBottom: 6 }}>
              <HRows items={[{ key: f, label: `${f} · ${plural(v.count, 'post')}`, value: v.median, tone: v.median >= (DATA.baselines[f]?.median ?? 0) ? 'good' : 'bad' }]}
                baseline={DATA.baselines[f]?.median} />
            </div>
          ))}
          <p className="fine" style={{ marginTop: 10 }}>Typical: Static {n(DATA.baselines.Static?.median)} · Carousel {n(DATA.baselines.Carousel?.median)} · Reel {n(DATA.baselines.Reel?.median)}.
            {s.stories.count > 0 && ` Stories: ${s.stories.count} (${n(s.stories.views)} views), not included.`}</p>
          {s.boosted > 0 && (
            <p className="fine" style={{ marginTop: 6 }}>{plural(s.boosted, 'boosted post')} · {n(s.views_ads)} paid views · {n(s.boostReach)} paid reach. <button className="link" style={{ fontSize: 12.5 }} onClick={() => go({ view: 'boosts' })}>Boosts</button></p>
          )}
        </section>
      </div>

      <section>
        <div className="s-head"><h2 className="s-title">Strongest against format</h2><button className="link" onClick={() => go({ view: 'posts' })}>All {own.length} posts <Icon name="arrow" size={14} /></button></div>
        <div className="grid g4">{top.map((c) => <TeamCard key={c.id} c={c} open={open} />)}</div>
      </section>

      {outside.length > 0 && (
        <section>
          <div className="s-head"><h2 className="s-title">Outside the calendar</h2><span className="s-note">{pct(s.unplannedViewsShare)} of organic views</span></div>
          <div className="grid g4">{outside.map((c) => <TeamCard key={c.id} c={c} open={open} />)}</div>
        </section>
      )}
    </div>
  )
}
