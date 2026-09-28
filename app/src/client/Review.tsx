import { useMemo, useState } from 'react'
import type { PlanItem, PlanMonth } from '../types'
import type { Selection } from '../components/Drawer'
import { monthPlan } from '../lib/data'
import { dayLong, parseDate, plural } from '../lib/format'
import { feedbackText, monthReviewSummary, postState, useReviewerName, useReviews, type PostState } from '../lib/review'
import { Creative } from '../components/Creative'
import { Icon } from '../components/Icon'

type Filter = 'needs' | 'changes' | 'approved' | 'all'

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

export function Review({ month, open }: { month: PlanMonth; open: (s: Selection) => void }) {
  const pl = monthPlan(month.id)
  const { reviews, decide, undo, reset } = useReviews()
  const [name, setName] = useReviewerName()
  const [filter, setFilter] = useState<Filter>('needs')
  const [exporting, setExporting] = useState(false)
  const sum = monthReviewSummary(pl, reviews)
  const match = (st: PostState) =>
    filter === 'all' ? true : filter === 'needs' ? st === 'waiting' : filter === 'changes' ? st === 'changes' : st === 'approved' || st === 'partial'
  const list = pl.filter((p) => match(postState(p, reviews).state))
  const weeks = useMemo(() => {
    const m = new Map<string, PlanItem[]>()
    for (const p of list) m.set(weekLabel(p.date), [...(m.get(weekLabel(p.date)) ?? []), p])
    return [...m.entries()]
  }, [list])
  const total = pl.length
  const seg = (k: PostState, color: string) => sum[k] > 0 && <span style={{ flex: sum[k], background: color }} />

  return (
    <>
      <header className="p-head">
        <span className="eyebrow">{month.label} {month.year} · Content review</span>
        <h1 className="p-title">Review {month.label}’s posts</h1>
        <p className="p-sub">Approve each post or ask for a change. Static posts come with their final design; reels come as a script first and the final cut later.</p>
      </header>

      <div className="rv-progress">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 240 }}>
          <div className="rv-progress-bar">
            {seg('approved', 'var(--good)')}{seg('partial', 'color-mix(in srgb, var(--good) 45%, var(--mute-mark))')}{seg('changes', 'var(--bad)')}{seg('waiting', 'var(--accent)')}{seg('notready', 'var(--mute-mark)')}
          </div>
          <div className="rv-legend">
            <span><i style={{ background: 'var(--accent)' }} />{sum.waiting} waiting for you</span>
            <span><i style={{ background: 'var(--good)' }} />{sum.approved + sum.partial} approved{sum.partial ? ` (${sum.partial} with the cut to come)` : ''}</span>
            <span><i style={{ background: 'var(--bad)' }} />{sum.changes} changes asked</span>
            {sum.notready > 0 && <span><i style={{ background: 'var(--mute-mark)' }} />{sum.notready} not ready yet</span>}
          </div>
        </div>
        <label className="name-field">Reviewing as <input value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} /></label>
        <button className="btn btn-primary" onClick={() => setExporting(true)} disabled={sum.approved + sum.partial + sum.changes === 0}>Send feedback</button>
      </div>

      <div className="rv-toolbar">
        <div className="seg" role="tablist">
          {([['needs', 'Needs you', sum.waiting], ['changes', 'Changes asked', sum.changes], ['approved', 'Approved', sum.approved + sum.partial], ['all', 'All', total]] as const).map(([k, l, c]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l} <em>{c}</em></button>
          ))}
        </div>
      </div>

      {list.length === 0 && (
        <div className="rv-empty">
          {filter === 'needs' ? <>Nothing waiting for you right now. {sum.notready > 0 && `${plural(sum.notready, 'post')} will come back once the footage is in.`}</> : 'Nothing here yet.'}
        </div>
      )}
      {weeks.map(([w, items]) => (
        <div key={w} className="week">
          <div className="week-h">{w}</div>
          {items.map((p) => <ReviewCard key={p.id} p={p} name={name} decide={decide} undo={undo} reviews={reviews} open={open} />)}
        </div>
      ))}

      <p className="fine" style={{ marginTop: 32 }}>
        Preview build: decisions are saved in this browser only. <button className="link" style={{ fontSize: 12.5 }} onClick={() => { if (window.confirm('Clear all review decisions saved in this browser?')) reset() }}>Clear all</button>
      </p>

      {exporting && (
        <div className="modal-wrap" onClick={() => setExporting(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Send your feedback to Zamstars</h3>
            <p className="muted">Copy this and paste it into WhatsApp or email. In the hosted version this goes to the team automatically.</p>
            <pre>{feedbackText(month.label, pl, reviews, name)}</pre>
            <div className="modal-actions">
              <button className="btn btn-quiet" onClick={() => setExporting(false)}>Close</button>
              <button className="btn btn-primary" onClick={async () => {
                try { await navigator.clipboard.writeText(feedbackText(month.label, pl, reviews, name)) } catch { /* ignore */ }
              }}><Icon name="copy" size={16} /> Copy</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ReviewCard({ p, name, decide, undo, reviews, open }: {
  p: PlanItem; name: string
  decide: ReturnType<typeof useReviews>['decide']; undo: ReturnType<typeof useReviews>['undo']
  reviews: ReturnType<typeof useReviews>['reviews']; open: (s: Selection) => void
}) {
  const { stages, actionable, state } = postState(p, reviews)
  const [asking, setAsking] = useState(false)
  const [text, setText] = useState('')
  const [expand, setExpand] = useState(false)
  const reel = p.format === 'Reel'
  const SHORT: Record<string, string> = { idea: 'idea', design: 'design', cut: 'final cut' }
  const labels = actionable.map((s) => (s.key === 'idea' && reel ? 'script' : SHORT[s.key] ?? s.label.toLowerCase())).join(' & ')
  const decided = stages.filter((s) => s.review)
  const lastChange = stages.find((s) => s.review?.decision === 'changes')?.review
  return (
    <article className={`rv-card${state === 'waiting' ? ' needs' : ''}`}>
      <Creative img={p.creative} format={p.format} label={p.title} onClick={() => open({ kind: 'p', id: p.id })}
        placeholder={reel ? (p.footageDue ? `Script stage · footage due ${new Date(p.footageDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Script stage') : 'Design in progress'} />
      <div className="rv-body">
        <div className="rv-top">
          <div>
            <span className="rv-date">{dayLong(p.date)}</span>
            <h3 className="rv-title">{p.title}</h3>
            <div className="rv-meta">{p.bucket} · {p.format} · {p.platforms}{p.boostPlanned && <span className="chip chip-outline">💵 Boost planned</span>}</div>
          </div>
        </div>

        <div className="stages">
          {stages.map((s, i) => {
            const cls = s.review?.decision === 'approved' ? 'ok' : s.review?.decision === 'changes' ? 'chg' : s.available ? 'now' : ''
            const txt = s.review?.decision === 'approved' ? 'Approved' : s.review?.decision === 'changes' ? 'Changes asked' : s.available ? 'Ready for you' : s.waiting ?? 'Not ready'
            return (
              <div key={s.key} className={`stage ${cls}`}>
                <span className="stage-dot">{s.review?.decision === 'approved' ? <Icon name="check" size={12} /> : s.review?.decision === 'changes' ? '!' : i + 1}</span>
                <b>{s.label}</b><span>{txt}</span>
              </div>
            )
          })}
        </div>

        <div className="rv-copy">
          {!reel && p.copy && <div className="rv-block"><h5>On the post</h5><p className={expand ? '' : 'clamp'}>{p.copy}</p></div>}
          {p.concept && <div className="rv-block"><h5>The idea</h5><p className={expand ? '' : 'clamp'}>{p.concept}</p></div>}
          {reel && p.copy && <div className="rv-block"><h5>Script</h5><p className={expand ? '' : 'clamp'}>{p.copy}</p></div>}
          {p.caption && expand && <div className="rv-block"><h5>Caption</h5><p>{p.caption}</p></div>}
          {(p.concept || p.copy || p.caption) && <button className="more" onClick={() => setExpand(!expand)}>{expand ? 'Show less' : p.caption ? 'Read everything, including the caption' : 'Read more'}</button>}
          {!p.concept && !p.copy && <p className="muted">Topic and date still to be fixed with the Tatva team.</p>}
        </div>

        {lastChange && !asking && <div className="rv-note chg"><b>{lastChange.by || 'You'} asked:</b> {lastChange.comment || 'Changes requested'}</div>}

        <div className="rv-actions">
          {actionable.length > 0 && !asking && (
            <>
              <button className="btn btn-good" onClick={() => decide(p, actionable.map((s) => s.key), 'approved', '', name)}><Icon name="check" size={16} /> Approve {labels}</button>
              <button className="btn btn-line" onClick={() => setAsking(true)}><Icon name="edit" size={15} /> Ask for changes</button>
            </>
          )}
          {asking && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <textarea className="rv-comment" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="What should change? e.g. use a different photo, soften the headline…" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" disabled={!text.trim()} onClick={() => { decide(p, (actionable.length ? actionable : stages.filter((s) => s.available)).map((s) => s.key), 'changes', text.trim(), name); setAsking(false); setText('') }}>Send request</button>
                <button className="btn btn-quiet" onClick={() => { setAsking(false); setText('') }}>Cancel</button>
              </div>
            </div>
          )}
          {actionable.length === 0 && !asking && decided.length > 0 && (
            <>
              <span className="muted" style={{ fontSize: 13.5 }}>
                {state === 'partial' ? `${stages.find((s) => !s.review)?.label} comes to you when it’s ready.` : state === 'approved' ? 'All done for this post.' : ''}
              </span>
              <button className="btn btn-quiet btn-sm" onClick={() => undo(p, decided.map((s) => s.key))}>Undo</button>
            </>
          )}
          {actionable.length === 0 && decided.length === 0 && <span className="muted" style={{ fontSize: 13.5 }}>Nothing to review yet.</span>}
          {decided[0]?.review && <span className="who">{decided[0].review.by ? `${decided[0].review.by} · ` : ''}{new Date(decided[0].review.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
        </div>
      </div>
    </article>
  )
}
