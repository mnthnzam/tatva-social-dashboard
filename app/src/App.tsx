import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PlanMonth, ReportMonth } from './types'
import { DATA, monthPlan, reportMonths } from './lib/data'
import { monthShort } from './lib/format'
import { monthReviewSummary, useReviews } from './lib/review'
import { useTheme, type Theme } from './lib/theme'
import { Drawer, type Selection } from './components/Drawer'
import { Icon } from './components/Icon'
import { Home } from './client/Home'
import { Review } from './client/Review'
import { Results } from './client/Results'
import { Overview } from './views/Overview'
import { PlanOverview } from './views/PlanOverview'
import { Posts } from './views/Posts'
import { PlanView } from './views/PlanView'
import { Boosts } from './views/Boosts'
import { Trends } from './views/Trends'
import { Collabs } from './views/Collabs'
import { DataView } from './views/DataView'
import { AccountView } from './views/AccountView'

export type View = 'overview' | 'account' | 'posts' | 'plan' | 'boosts' | 'trends' | 'collabs' | 'data'
export interface Route { month: string; view: View; sel: Selection }
export type CRoute = { page: 'home' | 'account' | 'review' | 'results'; month?: string }

const VIEWS: { id: View; label: string; icon: string; scope: 'month' | 'all' }[] = [
  { id: 'overview', label: 'Overview', icon: 'overview', scope: 'month' },
  { id: 'account', label: 'Accounts', icon: 'home', scope: 'all' },
  { id: 'posts', label: 'Posts', icon: 'posts', scope: 'month' },
  { id: 'plan', label: 'Plan vs live', icon: 'plan', scope: 'month' },
  { id: 'boosts', label: 'Boosts', icon: 'boost', scope: 'all' },
  { id: 'trends', label: 'Trends', icon: 'trends', scope: 'all' },
  { id: 'collabs', label: 'Collabs', icon: 'collab', scope: 'all' },
  { id: 'data', label: 'Data & review', icon: 'data', scope: 'all' },
]

const LATEST_REPORT = reportMonths[reportMonths.length - 1]
const PLAN_MONTH = DATA.months.find((m): m is PlanMonth => m.kind === 'plan')!

type Parsed = { mode: 'client'; c: CRoute; sel: Selection } | { mode: 'team'; t: Route }

function parseSel(q: string | undefined): Selection {
  const open = new URLSearchParams(q || '').get('open')
  return open && /^[cpm]:/.test(open) ? { kind: open[0] as 'c' | 'p' | 'm', id: open.slice(2) } : null
}

function parse(hash: string): Parsed {
  const [path, q] = hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const sel = parseSel(q)
  if (parts[0] === 'team') {
    const month = DATA.months.some((m) => m.id === parts[1]) ? parts[1] : LATEST_REPORT.id
    const view = (VIEWS.some((v) => v.id === parts[2]) ? parts[2] : 'overview') as View
    return { mode: 'team', t: { month, view, sel } }
  }
  if (parts[0] === 'account') return { mode: 'client', c: { page: 'account' }, sel }
  if (parts[0] === 'review') return { mode: 'client', c: { page: 'review', month: PLAN_MONTH.id }, sel }
  if (parts[0] === 'results') {
    const month = reportMonths.some((m) => m.id === parts[1]) ? parts[1] : LATEST_REPORT.id
    return { mode: 'client', c: { page: 'results', month }, sel }
  }
  return { mode: 'client', c: { page: 'home' }, sel }
}

const cHash = (c: CRoute, sel: Selection = null) =>
  `#/${c.page === 'home' ? '' : c.page === 'account' ? 'account' : c.page === 'review' ? 'review' : `results/${c.month}`}${sel ? `?open=${sel.kind}:${encodeURIComponent(sel.id)}` : ''}`
const tHash = (r: Route) => `#/team/${r.month}/${r.view}${r.sel ? `?open=${r.sel.kind}:${encodeURIComponent(r.sel.id)}` : ''}`

function ThemeToggle({ theme, set }: { theme: Theme; set: (t: Theme) => void }) {
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme">
      {(['light', 'auto', 'dark'] as Theme[]).map((t) => (
        <button key={t} className={theme === t ? 'on' : ''} onClick={() => set(t)} role="radio" aria-checked={theme === t} title={t === 'auto' ? 'Match system' : `${t[0].toUpperCase()}${t.slice(1)}`}>
          <Icon name={t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'auto'} size={15} />
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [parsed, setParsed] = useState<Parsed>(() => parse(window.location.hash))
  const [theme, setTheme] = useTheme()
  useEffect(() => {
    const on = () => setParsed(parse(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const nav = (h: string, top = true) => {
    if (top) window.scrollTo({ top: 0 })
    window.location.hash = h
  }
  return parsed.mode === 'client'
    ? <ClientApp c={parsed.c} sel={parsed.sel} nav={nav} theme={theme} setTheme={setTheme} />
    : <TeamApp r={parsed.t} nav={nav} theme={theme} setTheme={setTheme} />
}

/* ================================================================== client */
function ClientApp({ c, sel, nav, theme, setTheme }: { c: CRoute; sel: Selection; nav: (h: string, top?: boolean) => void; theme: Theme; setTheme: (t: Theme) => void }) {
  const { reviews } = useReviews()
  const waiting = monthReviewSummary(monthPlan(PLAN_MONTH.id), reviews).waiting
  const go = useCallback((r: CRoute) => nav(cHash(r)), [nav])
  const open = useCallback((s: Selection) => nav(cHash(c, s), false), [nav, c])
  const close = useCallback(() => nav(cHash(c), false), [nav, c])
  const report = (reportMonths.find((m) => m.id === c.month) ?? LATEST_REPORT) as ReportMonth
  return (
    <div className="c-shell">
      <header className="c-top">
        <div className="c-top-in">
          <button className="c-brand" onClick={() => go({ page: 'home' })}><span className="mark">T</span><span className="nm">Tatva Global School</span></button>
          <nav className="c-nav">
            <button className={c.page === 'home' ? 'on' : ''} onClick={() => go({ page: 'home' })}>Home</button>
            <button className={c.page === 'account' ? 'on' : ''} onClick={() => go({ page: 'account' })}>Accounts</button>
            <button className={c.page === 'review' ? 'on' : ''} onClick={() => go({ page: 'review', month: PLAN_MONTH.id })}>
              Review {PLAN_MONTH.label}{waiting > 0 && <span className="count">{waiting}</span>}
            </button>
            <button className={c.page === 'results' ? 'on' : ''} onClick={() => go({ page: 'results', month: c.page === 'results' ? report.id : LATEST_REPORT.id })}>Results</button>
          </nav>
          <div className="c-right">
            {c.page === 'results' && (
              <select className="btn btn-quiet btn-sm" value={report.id} onChange={(e) => go({ page: 'results', month: e.target.value })} aria-label="Month">
                {[...reportMonths].reverse().map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            )}
            <ThemeToggle theme={theme} set={setTheme} />
            <button className="mode-switch" onClick={() => nav(tHash({ month: LATEST_REPORT.id, view: 'overview', sel: null }))} title="Zamstars team view">
              <Icon name="swap" size={14} /><span>Team view</span>
            </button>
          </div>
        </div>
      </header>
      <main className="c-main">
        {c.page === 'home' && <Home plan={PLAN_MONTH} report={LATEST_REPORT} go={go} />}
        {c.page === 'account' && <AccountView open={open} client />}
        {c.page === 'review' && <Review month={PLAN_MONTH} open={open} />}
        {c.page === 'results' && <Results month={report} open={open} />}
      </main>
      <Drawer sel={sel} onClose={close} onOpen={open} mode="client" />
    </div>
  )
}

/* ================================================================== team */
function TeamApp({ r, nav, theme, setTheme }: { r: Route; nav: (h: string, top?: boolean) => void; theme: Theme; setTheme: (t: Theme) => void }) {
  const [navOpen, setNavOpen] = useState(false)
  const go = useCallback((patch: Partial<Route>) => {
    setNavOpen(false)
    nav(tHash({ ...r, ...patch }), Boolean(patch.view || patch.month))
  }, [nav, r])
  const open = useCallback((sel: Selection) => go({ sel }), [go])
  const close = useCallback(() => go({ sel: null }), [go])
  const month = DATA.months.find((m) => m.id === r.month)!
  const viewDef = VIEWS.find((v) => v.id === r.view)!
  const body = useMemo(() => {
    const props = { month, open, go }
    switch (r.view) {
      case 'overview': return month.kind === 'report' ? <Overview {...props} month={month} /> : <PlanOverview {...props} />
      case 'posts': return <Posts {...props} />
      case 'plan': return <PlanView {...props} />
      case 'account': return <AccountView open={open} />
      case 'boosts': return <Boosts open={open} />
      case 'trends': return <Trends open={open} go={go} />
      case 'collabs': return <Collabs open={open} />
      case 'data': return <DataView open={open} />
    }
  }, [r.view, month, open, go])

  return (
    <div className="shell">
      <aside className={`side${navOpen ? ' open' : ''}`}>
        <div className="brand">
          <span className="mark">T</span>
          <div><strong>Tatva Social</strong><span>Zamstars team view</span></div>
        </div>
        <div className="side-group">
          <span className="side-label">Brand</span>
          {DATA.brands.map((b) => (
            <button key={b.id} className={`brand-opt${b.id === DATA.brand.id ? ' active' : ''}`} disabled={!b.connected} title={b.reason}>
              <span className="brand-short">{b.short}</span><span>{b.name}</span>{!b.connected && <span className="tag-off">Not connected</span>}
            </button>
          ))}
        </div>
        <nav className="side-group">
          <span className="side-label">Views</span>
          {VIEWS.map((v) => (
            <button key={v.id} className={`nav-btn${r.view === v.id ? ' active' : ''}`} onClick={() => go({ view: v.id, sel: null })}>
              <Icon name={v.icon} /><span>{v.label}</span>{v.scope === 'all' && <span className="nav-scope">{v.id === 'account' ? '28 days' : 'Jul–Sep'}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <button className="mode-switch" onClick={() => nav(cHash({ page: 'home' }))}><Icon name="swap" size={14} /><span>Client view</span></button>
          <ThemeToggle theme={theme} set={setTheme} />
          <span>Meta data to {new Date(DATA.dataCutoff).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · built {DATA.generatedAt}</span>
        </div>
      </aside>
      {navOpen && <div className="side-scrim" onClick={() => setNavOpen(false)} />}
      <main className="main">
        <header className="top">
          <button className="menu-btn" onClick={() => setNavOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
          <div>
            <span className="eyebrow">{DATA.brand.name}</span>
            <h1>{r.view === 'account' ? `Accounts · ${DATA.account.period.label}` : viewDef.scope === 'all' ? `${viewDef.label} · Jul–Sep` : `${month.label} ${month.year}`}</h1>
          </div>
          {viewDef.scope === 'month' && (
            <div className="months seg" role="tablist">
              {DATA.months.map((m) => (
                <button key={m.id} role="tab" aria-selected={m.id === r.month} className={m.id === r.month ? 'on' : ''} onClick={() => go({ month: m.id, sel: null })}>
                  {monthShort(m.id)}{m.kind === 'plan' && <em>plan</em>}
                </button>
              ))}
            </div>
          )}
        </header>
        <div className="content">{body}</div>
      </main>
      <Drawer sel={r.sel} onClose={close} onOpen={open} mode="team" />
    </div>
  )
}
