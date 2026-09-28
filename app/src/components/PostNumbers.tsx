import type { Content, Plain } from '../types'
import { DATA } from '../lib/data'
import { n } from '../lib/format'

export const PLAIN: { key: keyof Plain; label: string; short: string; hint: string }[] = [
  { key: 'reached', label: 'people reached', short: 'reached', hint: 'Accounts that saw the post (Instagram + Facebook added together, organic only).' },
  { key: 'reactions', label: 'reactions & comments', short: 'reactions', hint: 'Likes, reactions and comments.' },
  { key: 'passedOn', label: 'shares & saves', short: 'shares & saves', hint: 'People sending it on or keeping it — the strongest sign a post mattered to parents.' },
  { key: 'follows', label: 'new followers', short: 'new followers', hint: 'Follows Meta credits to this post.' },
]

/** Boosted posts show totals (organic + paid) so the numbers match what the client paid for. */
export const shown = (c: Content): Plain =>
  c.boosted
    ? { reached: c.metrics.reach, reactions: c.metrics.likes + c.metrics.comments, passedOn: c.metrics.shares + c.metrics.saves, follows: c.metrics.follows }
    : c.plain

/** Four plain numbers, each against a typical post of the same format. */
export function BigNumbers({ c }: { c: Content }) {
  const typ = DATA.typical[c.format]
  const own = c.marker !== 'collab'
  return (
    <div className="bignums">
      {PLAIN.map((m) => {
        const v = shown(c)[m.key]
        const t = typ?.[m.key] ?? 0
        const max = Math.max(v, t, 1) * 1.1
        return (
          <div key={m.key} className="bignum" title={m.hint}>
            <strong>{n(v)}</strong>
            <span>{m.label}</span>
            {c.boosted && m.key === 'reached' && <em>incl. {n(c.metrics.reach_ads)} through the ad</em>}
            {own && !c.boosted && t > 0 && (
              <>
                <div className="cmp">
                  <div className="cmp-track">
                    <span className={`cmp-fill${v >= t * 1.15 ? ' hi' : ''}`} style={{ width: `${(v / max) * 100}%` }} />
                    <span className="cmp-mark" style={{ left: `${(t / max) * 100}%` }} />
                  </div>
                </div>
                <em>typical {c.format.toLowerCase()}: {n(t)}</em>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Compact four-up row for cards. */
export function FourUp({ c }: { c: Content }) {
  return (
    <div className="four">
      {PLAIN.map((m) => (
        <div key={m.key} title={m.hint}>
          <strong>{n(shown(c)[m.key])}</strong>
          <span>{m.short}</span>
        </div>
      ))}
    </div>
  )
}
