import { noPreview } from '../lib/data'
import { useEffect, useState } from 'react'
import type { Content, PlanItem } from '../types'
import { contentById, planById, DATA, MARKERS } from '../lib/data'
import { dayLong, full, n, secs, time } from '../lib/format'
import { Creative } from './Creative'
import { BoostChip, MarkerChip, StatusChip, VerdictChip } from './Badges'
import { Split } from './Charts'
import { BigNumbers, shown } from './PostNumbers'
import { MetricSheet } from './MetricSheet'
import { CompareRows } from './Charts'
import { Icon } from './Icon'

export type Selection = { kind: 'c' | 'p' | 'm'; id: string } | null
export type Mode = 'client' | 'team'

export function Drawer({ sel, onClose, onOpen, mode }: { sel: Selection; onClose: () => void; onOpen: (s: Selection) => void; mode: Mode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  if (!sel) return null
  if (sel.kind === 'm') {
    return (
      <div className="sheet-wrap" onClick={onClose}>
        <aside className="sheet" style={{ width: 'min(820px, 100vw)' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <button className="sheet-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          <MetricSheet id={sel.id} onOpen={onOpen} />
        </aside>
      </div>
    )
  }
  const c = sel.kind === 'c' ? contentById.get(sel.id) : undefined
  const p = sel.kind === 'p' ? planById.get(sel.id) : c?.planId ? planById.get(c.planId) : undefined
  const live = c ?? (p?.contentId ? contentById.get(p.contentId) : undefined)
  if (!live && !p) return null
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <aside className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={(live ?? p)!.title}>
        <button className="sheet-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        {live ? <ContentSheet c={live} p={p} mode={mode} onOpen={onOpen} /> : <PlanSheet p={p!} mode={mode} onOpen={onOpen} />}
      </aside>
    </div>
  )
}

function ContentSheet({ c, p, mode, onOpen }: { c: Content; p?: PlanItem; mode: Mode; onOpen: (s: Selection) => void }) {
  const [tab, setTab] = useState<'numbers' | 'plan' | 'caption'>('numbers')
  const [more, setMore] = useState(false)
  const ratio = c.image ? `${c.image.w} / ${c.image.h}` : '4 / 5'
  const m = c.metrics
  return (
    <div className="sheet-body">
      <div className="sheet-media">
        <Creative img={c.image} format={c.format} ratio={ratio} label={c.title} placeholder={noPreview(c)} />
        {c.format === 'Reel' && c.image && <p className="fine">Reel preview shows the opening frame.</p>}
      </div>
      <div className="sheet-info">
        <header className="sheet-h">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <VerdictChip c={c} />
            {mode === 'team' && <MarkerChip marker={c.marker} partner={c.partner} />}
            {mode === 'team' && p && p.status !== 'On date' && <StatusChip status={p.status} lag={p.lag} />}
          </div>
          <h2>{c.title}</h2>
          <p className="sheet-meta">{dayLong(c.date)} · {time(c.date)} · {c.platforms === 'IG+FB' ? 'Instagram & Facebook' : c.platforms === 'IG' ? 'Instagram' : 'Facebook'} · {c.format}</p>
        </header>

        <div className="verdict-box"><p>{c.why}</p></div>
        <BigNumbers c={c} />
        {c.marker !== 'collab' && <PostCompare c={c} mode={mode} />}


        {mode === 'client' ? (
          <div>
            <button className="link" onClick={() => setMore(!more)}>{more ? 'Hide details' : 'Details'} <Icon name={more ? 'up' : 'down'} size={14} /></button>
            {more && (
              <div className="tab-body" style={{ marginTop: 12 }}>
                {p && <p className="fine">Planned for {dayLong(p.date)}{p.lag ? ` · went live ${p.lag > 0 ? `${p.lag} days later` : `${-p.lag} days earlier`}` : ''}.</p>}
                <p className="caption">{c.caption}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist">
              <button className={tab === 'numbers' ? 'on' : ''} onClick={() => setTab('numbers')}>All numbers</button>
              <button className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>Plan & tags</button>
              <button className={tab === 'caption' ? 'on' : ''} onClick={() => setTab('caption')}>Caption</button>
            </div>
            {tab === 'numbers' && (
              <div className="tab-body">
                {m.views_ads > 0 && (
                  <div>
                    <Split org={m.views_org} ads={m.views_ads} height={10} />
                    <div className="legend" style={{ marginTop: 8 }}><span><i style={{ background: 'var(--org)' }} />Organic views {n(m.views_org)}</span><span><i style={{ background: 'var(--paid)' }} />Paid views {n(m.views_ads)}</span></div>
                  </div>
                )}
                <table className="mini">
                  <thead><tr><th /><th>Organic</th><th>From ads</th><th>Total</th></tr></thead>
                  <tbody>
                    {([['Views', 'views'], ['Reach', 'reach'], ['Interactions', 'inter'], ['Likes', 'likes'], ['Comments', 'comments'], ['Shares', 'shares'], ['Saves', 'saves'], ['Link clicks', 'clicks']] as const).map(([l, k]) => (
                      <tr key={k}><td>{l}</td><td>{full(m[`${k}_org`])}</td><td>{m[`${k}_ads`] ? full(m[`${k}_ads`]) : '—'}</td><td>{full(m[k])}</td></tr>
                    ))}
                    <tr><td>Follows</td><td colSpan={3}>{full(m.follows)}</td></tr>
                    {c.format === 'Reel' && <tr><td>Avg. play time</td><td colSpan={3}>{secs(m.avgPlay)}</td></tr>}
                  </tbody>
                </table>
                {Object.keys(c.perPlatform).length > 1 && (
                  <table className="mini">
                    <thead><tr><th>By platform</th><th>Views</th><th>Reach</th><th>Interactions</th></tr></thead>
                    <tbody>{Object.entries(c.perPlatform).map(([k, v]) => <tr key={k}><td>{k === 'IG' ? 'Instagram' : k === 'FB' ? 'Facebook' : k}</td><td>{full(v.views)}</td><td>{full(v.reach)}</td><td>{full(v.inter)}</td></tr>)}</tbody>
                  </table>
                )}
                {c.index !== null && <p className="fine">Organic views {c.index.toFixed(1)}× the typical {c.format.toLowerCase()} ({n(DATA.baselines[c.format]?.median)}).</p>}
              </div>
            )}
            {tab === 'plan' && (
              <div className="tab-body">
                <dl className="kv">
                  <dt>Tag</dt><dd>{MARKERS[c.marker].label}</dd>
                  {p ? (
                    <>
                      <dt>Planned for</dt><dd>{dayLong(p.date)}{p.lag ? ` · live ${p.lag > 0 ? `${p.lag}d late` : `${-p.lag}d early`}` : ''}</dd>
                      <dt>Bucket</dt><dd>{p.bucket}</dd>
                      <dt>Made by</dt><dd>{p.owner}{p.ownerInferred ? ' (inferred)' : ''}{p.dependency ? ` · ${p.dependency}` : ''}</dd>
                      {p.designer && (<><dt>Designer</dt><dd>{p.designer}</dd></>)}
                      <dt>Boost</dt><dd>{p.boostPlanned ? '💵 planned' : 'not planned'}{c.boosted ? ' · ran' : ''}</dd>
                      {p.confidence === 'likely' && (<><dt>Match</dt><dd>Likely — confirm</dd></>)}
                    </>
                  ) : (
                    <><dt>Why</dt><dd>{MARKERS[c.marker].hint}</dd></>
                  )}
                  {c.evidence && (<><dt>Evidence</dt><dd>{c.evidence}</dd></>)}
                </dl>
                {c.replacesPlanId && (
                  <button className="link" onClick={() => onOpen({ kind: 'p', id: c.replacesPlanId! })}>Took the slot of “{planById.get(c.replacesPlanId)?.title}” <Icon name="arrow" size={14} /></button>
                )}
                {(p?.note || c.note) && <p className="fine">{p?.note ?? c.note}</p>}
                {p?.concept && <><h4 className="fine">Concept</h4><p className="pre">{p.concept}</p></>}
              </div>
            )}
            {tab === 'caption' && <p className="caption">{c.caption}</p>}
          </>
        )}
      </div>
    </div>
  )
}

function PlanSheet({ p, mode, onOpen }: { p: PlanItem; mode: Mode; onOpen: (s: Selection) => void }) {
  const rep = p.replacedBy ? contentById.get(p.replacedBy) : undefined
  const ratio = p.creative ? `${p.creative.w} / ${p.creative.h}` : '4 / 3'
  const why = p.status === 'Not posted'
    ? p.dependency === 'Footage from Tatva' ? 'Didn’t go out: it was waiting on footage from the Tatva team.' : 'Didn’t go out this month.'
    : p.status === 'Replaced' ? 'Its slot went to a more timely post.' : p.status === 'Upcoming' ? 'Scheduled after the data was pulled.' : null
  return (
    <div className="sheet-body">
      <div className="sheet-media">
        <Creative img={p.creative} format={p.format} ratio={ratio} label={p.title}
          placeholder={p.format === 'Reel' ? (p.needsFootage ? 'Reel — waiting for footage' : 'Reel — not produced') : 'Design in progress'} />
      </div>
      <div className="sheet-info">
        <header className="sheet-h">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.status !== 'Planned' && <StatusChip status={p.status} lag={p.lag} />}
            <BoostChip planned={p.boostPlanned} />
          </div>
          <h2>{p.title}</h2>
          <p className="sheet-meta">{dayLong(p.date)} · {p.platforms} · {p.format} · {p.bucket}</p>
        </header>
        {why && <div className="verdict-box"><p>{why}</p></div>}
        {rep && <button className="link" onClick={() => onOpen({ kind: 'c', id: rep.id })}>See “{rep.title}” <Icon name="arrow" size={14} /></button>}
        {p.needsFootage && <div className="callout warn"><Icon name="camera" size={16} /><span>Needs footage from Tatva{p.footageDue ? ` by ${dayLong(p.footageDue)}` : p.dueText ? ` · ${p.dueText}` : ''}.{p.need ? ` ${p.need}` : ''}</span></div>}
        {p.concept && <div><h4 className="fine" style={{ marginBottom: 4 }}>The idea</h4><p className="pre">{p.concept}</p></div>}
        {p.copy && <div><h4 className="fine" style={{ marginBottom: 4 }}>{p.format === 'Reel' ? 'Script' : 'On the post'}</h4><p className="pre">{p.copy}</p></div>}
        {p.caption && <div><h4 className="fine" style={{ marginBottom: 4 }}>Caption</h4><p className="pre">{p.caption}</p></div>}
        {mode === 'team' && (
          <dl className="kv">
            <dt>Made by</dt><dd>{p.owner}{p.dependency ? ` · ${p.dependency}` : ''}</dd>
            {p.designer && (<><dt>Designer</dt><dd>{p.designer}</dd></>)}
            {p.sheetStatus && (<><dt>Sheet status</dt><dd>{p.sheetStatus}</dd></>)}
            {p.note && (<><dt>Note</dt><dd>{p.note}</dd></>)}
          </dl>
        )}
      </div>
    </div>
  )
}

/** Compare this post with the typical post of its format, the month's average, or any other post. */
function PostCompare({ c, mode }: { c: Content; mode: Mode }) {
  const [with_, setWith] = useState('month')
  const own = DATA.content.filter((x) => x.marker !== 'collab' && x.id !== c.id)
  const sameMonth = own.filter((x) => x.month === c.month && !x.boosted)
  const avg = (k: 'reached' | 'reactions' | 'passedOn' | 'follows') => (sameMonth.length ? sameMonth.reduce((a, x) => a + x.plain[k], 0) / sameMonth.length : 0)
  const typ = DATA.typical[c.format]
  const other = own.find((x) => x.id === with_)
  const a = shown(c)
  const b = with_ === 'typical' ? { reached: typ?.reached ?? 0, reactions: typ?.reactions ?? 0, passedOn: typ?.passedOn ?? 0, follows: typ?.follows ?? 0 }
    : with_ === 'month' ? { reached: avg('reached'), reactions: avg('reactions'), passedOn: avg('passedOn'), follows: avg('follows') }
    : other ? shown(other) : null
  const bLabel = with_ === 'typical' ? `Typical ${c.format.toLowerCase()}` : with_ === 'month' ? 'Average post this month' : other?.title ?? ''
  const rows = b ? [
    { key: 'r', label: 'People reached', a: a.reached, b: b.reached },
    { key: 'e', label: 'Reactions & comments', a: a.reactions, b: b.reactions },
    { key: 'p', label: 'Shares & saves', a: a.passedOn, b: b.passedOn },
    { key: 'f', label: 'New followers', a: a.follows, b: b.follows },
    ...(mode === 'team' && other ? [{ key: 'v', label: 'Organic views', a: c.metrics.views_org, b: other.metrics.views_org }] : []),
  ] : []
  const byMonth = [...own].sort((x, y) => y.date.localeCompare(x.date))
  return (
    <section className="vstack" style={{ gap: 10 }}>
      <div className="s-head" style={{ marginBottom: 0 }}>
        <h3 className="s-title" style={{ fontSize: 16 }}>Compare</h3>
        <select className="sel" value={with_} onChange={(e) => setWith(e.target.value)} aria-label="Compare with">
          <option value="typical">Typical {c.format.toLowerCase()} (Jul–Sep)</option>
          <option value="month">Average post this month</option>
          <optgroup label="Another post">
            {byMonth.map((x) => <option key={x.id} value={x.id}>{x.date.slice(8, 10)}/{x.date.slice(5, 7)} · {x.title.slice(0, 48)}</option>)}
          </optgroup>
        </select>
      </div>
      {b && <CompareRows aLabel="This post" bLabel={bLabel} rows={rows} />}
    </section>
  )
}
