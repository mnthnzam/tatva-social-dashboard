import type { Selection } from '../components/Drawer'
import { DATA } from '../lib/data'
import { n, plural } from '../lib/format'
import { TeamCard } from './common'

export function Collabs({ open }: { open: (s: Selection) => void }) {
  const col = DATA.content.filter((c) => c.marker === 'collab')
  const partners = [...new Set(col.map((c) => c.partner!))]
  return (
    <div className="vstack" style={{ gap: 28 }}>
      <p className="lede">Posts from partner accounts with TGS as collaborator. They reach the partner’s audience, so they stay out of the calendar and page numbers.</p>
      {partners.map((pt) => {
        const list = col.filter((c) => c.partner === pt).sort((a, b) => b.date.localeCompare(a.date))
        return (
          <section key={pt}>
            <div className="s-head"><h2 className="s-title">{pt}</h2><span className="s-note">{plural(list.length, 'post')} · {n(list.reduce((a, c) => a + c.metrics.views, 0))} views · @{list[0].account}</span></div>
            <div className="grid g4">{list.map((c) => <TeamCard key={c.id} c={c} open={open} />)}</div>
          </section>
        )
      })}
    </div>
  )
}
