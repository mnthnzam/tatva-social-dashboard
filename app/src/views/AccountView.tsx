import { useState } from 'react'
import type { Selection } from '../components/Drawer'
import { DATA } from '../lib/data'
import { n, pct } from '../lib/format'
import { DailyLines } from '../components/Charts'

const LABEL: Record<string, string> = {
  views: 'Views', reach: 'Accounts reached', viewers: 'Viewers', interactions: 'Interactions', follows: 'New follows',
  unfollows: 'Unfollows', visits: 'Page visits', conversations: 'Messages started',
}
const A = () => DATA.account

export const prevOf = (x: { value: number; change: number }) => (x.change > -1 ? x.value / (1 + x.change) : 0)

export function Change({ change, invert }: { change: number; invert?: boolean }) {
  const dir = Math.abs(change) < 0.02 ? 'flat' : (change > 0) !== !!invert ? 'up' : 'down'
  return <em className={dir}>{change > 0.02 ? '↑' : change < -0.02 ? '↓' : '→'} {pct(Math.abs(change))}</em>
}

/** Totals across both platforms, with the change worked back from Meta's per-platform % changes. */
export function combined(metric: string) {
  const ps = Object.values(A().platforms).map((p) => p.metrics[metric]).filter(Boolean)
  const value = ps.reduce((a, x) => a + x.value, 0)
  const prev = ps.reduce((a, x) => a + prevOf(x), 0)
  return { value, change: prev ? (value - prev) / prev : 0 }
}

export function AccountStrip({ onGo }: { onGo: () => void }) {
  const { instagram: ig, facebook: fb } = A().platforms
  const net = (p: typeof ig) => (p.metrics.follows?.value ?? 0) - (p.metrics.unfollows?.value ?? 0)
  const views = combined('views')
  const inter = combined('interactions')
  return (
    <div className="strip">
      <button onClick={onGo}><small>Instagram followers</small><b>{ig.followersLabel}</b><em className={net(ig) >= 0 ? 'up' : 'down'}>{net(ig) >= 0 ? '+' : ''}{net(ig)} in 28 days</em></button>
      <button onClick={onGo}><small>Facebook followers</small><b>{fb.followersLabel}</b><em className={net(fb) >= 0 ? 'up' : 'down'}>{net(fb) >= 0 ? '+' : ''}{net(fb)} in 28 days</em></button>
      <button onClick={onGo}><small>Views · 28 days</small><b>{n(views.value)}</b><Change change={views.change} /></button>
      <button onClick={onGo}><small>Interactions · 28 days</small><b>{n(inter.value)}</b><Change change={inter.change} /></button>
    </div>
  )
}

export function AccountView({ open, client }: { open: (s: Selection) => void; client?: boolean }) {
  const acc = A()
  const [metric, setMetric] = useState<'views' | 'interactions' | 'follows'>('views')
  const plats = ['instagram', 'facebook'] as const
  return (
    <>
      {client && (
        <header className="p-head">
          <span className="eyebrow">Instagram & Facebook · {acc.period.label}</span>
          <h1 className="p-title">Your accounts at a glance</h1>
          <p className="p-sub">The last 28 days compared with the 28 days before. Click any number to see it by day and against the previous period.</p>
        </header>
      )}
      <div className="acct-grid">
        {plats.map((k) => {
          const p = acc.platforms[k]
          const net = (p.metrics.follows?.value ?? 0) - (p.metrics.unfollows?.value ?? 0)
          return (
            <section key={k} className="acct">
              <div className="acct-h"><h3><span className="dot" style={{ background: `var(--${k === 'instagram' ? 'ig' : 'fb'})`, marginRight: 8 }} />{p.label}</h3><span>{k === 'instagram' ? '@' : ''}{p.handle}</span></div>
              <div className="acct-big"><strong>{p.followersLabel}</strong><span>followers · {net >= 0 ? '+' : ''}{net} net in 28 days ({p.metrics.follows?.value} follows, {p.metrics.unfollows?.value} unfollows)</span></div>
              <div className="acct-mets">
                {Object.entries(p.metrics).map(([mk, x]) => (
                  <button key={mk} className="acct-met" onClick={() => open({ kind: 'm', id: `acct|${k}|${mk}` })}>
                    <b>{n(x.value)}</b><span>{LABEL[mk] ?? mk}</span><Change change={x.change} invert={mk === 'unfollows'} />
                  </button>
                ))}
              </div>
              {p.split.viewsFromFollowers !== undefined && (
                <div>
                  <div className="split" style={{ height: 8 }}>
                    <span style={{ flex: p.split.viewsFromFollowers, background: `var(--${k === 'instagram' ? 'ig' : 'fb'})` }} />
                    <span style={{ flex: 1 - p.split.viewsFromFollowers, background: 'var(--mute-mark)' }} />
                  </div>
                  <p className="fine" style={{ marginTop: 6 }}>{Math.round(p.split.viewsFromFollowers * 100)}% of views came from followers, {100 - Math.round(p.split.viewsFromFollowers * 100)}% from people who don’t follow yet.</p>
                </div>
              )}
            </section>
          )
        })}
      </div>

      <section className="section panel" style={{ marginTop: 24 }}>
        <div className="panel-head">
          <h3>By day</h3>
          <div className="seg">
            {(['views', 'interactions', 'follows'] as const).map((m) => <button key={m} className={metric === m ? 'on' : ''} onClick={() => setMetric(m)}>{LABEL[m]}</button>)}
          </div>
        </div>
        <DailyLines days={acc.days} series={plats.filter((k) => acc.platforms[k].daily[metric]).map((k) => ({
          key: k, label: acc.platforms[k].label, color: `var(--${k === 'instagram' ? 'ig' : 'fb'})`, values: acc.platforms[k].daily[metric],
        }))} />
        {acc.platforms.instagram.note && <p className="fine" style={{ marginTop: 10 }}>{acc.platforms.instagram.note}</p>}
      </section>
      <p className="fine" style={{ marginTop: 16 }}>Snapshot from Meta Business Suite, pulled {new Date(acc.capturedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Follower totals are rounded by Meta.</p>
    </>
  )
}
