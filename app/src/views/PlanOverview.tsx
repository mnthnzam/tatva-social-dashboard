import type { Month } from '../types'
import type { Selection } from '../components/Drawer'
import type { Route } from '../App'
import { DATA, monthPlan } from '../lib/data'
import { day, parseDate, plural } from '../lib/format'
import { StatTile } from '../components/Charts'
import { Icon } from '../components/Icon'
import { PlanCard } from './common'

type P = { month: Month; open: (s: Selection) => void; go: (r: Partial<Route>) => void }

export function PlanOverview({ month, open, go }: P) {
  const pl = monthPlan(month.id)
  const s = month.kind === 'plan' ? month.summary : null
  const t = new Date()
  const t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  const footage = pl.filter((p) => p.needsFootage).sort((a, b) => (a.footageDue ?? a.date ?? '9').localeCompare(b.footageDue ?? b.date ?? '9'))
  const nextDue = footage.find((p) => p.footageDue && parseDate(p.footageDue) >= t0)
  const prevPlan = DATA.plan.filter((p) => p.month < month.id && (p.status === 'Not posted' || p.status === 'Upcoming'))
  const norm = (x: string) => x.replace(/\s*\(\d\)/, '').toLowerCase()
  const carried = pl.filter((p) => prevPlan.some((q) => norm(q.title) === norm(p.title)))
  if (!s) return null
  return (
    <div className="vstack" style={{ gap: 28 }}>
      <p className="lede">{plural(s.planned, 'post')} in the {month.label} calendar ({s.dated} dated) · {s.designReady} designs ready · {s.needsFootage} reels waiting on footage from Tatva.</p>
      <div className="tiles">
        <StatTile label="Designs ready" value={`${s.designReady}/${s.formats.Static + (s.formats.Carousel ?? 0)}`} note="static posts with a final design" />
        <StatTile label="Needs footage" value={String(s.needsFootage)} note="reels depending on Tatva" />
        <StatTile label="Next footage due" value={nextDue ? day(nextDue.footageDue) : '—'} note={nextDue ? nextDue.title : 'nothing dated ahead'} />
        <StatTile label="Boost planned" value={String(s.boostPlanned)} note={`${s.linkedin} going to LinkedIn too`} />
      </div>
      <div className="two">
        <section className="panel">
          <div className="panel-head"><h3>Footage tracker</h3><span className="muted">What Tatva needs to send, by when</span></div>
          <ul className="rows">
            {footage.map((p) => {
              const due = p.footageDue ? parseDate(p.footageDue) : null
              const left = due ? Math.round((due.getTime() - t0.getTime()) / 86400000) : null
              return (
                <li key={p.id}>
                  <button className="row" onClick={() => open({ kind: 'p', id: p.id })}>
                    <span className={`row-date${left !== null && left < 0 ? ' overdue' : ''}`}>{p.footageDue ? day(p.footageDue) : 'TBC'}<em>{left === null ? (p.dueText ? 'after event' : '') : left < 0 ? `${-left}d overdue` : left === 0 ? 'today' : `in ${left}d`}</em></span>
                    <span className="row-title">{p.title}</span>
                    <span className="row-meta">{p.date ? `Posts ${day(p.date)}` : 'Post date TBC'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Carried over</h3><span className="muted">Planned earlier, not yet posted</span></div>
          <ul className="rows">
            {carried.map((p) => (
              <li key={p.id}>
                <button className="row" onClick={() => open({ kind: 'p', id: p.id })}>
                  <span className="row-date">{day(p.date)}</span>
                  <span className="row-title">{p.title}</span>
                  <span className="row-meta">{p.note ?? 'Also in an earlier plan.'}</span>
                </button>
              </li>
            ))}
          </ul>
          <button className="link" style={{ marginTop: 10 }} onClick={() => go({ view: 'plan' })}>Open the calendar <Icon name="arrow" size={14} /></button>
        </section>
      </div>
      <section>
        <div className="s-head"><h2 className="s-title">The {month.label} line-up</h2><span className="s-note">Designs from Canva where they exist</span></div>
        <div className="grid g4">{pl.map((p) => <PlanCard key={p.id} p={p} open={open} />)}</div>
      </section>
    </div>
  )
}
