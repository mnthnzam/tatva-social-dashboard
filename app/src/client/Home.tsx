import type { PlanMonth, ReportMonth } from '../types'
import type { Selection } from '../components/Drawer'
import { DATA, monthContent, monthPlan, reportMonths } from '../lib/data'
import { day, n, parseDate, plural } from '../lib/format'
import { Creative } from '../components/Creative'
import { Icon } from '../components/Icon'
import type { CRoute } from '../App'
import { AccountView } from '../views/AccountView'

export function Home({ plan, report, go, open }: { plan: PlanMonth | null; report: ReportMonth; go: (r: CRoute) => void; open: (s: Selection) => void }) {
  const pl = plan ? monthPlan(plan.id) : []
  const ps = plan?.summary
  const s = report.summary
  const withDesign = pl.filter((p) => p.creative).slice(0, 4)
  const top = monthContent(report.id).filter((c) => c.verdict?.key === 'standout').sort((a, b) => (b.verdict!.score ?? 0) - (a.verdict!.score ?? 0)).slice(0, 4)
  const t = new Date()
  const t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  const nextDue = pl.filter((p) => p.footageDue && parseDate(p.footageDue) >= t0).sort((a, b) => a.footageDue!.localeCompare(b.footageDue!))[0]
  return (
    <>
      <header className="p-head">
        <span className="eyebrow">Tatva Global School · Instagram & Facebook</span>
        <h1 className="p-title">Your social media at a glance</h1>
        <p className="p-sub">{plan ? <>What’s going out in {plan.label}, how {report.label} went</> : <>How {report.label} went</>}, and where your pages stand over {DATA.account.period.label}.</p>
      </header>

      <div className="home-grid">
        {plan && ps ? <button className="home-card primary" onClick={() => go({ page: 'plan' })}>
          <span className="hc-step">Coming up</span>
          <h2>{plan.label} plan</h2>
          <p>{plural(ps.planned, 'post')} in the calendar. {ps.designReady} designs are final; {plural(ps.formats.Reel ?? 0, 'reel')} get made once footage comes in from your team.</p>
          <div className="hc-thumbs">{withDesign.map((p) => <Creative key={p.id} img={p.creative} format={p.format} />)}</div>
          <div className="hc-stats">
            <div className="hc-stat"><strong>{ps.planned}</strong><span>posts planned</span></div>
            <div className="hc-stat"><strong>{ps.designReady}</strong><span>designs ready</span></div>
            {nextDue && <div className="hc-stat"><strong>{day(nextDue.footageDue)}</strong><span>next footage due</span></div>}
          </div>
          <span className="btn btn-primary hc-cta">See the plan <Icon name="arrow" size={16} /></span>
        </button> : (
          <div className="home-card">
            <span className="hc-step">Coming up</span>
            <h2>{nextLabel(report.id)} plan</h2>
            <p>The {nextLabel(report.id)} calendar isn’t on the dashboard yet. It will appear here once it’s signed off.</p>
          </div>
        )}
        <button className="home-card" onClick={() => go({ page: 'results', month: report.id })}>
          <span className="hc-step">Last month</span>
          <h2>How {report.label} went</h2>
          <p>{plural(s.posts, 'post')} on your pages. {s.verdicts.standout} stood out; here’s what worked and what to try differently.</p>
          <div className="hc-thumbs">{top.map((c) => <Creative key={c.id} img={c.image} format={c.format} />)}</div>
          <div className="hc-stats">
            <div className="hc-stat"><strong>{n(s.plain.reached)}</strong><span>people reached</span></div>
            <div className="hc-stat"><strong>{n(s.plain.passedOn)}</strong><span>shares & saves</span></div>
            <div className="hc-stat"><strong>{n(s.plain.follows)}</strong><span>new followers</span></div>
          </div>
          <span className="btn btn-line hc-cta">See results <Icon name="arrow" size={16} /></span>
        </button>
      </div>

      <section className="section">
        <div className="s-head">
          <h2 className="s-title">Your accounts</h2>
          <span className="s-note">{DATA.account.period.label} vs the {DATA.account.period.compare}. Click any number to see it by day.</span>
        </div>
        <AccountView open={open} />
      </section>

      <section className="section">
        <div className="s-head"><h3 className="s-title">Earlier months</h3></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {reportMonths.filter((m) => m.id !== report.id).reverse().map((m) => (
            <button key={m.id} className="btn btn-quiet" onClick={() => go({ page: 'results', month: m.id })}>{m.label} results</button>
          ))}
        </div>
      </section>
    </>
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function nextLabel(id: string) {
  return MONTHS[Number(id.slice(5, 7)) % 12]
}
