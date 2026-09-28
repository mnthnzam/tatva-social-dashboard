import { useEffect, useRef, useState, type ReactNode } from 'react'
import { n, pct } from '../lib/format'

/* ------------------------------------------------------------------ tooltip plumbing */
type Tip = { x: number; y: number; body: ReactNode } | null

function useTip() {
  const ref = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip>(null)
  const show = (e: { clientX: number; clientY: number } | DOMRect, body: ReactNode) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    const x = 'clientX' in e ? e.clientX : e.left + e.width / 2
    const y = 'clientY' in e ? e.clientY : e.top
    setTip({ x: Math.min(Math.max(x - box.left, 70), box.width - 70), y: y - box.top, body })
  }
  const hide = () => setTip(null)
  const node = tip ? <div className="tip" style={{ left: tip.x, top: tip.y }}>{tip.body}</div> : null
  return { ref, show, hide, node }
}

export function TipBody({ value, label, rows }: { value?: string; label?: string; rows?: { key: string; color: string; value: string }[] }) {
  return (
    <>
      {value && <div className="tip-v">{value}</div>}
      {label && <div className="muted">{label}</div>}
      {rows?.map((r) => (
        <div key={r.key} className="tip-row"><i style={{ background: r.color }} />{r.key}<b>{r.value}</b></div>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ stat tile with sparkline */
export function StatTile({ label, value, cur, prev, prevLabel, spark, note, info, invert, onClick }: {
  onClick?: () => void
  label: string
  value: string
  cur?: number
  prev?: number
  prevLabel?: string
  spark?: { label: string; value: number }[]
  note?: ReactNode
  info?: string
  invert?: boolean
}) {
  const t = useTip()
  let delta: ReactNode = null
  if (cur !== undefined && prev !== undefined && prev > 0) {
    const d = (cur - prev) / prev
    const dir = Math.abs(d) < 0.02 ? 'flat' : (d > 0) !== !!invert ? 'up' : 'down'
    delta = (
      <span className={`tile-d ${dir}`}>
        {d > 0.02 ? '↑' : d < -0.02 ? '↓' : '→'} {pct(Math.abs(d))} <em>vs {prevLabel}</em>
      </span>
    )
  }
  const W = 200, H = 34, P = 5
  const pts = spark ?? []
  const max = Math.max(...pts.map((p) => p.value), 1)
  const lo = Math.min(...pts.map((p) => p.value))
  const min = lo - (max - lo) * 0.25
  const xy = pts.map((p, i) => [P + (i * (W - 2 * P)) / Math.max(pts.length - 1, 1), H - P - ((p.value - min) / (max - min || 1)) * (H - 2 * P)])
  return (
    <div className={`tile chart${onClick ? ' clickable' : ''}`} ref={t.ref} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } }}>
      <span className="tile-l">{label}{info && <span className="info" title={info}>ⓘ</span>}</span>
      <span className="tile-v">{value}</span>
      {delta}
      {note && <span className="tile-note">{note}</span>}
      {pts.length > 1 && (
        <svg className="spark" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label={`${label} by month`}>
          <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--mute-mark)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {xy.map(([x, y], i) => (
            <g key={i} onPointerEnter={(e) => t.show(e, <TipBody value={n(pts[i].value)} label={pts[i].label} />)} onPointerLeave={t.hide}>
              <rect x={x - 20} y={0} width={40} height={H} fill="transparent" />
              <circle cx={x} cy={y} r={i === xy.length - 1 ? 4 : 3} fill={i === xy.length - 1 ? 'var(--accent)' : 'var(--mute-mark)'} stroke="var(--surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      )}
      {onClick && <span className="tile-more">Compare & break down ›</span>}
      {t.node}
    </div>
  )
}

/* ------------------------------------------------------------------ columns (one series, emphasis on one) */
export function Columns({ items, format = n, height = 150, onPick, tipLabel }: {
  items: { key: string; label: string; value: number; emph?: boolean; sub?: string }[]
  format?: (x: number) => string
  height?: number
  onPick?: (key: string) => void
  tipLabel?: (i: { label: string; value: number; sub?: string }) => ReactNode
}) {
  const t = useTip()
  const max = Math.max(...items.map((i) => i.value), 1)
  const W = 100 / items.length
  return (
    <div className="chart" ref={t.ref}>
      <svg width="100%" height={height + 40} role="img" aria-label="Column chart">
        <line className="axis-l" x1="0" x2="100%" y1={height} y2={height} />
        {items.map((i, k) => {
          const h = Math.max(2, (i.value / max) * (height - 26))
          const cx = `${W * k + W / 2}%`
          return (
            <g key={i.key} className="bar-hit" tabIndex={0}
              onPointerMove={(e) => t.show(e, tipLabel ? tipLabel(i) : <TipBody value={format(i.value)} label={i.sub ? `${i.label} · ${i.sub}` : i.label} />)}
              onPointerLeave={t.hide} onFocus={(e) => t.show(e.currentTarget.getBoundingClientRect(), <TipBody value={format(i.value)} label={i.label} />)} onBlur={t.hide}
              onClick={() => onPick?.(i.key)} style={{ cursor: onPick ? 'pointer' : 'default' }}>
              <rect x={`${W * k}%`} y="0" width={`${W}%`} height={height + 40} fill="transparent" />
              <svg x={`${W * k + W / 2}%`} y={height - h} overflow="visible">
                <rect className="bar-m" x={-12} y={0} width={24} height={h} rx={4} fill={i.emph ? 'var(--accent)' : 'var(--mute-mark)'} />
                <rect x={-12} y={Math.max(h - 4, 0)} width={24} height={Math.min(4, h)} fill={i.emph ? 'var(--accent)' : 'var(--mute-mark)'} />
              </svg>
              <text x={cx} y={height - h - 8} textAnchor="middle" className="axis-t" style={{ fill: 'var(--ink)', fontWeight: 600 }}>{format(i.value)}</text>
              <text x={cx} y={height + 18} textAnchor="middle" className="axis-t" style={{ fontWeight: i.emph ? 700 : 400, fill: i.emph ? 'var(--ink)' : undefined }}>{i.label}</text>
              {i.sub && <text x={cx} y={height + 34} textAnchor="middle" className="axis-t" style={{ fontSize: 11 }}>{i.sub}</text>}
            </g>
          )
        })}
      </svg>
      {t.node}
    </div>
  )
}

/* ------------------------------------------------------------------ horizontal rows with optional typical marker */
export function HRows({ items, format = n, baseline, baselineLabel }: {
  items: { key: string; label: string; value: number; tone?: 'good' | 'bad' | 'emph' | 'mute'; tip?: ReactNode; onClick?: () => void }[]
  format?: (x: number) => string
  baseline?: number
  baselineLabel?: string
}) {
  const t = useTip()
  const max = Math.max(...items.map((i) => i.value), baseline ?? 0, 1)
  const color = (tone?: string) => (tone === 'good' ? 'var(--good)' : tone === 'bad' ? 'var(--warn)' : tone === 'emph' ? 'var(--accent)' : 'var(--mute-mark)')
  return (
    <div className="chart" ref={t.ref}>
      {items.map((i) => (
        <button key={i.key} className="hrow" onClick={i.onClick} disabled={!i.onClick}
          onPointerMove={(e) => t.show(e, i.tip ?? <TipBody value={format(i.value)} label={i.label} />)} onPointerLeave={t.hide}>
          <span className="hrow-l">{i.label}</span>
          <span className="hrow-t">
            <span style={{ width: `${(i.value / max) * 100}%`, background: color(i.tone) }} />
            {baseline !== undefined && <i className="hrow-base" style={{ left: `${(baseline / max) * 100}%` }} title={baselineLabel} />}
          </span>
          <span className="hrow-v">{format(i.value)}</span>
        </button>
      ))}
      {baseline !== undefined && baselineLabel && <p className="fine" style={{ marginTop: 6 }}>▏ {baselineLabel}</p>}
      {t.node}
    </div>
  )
}

/* ------------------------------------------------------------------ organic vs paid split */
export function Split({ org, ads, height = 8 }: { org: number; ads: number; height?: number }) {
  const t = useTip()
  const tot = org + ads || 1
  const body = <TipBody rows={[{ key: 'Organic', color: 'var(--org)', value: n(org) }, { key: 'From ads', color: 'var(--paid)', value: n(ads) }]} />
  return (
    <div className="chart" ref={t.ref} onPointerMove={(e) => t.show(e, body)} onPointerLeave={t.hide}>
      <div className="split" style={{ height }}>
        {org > 0 && <span style={{ flex: org / tot, background: 'var(--org)' }} />}
        {ads > 0 && <span style={{ flex: ads / tot, background: 'var(--paid)' }} />}
      </div>
      {t.node}
    </div>
  )
}

/* ------------------------------------------------------------------ dumbbell: organic reach -> total reach, typical marked (log scale) */
export function Dumbbell({ rows, typicalLabel }: {
  rows: { key: string; label: string; sub: string; org: number; total: number; typical: number; onClick?: () => void }[]
  typicalLabel: string
}) {
  const t = useTip()
  const lo = 100, hi = Math.max(...rows.map((r) => r.total), 1000) * 1.2
  const sx = (v: number) => (Math.log10(Math.max(v, lo)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))
  const ticks = [100, 1000, 10000, 100000, 1000000].filter((v) => v <= hi)
  return (
    <div className="chart dumb" ref={t.ref}>
      <div className="dumb-axis">
        <span />
        <div className="dumb-scale">
          {ticks.map((v) => <span key={v} style={{ left: `${sx(v) * 100}%` }}>{n(v)}</span>)}
        </div>
      </div>
      {rows.map((r) => (
        <button key={r.key} className="dumb-row" onClick={r.onClick}
          onPointerMove={(e) => t.show(e, <TipBody label={r.label} rows={[
            { key: 'Organic reach', color: 'var(--org)', value: n(r.org) },
            { key: 'With the boost', color: 'var(--paid)', value: n(r.total) },
            { key: typicalLabel, color: 'var(--ink-3)', value: n(r.typical) },
          ]} />)} onPointerLeave={t.hide}>
          <span className="dumb-l"><b>{r.label}</b><em>{r.sub}</em></span>
          <span className="dumb-track">
            {ticks.map((v) => <i key={v} className="dumb-grid" style={{ left: `${sx(v) * 100}%` }} />)}
            <i className="dumb-typ" style={{ left: `${sx(r.typical) * 100}%` }} />
            <i className="dumb-line" style={{ left: `${sx(r.org) * 100}%`, width: `${(sx(r.total) - sx(r.org)) * 100}%` }} />
            <i className="dumb-dot" style={{ left: `${sx(r.org) * 100}%`, background: 'var(--org)' }} />
            <i className="dumb-dot" style={{ left: `${sx(r.total) * 100}%`, background: 'var(--paid)' }} />
          </span>
        </button>
      ))}
      <div className="legend" style={{ marginTop: 10 }}>
        <span><i style={{ background: 'var(--org)', borderRadius: 99 }} />Organic reach</span>
        <span><i style={{ background: 'var(--paid)', borderRadius: 99 }} />Reach with the boost</span>
        <span><i style={{ background: 'var(--ink-3)', width: 2 }} />{typicalLabel}</span>
        <span className="muted">Log scale: each step is 10×</span>
      </div>
      {t.node}
    </div>
  )
}

/* ------------------------------------------------------------------ daily lines (one or two series, shared axis, crosshair tooltip) */
export function DailyLines({ days, series, height = 190, format = n }: {
  days: string[]
  series: { key: string; label: string; color: string; values: (number | null)[] }[]
  height?: number
  format?: (x: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [W, setW] = useState(800)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(Math.max(280, el.clientWidth)))
    ro.observe(el)
    setW(Math.max(280, el.clientWidth))
    return () => ro.disconnect()
  }, [])
  const H = height, PL = 44, PR = 76, PT = 12, PB = 26
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null))
  const rawMax = Math.max(...all, 1)
  const step = Math.pow(10, Math.floor(Math.log10(rawMax))) / 2
  const max = Math.ceil(rawMax / step) * step
  const x = (i: number) => PL + (i * (W - PL - PR)) / Math.max(days.length - 1, 1)
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB)
  const ticks = [0, max / 2, max]
  const fmtDay = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const onMove = (e: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    const i = Math.round(((px - PL) / (W - PL - PR)) * (days.length - 1))
    setHover(Math.max(0, Math.min(days.length - 1, i)))
  }
  return (
    <div className="chart" ref={ref} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={series.map((s) => s.label).join(' and ') + ' by day'} style={{ display: 'block', maxWidth: '100%' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" className="axis-t">{n(t)}</text>
          </g>
        ))}
        {[0, Math.floor((days.length - 1) / 2), days.length - 1].map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'} className="axis-t">{fmtDay(days[i])}</text>
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' ')
          const lastI = s.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop() ?? 0
          const last = s.values[lastI] ?? 0
          return (
            <g key={s.key}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <text x={x(lastI) + 8} y={y(last) + 4} className="axis-t" style={{ fill: 'var(--ink)', fontWeight: 600 }}>{s.label}</text>
            </g>
          )
        })}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="var(--ink-3)" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%`, top: 8, transform: 'translate(-50%, 0)' }}>
          <div className="muted">{fmtDay(days[hover])}</div>
          {series.map((s) => (
            <div key={s.key} className="tip-row"><i style={{ background: s.color }} />{s.label}<b>{s.values[hover] === null ? '—' : format(s.values[hover] as number)}</b></div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ side-by-side comparison rows */
export function CompareRows({ rows, aLabel, bLabel }: {
  rows: { key: string; label: string; a: number; b: number; format?: (x: number) => string }[]
  aLabel: string
  bLabel: string
}) {
  return (
    <div className="cmp-rows">
      <div className="legend" style={{ marginBottom: 8 }}>
        <span><i style={{ background: 'var(--accent)' }} />{aLabel}</span>
        <span><i style={{ background: 'var(--mute-mark)' }} />{bLabel}</span>
      </div>
      {rows.map((r) => {
        const f = r.format ?? n
        const max = Math.max(r.a, r.b, 1)
        const d = r.b ? (r.a - r.b) / r.b : null
        return (
          <div key={r.key} className="cmp-row">
            <span className="cmp-l">{r.label}</span>
            <div className="cmp-bars">
              <span style={{ width: `${(r.a / max) * 100}%`, background: 'var(--accent)' }} />
              <span style={{ width: `${(r.b / max) * 100}%`, background: 'var(--mute-mark)' }} />
            </div>
            <span className="cmp-v"><b>{f(r.a)}</b> vs {f(r.b)}{d !== null && <em className={d >= 0 ? 'up' : 'down'}>{d >= 0 ? '+' : '−'}{pct(Math.abs(d))}</em>}</span>
          </div>
        )
      })}
    </div>
  )
}
