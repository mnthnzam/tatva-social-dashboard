import { RANGE } from '../lib/data'
import { Fragment } from 'react'
import type { Selection } from '../components/Drawer'
import { DATA, MARKERS, reportDue } from '../lib/data'
import { monthShort } from '../lib/format'
import { day, n } from '../lib/format'
import { Creative } from '../components/Creative'
import { MarkerChip } from '../components/Badges'

export function DataView({ open }: { open: (s: Selection) => void }) {
  const unconfirmed = DATA.content.filter((c) => c.marker === 'unconfirmed')
  const likely = DATA.plan.filter((p) => p.confidence === 'likely')
  const inferred = DATA.plan.filter((p) => p.ownerInferred)
  const noImg = DATA.content.filter((c) => !c.image)
  const inputs = DATA.inputs
  const due = inputs ? reportDue(inputs.month) : null
  const dueLabel = due?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const late = due ? due < today : false
  const done = inputs?.items.filter((i) => i.status === 'received').length ?? 0
  const STATUS: Record<string, string> = { waiting: 'chip-warn', received: 'chip-good', partial: 'chip-accent', 'not available': 'chip-bad' }
  return (
    <div className="vstack" style={{ gap: 24 }}>
      {inputs && (
        <section className="panel">
          <div className="panel-head">
            <h3>{monthShort(inputs.month)} report inputs</h3>
            <div className="due">
              <span className={`chip ${late ? 'chip-bad' : 'chip-accent'}`}>Due {dueLabel}{late ? ' · overdue' : ''}</span>
              <span className="muted">{done} of {inputs.items.length} in</span>
            </div>
          </div>
          <ul className="inputs">
            {inputs.items.map((i) => (
              <li key={i.id}>
                <span><span className={`chip ${STATUS[i.status] ?? ''}`}>{i.status === 'waiting' ? 'Waiting' : i.status === 'received' ? 'In' : i.status === 'partial' ? 'Partial' : 'Not available'}</span></span>
                <span>{i.label}<span className="sub">Feeds: {i.feeds}{i.note ? ` · ${i.note}` : ''}</span></span>
                <span className="muted">{i.owner}</span>
              </li>
            ))}
          </ul>
          <p className="fine" style={{ marginTop: 10 }}>Report is due on the 3rd working day of the month. Pull Meta data on or after the 1st so the whole month is in. Update statuses in <code>pipeline/raw/leads.json</code>.</p>
        </section>
      )}
      <section className="panel">
        <div className="panel-head"><h3>Needs a tag</h3><span className="muted">Posts outside the calendar with no Zamstars design found. Who made them?</span></div>
        <table className="plist">
          <tbody>
            {unconfirmed.map((c) => (
              <tr key={c.id} onClick={() => open({ kind: 'c', id: c.id })}>
                <td className="thumbcell"><Creative img={c.image} format={c.format} placeholder="" /></td>
                <td><strong>{c.title}</strong><span className="sub">{day(c.date)} · {c.format} · {c.platforms}{c.note ? ` · ${c.note}` : ''}</span></td>
                <td><MarkerChip marker={c.marker} /></td>
                <td className="r">{n(c.metrics.views_org)} organic views</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fine">Options for each: Tatva team · Zamstars last-minute · Collab. For now, set in <code>pipeline/reconcile.json</code> and rebuild.</p>
      </section>

      <div className="two">
        <section className="panel">
          <div className="panel-head"><h3>Matches to confirm</h3><span className="muted">Matched on theme, not caption</span></div>
          <ul className="rows" style={{ gap: 8, fontSize: 14, color: "var(--ink-2)" }}>
            {likely.map((p) => (
              <li key={p.id}><button className="link" onClick={() => open({ kind: 'p', id: p.id })}>{p.title}</button> — planned {day(p.date)}{p.note ? `. ${p.note}` : ''}</li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Gaps in the inputs</h3></div>
          <ul className="rows" style={{ gap: 8, fontSize: 14, color: "var(--ink-2)" }}>
            <li>{inferred.length} calendar rows (August) have no “Requirement”; owner was inferred from format (reels → Tatva footage).</li>
            <li>{noImg.length} posts have no preview: {noImg.map((c) => c.title).join('; ') || 'none'}.</li>
            <li>Stories only appear from mid-August in Meta’s export; July stories are missing.</li>
            <li>Tatva Kids: the Meta login used here can’t see the TK page.</li>
            <li>Ad spend: no ad-account access, so boosted posts show reach and views from ads but no cost.</li>
          </ul>
        </section>
      </div>

      <div className="two">
        <section className="panel">
          <div className="panel-head"><h3>Where the numbers come from</h3></div>
          <dl className="kv">
            {DATA.sources.map((s) => (<Fragment key={s.name}><dt>{s.name}</dt><dd>{s.detail}</dd></Fragment>))}
            <dt>Meta data to</dt><dd>{day(DATA.dataCutoff)} {DATA.dataCutoff.slice(0, 4)}</dd>
            <dt>Built</dt><dd>{DATA.generatedAt}</dd>
          </dl>
          <h4 className="fine" style={{ margin: "16px 0 8px" }}>Definitions</h4>
          <dl className="kv">
            <dt>Organic views</dt><dd>Views minus the views Meta attributes to ads. IG + FB copies of a post are added together.</dd>
            <dt>Against format</dt><dd>Organic views ÷ the {RANGE} median for that format ({Object.entries(DATA.baselines).map(([k, v]) => `${k} ${n(v.median)}`).join(', ')}).</dd>
            <dt>Verdict</dt><dd>Reach and engagement (reactions, comments, shares, saves) against the {RANGE} median for the format, combined as a geometric mean. Standout ≥ 1.5×, Steady 0.75–1.5×, Quiet &lt; 0.75×. Boosted posts are judged separately.</dd>
            <dt>Rescheduled</dt><dd>Went live on a different day from the calendar date, earlier or later (days shown). Usually because a Tatva post took the slot.</dd>
            {Object.values(MARKERS).map((m) => (<Fragment key={m.label}><dt>{m.label}</dt><dd>{m.hint}</dd></Fragment>))}
          </dl>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Monthly update</h3></div>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, color: "var(--ink-2)", fontSize: 14 }}>
            <li>On or after the 1st: export per-post insights from Meta Business Suite (last 90 days) and grab post previews. Set <code>dataCutoff</code> to the month’s last day.</li>
            <li>Export the content calendar sheet; add the new month’s creatives from Canva.</li>
            <li>Run <code>npm run data</code> — it matches plan rows to posts and flags anything it can’t match.</li>
            <li>Resolve flags in <code>reconcile.json</code> (matches, tags, titles, funnel job, 4C) and rerun.</li>
            <li>Fill <code>raw/leads.json</code>: messages, enquiries, visits, admissions by source; paid campaigns; reasons for big drops; events.</li>
            <li>Review here, then publish by the 3rd working day.</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
