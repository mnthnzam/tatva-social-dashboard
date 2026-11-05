import { RANGE } from '../lib/data'
import { noPreview } from '../lib/data'
import { useMemo, useState } from 'react'
import type { Content, ReportMonth, VerdictKey } from '../types'
import type { Selection } from '../components/Drawer'
import { monthContent, reportMonths } from '../lib/data'
import { day, n, plural } from '../lib/format'
import { Creative } from '../components/Creative'
import { VerdictChip } from '../components/Badges'
import { StatTile } from '../components/Charts'
import { FourUp } from '../components/PostNumbers'
import { FunnelStrip, MonthContext, PaidBlock, PartialNotice, WebBlock } from './Funnel'

function Feature({ c, open, compact }: { c: Content; open: (s: Selection) => void; compact?: boolean }) {
  return (
    <button className={`feature${compact ? ' compact' : ''}`} onClick={() => open({ kind: 'c', id: c.id })}>
      <Creative img={c.image} format={c.format} label={c.title} placeholder={noPreview(c)} />
      <div className="feature-body">
        <div className="pcard-row" style={{ justifyContent: 'flex-start' }}><VerdictChip c={c} /><span className="pcard-date">{day(c.date)} · {c.format}</span></div>
        <h3 className="feature-title">{c.title}</h3>
        <p className="feature-why">{c.why}</p>
        <FourUp c={c} />
      </div>
    </button>
  )
}

export function PostCard({ c, open, why = true }: { c: Content; open: (s: Selection) => void; why?: boolean }) {
  return (
    <button className="pcard" onClick={() => open({ kind: 'c', id: c.id })}>
      <Creative img={c.image} format={c.format} label={c.title} placeholder={noPreview(c)} />
      <div className="pcard-meta">
        <div className="pcard-row"><VerdictChip c={c} /><span className="pcard-date">{day(c.date)}</span></div>
        <span className="pcard-title">{c.title}</span>
        {why && <span className="pcard-why">{c.why}</span>}
        <FourUp c={c} />
      </div>
    </button>
  )
}

const FILTERS: { key: 'all' | VerdictKey; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'standout', label: 'Standout' }, { key: 'steady', label: 'Steady' }, { key: 'quiet', label: 'Quiet' }, { key: 'boosted', label: 'Boosted' },
]

export function Results({ month, open }: { month: ReportMonth; open: (s: Selection) => void }) {
  const [filter, setFilter] = useState<'all' | VerdictKey>('all')
  const idx = reportMonths.findIndex((m) => m.id === month.id)
  const prev = idx > 0 ? reportMonths[idx - 1] : undefined
  const upto = reportMonths.slice(0, idx + 1)
  const s = month.summary
  const own = monthContent(month.id).filter((c) => c.marker !== 'collab')
  const collabs = monthContent(month.id).filter((c) => c.marker === 'collab')
  const ranked = [...own].filter((c) => c.verdict?.score !== null && c.verdict?.score !== undefined).sort((a, b) => b.verdict!.score! - a.verdict!.score!)
  const best = ranked.filter((c) => c.verdict!.key === 'standout').slice(0, 4)
  // Posts not in the calendar: campus moments added during the month.
  const added = own.filter((c) => c.marker === 'tatva' || c.marker === 'lastminute' || c.marker === 'unconfirmed').length
  // When fewer posts went out than last month, say so next to the totals.
  const fewer = prev && prev.summary.posts > s.posts ? `${s.posts} posts vs ${prev.summary.posts} in ${prev.label}` : ''
  const list = useMemo(() => own.filter((c) => filter === 'all' || c.verdict?.key === filter).sort((a, b) => b.date.localeCompare(a.date)), [own, filter])
  const spark = (k: 'reached' | 'reactions' | 'passedOn' | 'follows') => upto.map((m) => ({ label: m.label, value: m.summary.plain[k] }))

  return (
    <>
      <header className="p-head">
        <span className="eyebrow">{month.label} {month.year} · Results{month.value ? ` · Value of the month: ${month.value}` : ''}</span>
        <h1 className="p-title">How {month.label} went</h1>
        <p className="p-sub">
          <strong>{plural(s.posts, 'post')}</strong> on your pages reached <strong>{n(s.plain.reached)} people</strong>, got <strong>{n(s.plain.reactions)} reactions and comments</strong> and were
          shared or saved <strong>{n(s.plain.passedOn)} times</strong>. {s.verdicts.standout > 0 && <>{plural(s.verdicts.standout, 'post')} clearly stood out.</>}
        </p>
        <PartialNotice month={month} />
      </header>

      <section className="section" style={{ marginTop: 32 }}>
        <div className="s-head"><h2 className="s-title">From reach to admissions</h2><span className="s-note">What social media, ads and the school portal fed into Project 800</span></div>
        <FunnelStrip month={month} />
      </section>

      <section className="section">
      <div className="s-head"><h2 className="s-title">How the posts did</h2><span className="s-note">Organic only · vs {prev ? prev.label : 'last month'}</span></div>
      <div className="tiles">
        <StatTile label="People reached" value={n(s.plain.reached)} cur={s.plain.reached} prev={prev?.summary.plain.reached} prevLabel={prev?.label} spark={spark('reached')} onClick={() => open({ kind: 'm', id: `reached|${month.id}` })}
          info="Added up across posts, organic only: someone who saw two posts counts twice."
          note={[fewer, s.boostReach > 0 ? `+${n(s.boostReach)} more through boosts` : ''].filter(Boolean).join(' · ') || undefined} />
        <StatTile label="Reactions & comments" value={n(s.plain.reactions)} cur={s.plain.reactions} prev={prev?.summary.plain.reactions} prevLabel={prev?.label} spark={spark('reactions')} onClick={() => open({ kind: 'm', id: `reactions|${month.id}` })}
          note={fewer || undefined} />
        <StatTile label="Shares & saves" value={n(s.plain.passedOn)} cur={s.plain.passedOn} prev={prev?.summary.plain.passedOn} prevLabel={prev?.label} spark={spark('passedOn')} onClick={() => open({ kind: 'm', id: `passedOn|${month.id}` })}
          info="Parents sending a post on or keeping it — the strongest sign it mattered." />
        <StatTile label="New followers from posts" value={n(s.plain.follows)} cur={s.plain.follows} prev={prev?.summary.plain.follows} prevLabel={prev?.label} spark={spark('follows')} onClick={() => open({ kind: 'm', id: `follows|${month.id}` })}
          info="Follows that came from these posts. The Accounts page counts all new Instagram and Facebook follows, including those from ads." />
      </div>
      </section>

      {best.length > 0 && (
        <section className="section">
          <div className="s-head"><h2 className="s-title">What worked</h2><span className="s-note">Compared with a typical post of the same format, {RANGE}</span></div>
          <div className="stack">{best.map((c) => <Feature key={c.id} c={c} open={open} />)}</div>
        </section>
      )}

      <section className="section">
        <div className="s-head"><h2 className="s-title">This month's posts</h2></div>
        <div className="panel">
          <p className="p-sub" style={{ margin: 0 }}>
            <strong>{plural(s.posts, 'post')}</strong> went out on Instagram and Facebook in {month.label}
            {added > 0 ? <>, including {plural(added, 'campus moment')} added during the month</> : null}. All posts are published by Zamstars; reels are shot and edited by the Tatva team.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="s-head"><h2 className="s-title">Paid</h2><span className="s-note">Kept apart from the organic numbers above</span></div>
        <PaidBlock month={month} />
      </section>

      {month.leads?.web && (
        <section className="section">
          <div className="s-head"><h2 className="s-title">Website visits</h2><span className="s-note">Google Analytics · 1–31 {month.label.slice(0, 3)}</span></div>
          <WebBlock month={month} />
        </section>
      )}

      <section className="section">
        <div className="s-head">
          <h2 className="s-title">Every post</h2>
          <div className="seg" role="tablist">
            {FILTERS.filter((f) => f.key === 'all' || own.some((c) => c.verdict?.key === f.key)).map((f) => (
              <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
                {f.label} <em>{f.key === 'all' ? own.length : own.filter((c) => c.verdict?.key === f.key).length}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="grid g4">{list.map((c) => <PostCard key={c.id} c={c} open={open} why={false} />)}</div>
      </section>

      {(month.leads?.context?.length ?? 0) > 0 && (
        <section className="section">
          <div className="s-head"><h2 className="s-title">What else happened</h2><span className="s-note">Events and changes that explain the numbers</span></div>
          <MonthContext month={month} />
        </section>
      )}

      {(collabs.length > 0 || s.stories.count > 0) && (
        <section className="section">
          <div className="s-head"><h2 className="s-title">Also this month</h2></div>
          <div className="stack" style={{ gap: 8 }}>
            {Object.entries(s.collab.partners).map(([k, v]) => (
              <p key={k} className="muted">{plural(v.count, 'collab post')} with <strong style={{ color: 'var(--ink)' }}>{k}</strong>, seen {n(v.views)} times on their page.</p>
            ))}
            {s.stories.count > 0 && <p className="muted">{plural(s.stories.count, 'story', 'stories')}, viewed {n(s.stories.views)} times.</p>}
          </div>
        </section>
      )}
    </>
  )
}
