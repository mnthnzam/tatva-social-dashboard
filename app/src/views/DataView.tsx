import { Fragment } from 'react'
import type { Selection } from '../components/Drawer'
import { DATA, MARKERS } from '../lib/data'
import { day, n } from '../lib/format'
import { Creative } from '../components/Creative'
import { MarkerChip } from '../components/Badges'

export function DataView({ open }: { open: (s: Selection) => void }) {
  const unconfirmed = DATA.content.filter((c) => c.marker === 'unconfirmed')
  const likely = DATA.plan.filter((p) => p.confidence === 'likely')
  const inferred = DATA.plan.filter((p) => p.ownerInferred)
  const noImg = DATA.content.filter((c) => !c.image)
  return (
    <div className="vstack" style={{ gap: 24 }}>
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
            <dt>Against format</dt><dd>Organic views ÷ the Jul–Sep median for that format ({Object.entries(DATA.baselines).map(([k, v]) => `${k} ${n(v.median)}`).join(', ')}).</dd>
            <dt>Verdict</dt><dd>Reach and engagement (reactions, comments, shares, saves) against the Jul–Sep median for the format, combined as a geometric mean. Standout ≥ 1.5×, Steady 0.75–1.5×, Quiet &lt; 0.75×. Boosted posts are judged separately.</dd>
            <dt>Late / Early</dt><dd>Went live on a different day from the calendar date (days shown).</dd>
            {Object.values(MARKERS).map((m) => (<Fragment key={m.label}><dt>{m.label}</dt><dd>{m.hint}</dd></Fragment>))}
          </dl>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Monthly update</h3></div>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, color: "var(--ink-2)", fontSize: 14 }}>
            <li>Export per-post insights from Meta Business Suite (last 90 days) and grab post previews.</li>
            <li>Export the content calendar sheet; add the new month’s creatives from Canva.</li>
            <li>Run <code>npm run data</code> — it matches plan rows to posts and flags anything it can’t match.</li>
            <li>Resolve flags in <code>reconcile.json</code> (matches, tags, titles) and rerun.</li>
            <li>Review here, then publish.</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
