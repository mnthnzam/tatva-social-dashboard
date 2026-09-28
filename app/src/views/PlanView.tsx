import { useState } from 'react'
import type { Content, Month, PlanItem } from '../types'
import type { Selection } from '../components/Drawer'
import type { Route } from '../App'
import { contentById, monthContent, monthPlan, MARKERS } from '../lib/data'
import { day, n, parseDate } from '../lib/format'
import { Creative } from '../components/Creative'
import { BoostChip, MarkerChip, StatusChip } from '../components/Badges'
import { Icon } from '../components/Icon'
import { STATUS_ST, stageOf } from './common'

type P = { month: Month; open: (s: Selection) => void; go: (r: Partial<Route>) => void }
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
type Entry = { kind: 'plan'; p: PlanItem } | { kind: 'moved'; p: PlanItem; c: Content } | { kind: 'live'; c: Content }

export function PlanView({ month, open }: P) {
  const [mode, setMode] = useState<'calendar' | 'list'>(() => (window.innerWidth < 760 ? 'list' : 'calendar'))
  const [showCollab, setShowCollab] = useState(false)
  const pl = monthPlan(month.id)
  const cs = monthContent(month.id).filter((c) => c.marker !== 'planned' && (showCollab || c.marker !== 'collab'))
  const y = month.year, m = Number(month.id.slice(5)) - 1
  const days = new Date(y, m + 1, 0).getDate()
  const lead = (new Date(y, m, 1).getDay() + 6) % 7
  const byDay = new Map<number, Entry[]>()
  const push = (d: number, e: Entry) => byDay.set(d, [...(byDay.get(d) ?? []), e])
  for (const p of pl) {
    if (!p.date) continue
    push(parseDate(p.date).getDate(), { kind: 'plan', p })
    const c = p.contentId ? contentById.get(p.contentId) : undefined
    if (c && p.lag && c.month === month.id) push(parseDate(c.date).getDate(), { kind: 'moved', p, c })
  }
  for (const c of cs) push(parseDate(c.date).getDate(), { kind: 'live', c })
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  const chip = (e: Entry, k: number) => {
    if (e.kind === 'plan') {
      const p = e.p
      const st = month.kind === 'plan' ? stageOf(p).st : STATUS_ST[p.status]
      const live = p.contentId ? contentById.get(p.contentId) : undefined
      const sub = month.kind === 'plan' ? stageOf(p).label : p.status === 'Late' || p.status === 'Early' ? `${p.status} → ${day(live!.date)}` : p.status
      return (
        <button key={k} className={`cchip ${st}`} onClick={() => open({ kind: 'p', id: p.id })} title={`${p.title} · ${sub}`}>
          <span className="cchip-t">{p.title}</span>
          <span className="cchip-s">{p.format} · {sub}{p.boostPlanned ? ' · 💵' : ''}{p.platforms.includes('LinkedIn') ? ' · LinkedIn' : ''}</span>
        </button>
      )
    }
    if (e.kind === 'moved') {
      return (
        <button key={k} className="cchip ghost" onClick={() => open({ kind: 'c', id: e.c.id })}>
          <span className="cchip-t">{e.p.title}</span>
          <span className="cchip-s">went live · planned {day(e.p.date)}</span>
        </button>
      )
    }
    const c = e.c
    return (
      <button key={k} className={`cchip ${c.marker === 'lastminute' ? 'st-lm' : 'st-out'}`} onClick={() => open({ kind: 'c', id: c.id })} title={MARKERS[c.marker].hint}>
        <span className="cchip-t">{c.title}</span>
        <span className="cchip-s">{MARKERS[c.marker].short}{c.partner ? ` · ${c.partner}` : ''}</span>
      </button>
    )
  }

  const rows = [...pl].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
  const extra = [...cs].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="vstack">
      <div className="filters">
        <div className="seg">
          <button className={mode === 'calendar' ? 'on' : ''} onClick={() => setMode('calendar')}><Icon name="plan" size={14} /> Calendar</button>
          <button className={mode === 'list' ? 'on' : ''} onClick={() => setMode('list')}><Icon name="list" size={14} /> List</button>
        </div>
        {month.kind === 'report' && <label className="check"><input type="checkbox" checked={showCollab} onChange={(e) => setShowCollab(e.target.checked)} /> Collab posts</label>}
        <div className="legend">
          {month.kind === 'report'
            ? (['On date', 'Late', 'Early', 'Not posted', 'Replaced', 'Upcoming'] as const).map((s) => <span key={s} className={`lg ${STATUS_ST[s]}`}>{s}</span>).concat([<span key="lm" className="lg st-lm">Last-minute</span>, <span key="o" className="lg st-out">Outside plan</span>])
            : [<span key="a" className="lg st-ok">Design ready</span>, <span key="b" className="lg st-late">Script ready</span>, <span key="c" className="lg st-miss">Needs footage</span>]}
        </div>
      </div>
      {mode === 'calendar' ? (
        <>
          <div className="cal">
            {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((d, i) => (
              <div key={i} className={`cal-cell${d ? '' : ' off'}`}>
                {d && <span className="cal-d">{d}</span>}
                {d && (byDay.get(d) ?? []).map(chip)}
              </div>
            ))}
          </div>
          {pl.some((p) => !p.date) && (
            <section className="panel"><div className="panel-head"><h3>Date to be fixed</h3></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{pl.filter((p) => !p.date).map((p, k) => chip({ kind: 'plan', p }, k))}</div>
            </section>
          )}
        </>
      ) : (
        <div className="panel flush">
          <table className="plist">
            <thead><tr><th>Planned</th><th /><th>Post</th><th>Made by</th><th>{month.kind === 'plan' ? 'Stage' : 'Status'}</th><th className="r">{month.kind === 'report' ? 'Organic views' : ''}</th></tr></thead>
            <tbody>
              {rows.map((p) => {
                const c = p.contentId ? contentById.get(p.contentId) : undefined
                return (
                  <tr key={p.id} onClick={() => open({ kind: 'p', id: p.id })}>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>{day(p.date)}</td>
                    <td className="thumbcell"><Creative img={c?.image ?? p.creative} format={p.format} placeholder="" /></td>
                    <td><strong>{p.title}</strong><span className="sub">{p.bucket} · {p.format}{p.platforms.includes('LinkedIn') ? ' · LinkedIn + Meta' : ''}</span></td>
                    <td>{p.owner}<span className="sub">{p.dependency ?? (p.designer ? `Designer: ${p.designer}` : '')}</span></td>
                    <td>
                      {month.kind === 'plan' ? <span className={`chip ${stageOf(p).cls}`}>{stageOf(p).label}</span> : <StatusChip status={p.status} lag={p.lag} />}
                      {p.boostPlanned && <BoostChip planned actual={c?.boosted} />}
                      {c && p.lag ? <span className="sub">live {day(c.date)}</span> : null}
                    </td>
                    <td className="r">{c ? n(c.metrics.views_org) : ''}</td>
                  </tr>
                )
              })}
              {extra.length > 0 && <tr className="divider"><td colSpan={6}>Went live without a calendar slot</td></tr>}
              {extra.map((c) => (
                <tr key={c.id} onClick={() => open({ kind: 'c', id: c.id })}>
                  <td className="num muted">{day(c.date)}</td>
                  <td className="thumbcell"><Creative img={c.image} format={c.format} placeholder="" /></td>
                  <td><strong>{c.title}</strong><span className="sub">{c.format} · {c.platforms}</span></td>
                  <td>{c.owner ?? c.partner ?? '—'}</td>
                  <td><MarkerChip marker={c.marker} partner={c.partner} />{c.boosted && <BoostChip actual />}</td>
                  <td className="r">{n(c.marker === 'collab' ? c.metrics.views : c.metrics.views_org)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
