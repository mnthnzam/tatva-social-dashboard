import type { Selection } from '../components/Drawer'
import { DATA, contentById, reportMonths } from '../lib/data'
import { day, full, monthShort, n, pct } from '../lib/format'
import { Dumbbell, StatTile } from '../components/Charts'

export function Boosts({ open }: { open: (s: Selection) => void }) {
  const own = DATA.content.filter((c) => c.marker !== 'collab')
  const boosted = own.filter((c) => c.boosted).sort((a, b) => b.metrics.reach_ads - a.metrics.reach_ads)
  const last = reportMonths[reportMonths.length - 1]
  const prev = reportMonths[reportMonths.length - 2]
  const planned = DATA.plan.filter((p) => p.boostPlanned && p.month <= last.id)
  const live = planned.filter((p) => p.contentId)
  const ran = live.filter((p) => contentById.get(p.contentId!)?.boosted)
  const organicOnly = live.filter((p) => !contentById.get(p.contentId!)?.boosted)
  const neverPosted = planned.filter((p) => !p.contentId && p.status !== 'Upcoming')
  const noMark = boosted.filter((c) => !c.boostPlanned)
  const spark = (f: (m: (typeof reportMonths)[number]) => number) => reportMonths.map((m) => ({ label: m.label, value: f(m) }))

  return (
    <div className="vstack" style={{ gap: 28 }}>
      <p className="lede">{boosted.length} of {own.length} own posts had paid support between July and September. The comparison that matters is what each boost added against a typical organic post — month-to-month paid totals mostly reflect how much was spent.</p>

      <div className="tiles">
        <StatTile label={`Boosted posts · ${last.label}`} value={String(last.summary.boosted)} cur={last.summary.boosted} prev={prev.summary.boosted} prevLabel={prev.label} spark={spark((m) => m.summary.boosted)} />
        <StatTile label={`Reach through ads · ${last.label}`} value={n(last.summary.boostReach)} cur={last.summary.boostReach} prev={prev.summary.boostReach} prevLabel={prev.label} spark={spark((m) => m.summary.boostReach)} />
        <StatTile label={`Paid views · ${last.label}`} value={n(last.summary.views_ads)} cur={last.summary.views_ads} prev={prev.summary.views_ads} prevLabel={prev.label} spark={spark((m) => m.summary.views_ads)} />
        <StatTile label="💵 in calendar → boost ran" value={`${ran.length}/${live.length}`} note={`${organicOnly.length} ran organic only · ${noMark.length} boosted without 💵`} />
      </div>

      <section className="panel">
        <div className="panel-head"><h3>What each boost added</h3><span className="muted">Hover a row for numbers · click to open</span></div>
        <Dumbbell typicalLabel="Typical organic reach for the format" rows={boosted.map((c) => ({
          key: c.id, label: c.title, sub: `${day(c.date)} · ${c.format}${c.boostPlanned ? ' · 💵 planned' : ''}`,
          org: c.metrics.reach_org, total: c.metrics.reach, typical: DATA.typical[c.format]?.reached ?? 0,
          onClick: () => open({ kind: 'c', id: c.id }),
        }))} />
        <p className="fine" style={{ marginTop: 12 }}>Organic reach of a boosted post looks small because Meta credits most of the audience to the ad. Read the orange dot against the grey tick: that gap is what the money bought over a normal post.</p>
      </section>

      <div className="two">
        <section className="panel">
          <div className="panel-head"><h3>Calendar vs what ran</h3></div>
          <ul className="rows">
            {[...ran.map((p) => ({ p, t: '💵 and boosted', st: 'st-ok' })), ...organicOnly.map((p) => ({ p, t: '💵 but organic only', st: 'st-late' })), ...neverPosted.map((p) => ({ p, t: '💵 but never posted', st: 'st-miss' }))].map(({ p, t, st }) => (
              <li key={p.id}><button className="row" onClick={() => open({ kind: 'p', id: p.id })}>
                <span className="row-date">{day(p.date)}</span><span className="row-title">{p.title}</span><span className={`lg ${st}`}>{t}</span>
              </button></li>
            ))}
            {noMark.map((c) => (
              <li key={c.id}><button className="row" onClick={() => open({ kind: 'c', id: c.id })}>
                <span className="row-date">{day(c.date)}</span><span className="row-title">{c.title}</span><span className="lg st-swap">Boosted, no 💵</span>
              </button></li>
            ))}
          </ul>
        </section>
        <section className="panel flush">
          <table className="plist">
            <thead><tr><th>Boosted post</th><th className="r">Paid share of reach</th><th className="r">Link clicks from ads</th></tr></thead>
            <tbody>
              {boosted.map((c) => (
                <tr key={c.id} onClick={() => open({ kind: 'c', id: c.id })}>
                  <td><strong>{c.title}</strong><span className="sub">{monthShort(c.month)} · {n(c.metrics.reach)} reached</span></td>
                  <td className="r">{pct(c.metrics.reach_ads / Math.max(c.metrics.reach, 1))}</td>
                  <td className="r">{full(c.metrics.clicks_ads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <p className="callout">Not in this data: spend, cost per result, audience and objective. They need Meta ad-account access. Once connected, each boost gets cost per 1,000 people reached and cost per follower, and month-over-month becomes meaningful.</p>
    </div>
  )
}
