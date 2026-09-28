import { useMemo, useState } from 'react'
import type { Format, Marker, Month } from '../types'
import type { Selection } from '../components/Drawer'
import type { Route } from '../App'
import { DATA, MARKERS, monthPlan } from '../lib/data'
import { n } from '../lib/format'
import { PlanCard, TeamCard } from './common'

type P = { month: Month; open: (s: Selection) => void; go: (r: Partial<Route>) => void }
type Sort = 'date' | 'views' | 'index' | 'shares'

export function Posts({ month, open }: P) {
  const [scope, setScope] = useState<'month' | 'all'>(month.kind === 'plan' ? 'all' : 'month')
  const [markers, setMarkers] = useState<Set<Marker>>(new Set(['planned', 'lastminute', 'unconfirmed']))
  const [fmt, setFmt] = useState<Format | 'all'>('all')
  const [boostOnly, setBoostOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('date')
  const inScope = (m: string) => scope === 'all' || m === month.id
  const list = useMemo(() => {
    let l = DATA.content.filter((c) => inScope(c.month) && markers.has(c.marker))
    if (fmt !== 'all') l = l.filter((c) => c.format === fmt)
    if (boostOnly) l = l.filter((c) => c.boosted)
    const key: Record<Sort, (c: (typeof l)[number]) => number> = {
      date: (c) => -Number(c.date.replace(/\D/g, '')),
      views: (c) => -(c.marker === 'collab' ? c.metrics.views : c.metrics.views_org),
      index: (c) => -(c.index ?? -1),
      shares: (c) => -c.metrics.shares_org,
    }
    return [...l].sort((a, b) => key[sort](a) - key[sort](b))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, month.id, markers, fmt, boostOnly, sort])

  const toggle = (m: Marker) => {
    const s = new Set(markers)
    if (s.has(m)) s.delete(m)
    else s.add(m)
    setMarkers(s)
  }
  const count = (m: Marker) => DATA.content.filter((c) => inScope(c.month) && c.marker === m).length
  const total = list.reduce((a, c) => a + (c.marker === 'collab' ? c.metrics.views : c.metrics.views_org), 0)

  return (
    <div className="vstack">
      <div className="filters">
        <div className="seg">
          <button className={scope === 'month' ? 'on' : ''} onClick={() => setScope('month')}>{month.label}</button>
          <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>Jul–Sep</button>
        </div>
        {(Object.keys(MARKERS) as Marker[]).map((m) => (
          <button key={m} className={`fchip${markers.has(m) ? ' on' : ''}`} onClick={() => toggle(m)} title={MARKERS[m].hint}>{MARKERS[m].short}<em>{count(m)}</em></button>
        ))}
        <select className="fchip" value={fmt} onChange={(e) => setFmt(e.target.value as Format | 'all')} aria-label="Format" style={{ background: 'var(--surface)' }}>
          <option value="all">All formats</option><option>Static</option><option>Carousel</option><option>Reel</option>
        </select>
        <button className={`fchip${boostOnly ? ' on' : ''}`} onClick={() => setBoostOnly(!boostOnly)}>Boosted only</button>
        <label className="sort">Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="date">Newest first</option><option value="views">Organic views</option><option value="index">Against format typical</option><option value="shares">Shares</option>
          </select>
        </label>
      </div>
      {month.kind === 'plan' && scope === 'month' ? (
        <>
          <p className="lede">{month.label} hasn’t started — here’s the planned line-up.</p>
          <div className="grid g4">{monthPlan(month.id).map((p) => <PlanCard key={p.id} p={p} open={open} />)}</div>
        </>
      ) : (
        <>
          <p className="fine">{list.length} posts · {n(total)} views{markers.has('collab') ? ' (collabs show total views, own posts organic)' : ' (organic)'}</p>
          {list.length === 0 ? <p className="rv-empty">No posts match these filters.</p> : <div className="grid g4">{list.map((c) => <TeamCard key={c.id} c={c} open={open} />)}</div>}
        </>
      )}
    </div>
  )
}
