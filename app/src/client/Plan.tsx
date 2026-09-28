import { useMemo, useState } from 'react'
import type { PlanItem, PlanMonth } from '../types'
import type { Selection } from '../components/Drawer'
import { monthPlan } from '../lib/data'
import { day, dayLong, parseDate, plural } from '../lib/format'
import { Creative } from '../components/Creative'

type Filter = 'all' | 'posts' | 'reels'

const weekLabel = (d: string | null) => {
  if (!d) return 'Date to be fixed'
  const x = parseDate(d)
  const mon = new Date(x)
  mon.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const f = (y: Date) => y.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${f(mon)} – ${f(sun)}`
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
/** Reels whose "copy" is only a hand-off note ("Video to be shared by Tatva") have no script to show. */
const hasScript = (p: PlanItem) => p.format === 'Reel' && !!p.copy && !/^video to be shared/i.test(p.copy.trim())

/** Where a planned post stands, in one short line. */
export function readiness(p: PlanItem): { tone: 'ok' | 'wait' | 'todo'; text: string } {
  if (!p.concept && !p.copy) return { tone: 'todo', text: 'Topic to be fixed with your team' }
  if (p.format === 'Reel') {
    const [first, what] = hasScript(p) ? ['Script ready', 'footage '] : ['Video from your team', '']
    if (p.footageDue) return { tone: 'wait', text: `${first} · ${what}due ${day(p.footageDue)}` }
    if (p.dueText) return { tone: 'wait', text: `${first} · ${what}${lowerFirst(p.dueText)}` }
    return { tone: 'wait', text: `${first} · waiting for footage` }
  }
  return p.creative ? { tone: 'ok', text: 'Design ready' } : { tone: 'wait', text: 'Design in progress' }
}

export function Plan({ month, open }: { month: PlanMonth; open: (s: Selection) => void }) {
  const pl = monthPlan(month.id)
  const s = month.summary
  const [filter, setFilter] = useState<Filter>('all')
  const reels = pl.filter((p) => p.format === 'Reel')
  const list = filter === 'all' ? pl : filter === 'reels' ? reels : pl.filter((p) => p.format !== 'Reel')
  const weeks = useMemo(() => {
    const m = new Map<string, PlanItem[]>()
    for (const p of list) m.set(weekLabel(p.date), [...(m.get(weekLabel(p.date)) ?? []), p])
    return [...m.entries()]
  }, [list])
  const footage = pl.filter((p) => p.needsFootage).sort((a, b) => (a.footageDue ?? a.date ?? '9').localeCompare(b.footageDue ?? b.date ?? '9'))
  const statics = s.formats.Static + (s.formats.Carousel ?? 0)

  return (
    <>
      <header className="p-head">
        <span className="eyebrow">{month.label} {month.year} · Content plan</span>
        <h1 className="p-title">What’s going out in {month.label}</h1>
        <p className="p-sub">Every post in the calendar, week by week. Designs are final; reels get made once footage comes in from your team. Want something changed? Tell us on the call or on WhatsApp and we’ll update it here.</p>
      </header>

      <div className="strip">
        <div><small>Posts planned</small><b>{s.planned}</b><span>{s.dated} with a date</span></div>
        <div><small>Designs ready</small><b>{s.designReady}<i> of {statics}</i></b><span>static posts, final</span></div>
        <div><small>Reels</small><b>{s.formats.Reel ?? 0}</b><span>{s.needsFootage} need footage from you</span></div>
        <div><small>Also on LinkedIn</small><b>{s.linkedin}</b><span>{plural(s.boostPlanned, 'boost')} planned</span></div>
      </div>

      {footage.length > 0 && (
        <section className="panel">
          <div className="panel-head"><h3>Footage we need from you</h3><span className="muted">So the reels can go out on time</span></div>
          <ul className="rows">
            {footage.map((p) => (
              <li key={p.id}>
                <button className="row" onClick={() => open({ kind: 'p', id: p.id })}>
                  <span className="row-date">{p.footageDue ? day(p.footageDue) : p.dueText ? 'After event' : 'TBC'}</span>
                  <span className="row-title">{p.title}</span>
                  <span className="row-meta">{p.need ?? (p.date ? `Goes out ${day(p.date)}` : 'Post date to be fixed')}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <div className="s-head">
          <h2 className="s-title">The line-up</h2>
          <div className="seg" role="tablist">
            {([['all', 'All', pl.length], ['posts', 'Posts', pl.length - reels.length], ['reels', 'Reels', reels.length]] as const).map(([k, l, c]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l} <em>{c}</em></button>
            ))}
          </div>
        </div>
        {weeks.map(([w, items]) => (
          <div key={w} className="week">
            <div className="week-h">{w}</div>
            {items.map((p) => <PlanRow key={p.id} p={p} open={open} />)}
          </div>
        ))}
      </section>
    </>
  )
}

function PlanRow({ p, open }: { p: PlanItem; open: (s: Selection) => void }) {
  const [expand, setExpand] = useState(false)
  const reel = p.format === 'Reel'
  const r = readiness(p)
  return (
    <article className="rv-card">
      <Creative img={p.creative} format={p.format} label={p.title} ratio={p.creative ? undefined : '4 / 3'} onClick={() => open({ kind: 'p', id: p.id })}
        placeholder={reel ? (p.footageDue ? `Reel · footage due ${day(p.footageDue)}` : 'Reel · waiting for footage') : 'Design in progress'} />
      <div className="rv-body">
        <div>
          <span className="rv-date">{p.date ? dayLong(p.date) : 'Date to be fixed'}</span>
          <h3 className="rv-title">{p.title}</h3>
          <div className="rv-meta">{p.bucket} · {p.format} · {p.platforms}{p.boostPlanned && <span className="chip chip-outline">💵 Boost planned</span>}</div>
        </div>
        <span className={`ready ${r.tone}`}><i />{r.text}</span>
        <div className="rv-copy">
          {!reel && p.copy && <div className="rv-block"><h5>On the post</h5><p className={expand ? '' : 'clamp'}>{p.copy}</p></div>}
          {p.concept && <div className="rv-block"><h5>The idea</h5><p className={expand ? '' : 'clamp'}>{p.concept}</p></div>}
          {hasScript(p) && <div className="rv-block"><h5>Script</h5><p className={expand ? '' : 'clamp'}>{p.copy}</p></div>}
          {p.caption && expand && <div className="rv-block"><h5>Caption</h5><p>{p.caption}</p></div>}
          {(p.concept || (p.copy && (!reel || hasScript(p))) || p.caption) && <button className="more" onClick={() => setExpand(!expand)}>{expand ? 'Show less' : p.caption ? 'Read everything, including the caption' : 'Read more'}</button>}
          {!p.concept && !p.copy && <p className="muted">Your team is sending this reel; we’ll fix the topic and date together.</p>}
        </div>
      </div>
    </article>
  )
}
