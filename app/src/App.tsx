import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Month, ReportMonth } from './types'
import { DATA, RANGE, reportMonths } from './lib/data'
import { useTheme, type Theme } from './lib/theme'
import { Drawer, type Selection } from './components/Drawer'
import { Icon } from './components/Icon'
import { Insights } from './client/Insights'
import { Results } from './client/Results'
import { Posts } from './views/Posts'
import { PlanView } from './views/PlanView'
import { Boosts } from './views/Boosts'
import { Trends } from './views/Trends'
import { Collabs } from './views/Collabs'
import { DataView } from './views/DataView'
import { AccountView } from './views/AccountView'

/** One dashboard for everyone. Insights is the front page; the rest are tabs. */
export type Page = 'insights' | 'results' | 'posts' | 'calendar' | 'accounts' | 'trends' | 'boosts' | 'collabs' | 'data'
/** Kept for the older views, which navigate with { view, month }. */
export type View = 'overview' | 'account' | 'posts' | 'plan' | 'boosts' | 'trends' | 'collabs' | 'data'
export interface Route { month: string; view: View; sel: Selection }
interface R { page: Page; month: string; sel: Selection }

const PAGES: { id: Page; label: string; scope: 'month' | 'all'; note?: string }[] = [
  { id: 'insights', label: 'Insights', scope: 'month' },
  { id: 'results', label: 'Results', scope: 'month' },
  { id: 'posts', label: 'Posts', scope: 'month' },
  { id: 'calendar', label: 'Plan vs live', scope: 'month' },
  { id: 'accounts', label: 'Accounts', scope: 'all' },
  { id: 'trends', label: 'Trends', scope: 'all' },
  { id: 'boosts', label: 'Boosts', scope: 'all' },
  { id: 'collabs', label: 'Collabs', scope: 'all' },
  { id: 'data', label: 'Data', scope: 'all' },
]
// Results-style pages only make sense for months with results; the calendar and posts can also show a plan month.
const REPORT_ONLY: Page[] = ['insights', 'results']
const VIEW_TO_PAGE: Record<View, Page> = { overview: 'insights', account: 'accounts', posts: 'posts', plan: 'calendar', boosts: 'boosts', trends: 'trends', collabs: 'collabs', data: 'data' }

const LATEST = reportMonths[reportMonths.length - 1]

function parseSel(q: string | undefined): Selection {
  const open = new URLSearchParams(q || '').get('open')
  return open && /^[cpm]:/.test(open) ? { kind: open[0] as 'c' | 'p' | 'm', id: open.slice(2) } : null
}

function monthsFor(page: Page): Month[] {
  return REPORT_ONLY.includes(page) ? reportMonths : DATA.months
}

function parse(hash: string): R {
  const [path, q] = hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const sel = parseSel(q)
  const pick = (page: Page, m?: string): R => ({ page, month: monthsFor(page).some((x) => x.id === m) ? m! : LATEST.id, sel })
  // Old links: #/team/<month>/<view>, #/plan, #/review, #/account, #/results/<month>
  if (parts[0] === 'team') return pick(VIEW_TO_PAGE[(parts[2] as View) ?? 'overview'] ?? 'insights', parts[1])
  if (parts[0] === 'plan' || parts[0] === 'review') return pick('calendar')
  if (parts[0] === 'account') return pick('accounts')
  const page = PAGES.find((p) => p.id === parts[0])?.id ?? 'insights'
  return pick(page, parts[1])
}

const toHash = (r: R) => `#/${r.page}/${r.month}${r.sel ? `?open=${r.sel.kind}:${encodeURIComponent(r.sel.id)}` : ''}`

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

function MonthTabs({ months, current, go }: { months: Month[]; current: string; go: (id: string) => void }) {
  const i = months.findIndex((m) => m.id === current)
  return (
    <nav className="month-tabs" aria-label="Month">
      <button className="mt-step" disabled={i <= 0} onClick={() => i > 0 && go(months[i - 1].id)} aria-label="Previous month"><Icon name="chevron-left" size={16} /></button>
      <div className="mt-list" role="tablist">
        {months.map((m) => (
          <button key={m.id} role="tab" aria-selected={m.id === current} className={m.id === current ? 'on' : ''} onClick={() => go(m.id)}>
            <span>{m.label.slice(0, 3)}</span><em>{m.kind === 'plan' ? 'plan' : m.year}</em>
          </button>
        ))}
      </div>
      <button className="mt-step" disabled={i >= months.length - 1} onClick={() => i < months.length - 1 && go(months[i + 1].id)} aria-label="Next month"><Icon name="chevron-right" size={16} /></button>
    </nav>
  )
}

export default function App() {
  const [r, setR] = useState<R>(() => parse(window.location.hash))
  const [theme, setTheme] = useTheme()
  useEffect(() => {
    const on = () => setR(parse(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const nav = useCallback((next: R, top = true) => {
    if (top) window.scrollTo({ top: 0 })
    window.location.hash = toHash(next)
  }, [])
  const goPage = useCallback((page: Page) => nav({ page, month: monthsFor(page).some((m) => m.id === r.month) ? r.month : LATEST.id, sel: null }), [nav, r.month])
  const goMonth = useCallback((month: string) => nav({ ...r, month, sel: null }), [nav, r])
  const open = useCallback((sel: Selection) => nav({ ...r, sel }, false), [nav, r])
  const close = useCallback(() => nav({ ...r, sel: null }, false), [nav, r])
  // Adapter for the older views
  const goLegacy = useCallback((patch: Partial<Route>) => {
    if (patch.sel !== undefined && !patch.view && !patch.month) return open(patch.sel)
    nav({ page: patch.view ? VIEW_TO_PAGE[patch.view] : r.page, month: patch.month ?? r.month, sel: patch.sel ?? null })
  }, [nav, open, r])

  const def = PAGES.find((p) => p.id === r.page)!
  const month = DATA.months.find((m) => m.id === r.month)!
  const report = (reportMonths.find((m) => m.id === r.month) ?? LATEST) as ReportMonth

  const body = useMemo(() => {
    switch (r.page) {
      case 'insights': return <Insights month={report} open={open} go={(p) => goPage(p as Page)} />
      case 'results': return <Results month={report} open={open} />
      case 'posts': return <Posts month={month} open={open} go={goLegacy} />
      case 'calendar': return <PlanView month={month} open={open} go={goLegacy} />
      case 'accounts': return <AccountView open={open} />
      case 'trends': return <Trends open={open} go={goLegacy} />
      case 'boosts': return <Boosts open={open} />
      case 'collabs': return <Collabs open={open} />
      case 'data': return <DataView open={open} />
    }
  }, [r.page, report, month, open, goPage, goLegacy])

  return (
    <div className="c-shell">
      <header className="c-top">
        <div className="c-top-in">
          <button className="c-brand" onClick={() => goPage('insights')}><span className="mark">T</span><span className="nm">Tatva Global School</span></button>
          <nav className="c-nav">
            {PAGES.map((p) => (
              <button key={p.id} className={r.page === p.id ? 'on' : ''} onClick={() => goPage(p.id)}>{p.label}</button>
            ))}
          </nav>
          <div className="c-right"><ThemeToggle theme={theme} set={setTheme} /></div>
        </div>
      </header>
      <main className="c-main">
        {def.scope === 'month'
          ? <MonthTabs months={monthsFor(r.page)} current={r.month} go={goMonth} />
          : <div className="page-scope"><span className="eyebrow">{def.label} · {r.page === 'accounts' ? DATA.account.period.label : RANGE}</span></div>}
        {body}
      </main>
      <footer className="c-foot">
        <span>Instagram & Facebook by Zamstars · Meta data to {new Date(DATA.dataCutoff).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · built {DATA.generatedAt}</span>
      </footer>
      <Drawer sel={r.sel} onClose={close} onOpen={open} mode="team" />
    </div>
  )
}
