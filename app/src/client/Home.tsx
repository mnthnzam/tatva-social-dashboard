import type { PlanMonth, ReportMonth } from '../types'
import { monthContent, monthPlan, reportMonths } from '../lib/data'
import { n, plural } from '../lib/format'
import { monthReviewSummary, useReviews } from '../lib/review'
import { Creative } from '../components/Creative'
import { Icon } from '../components/Icon'
import type { CRoute } from '../App'
import { AccountStrip } from '../views/AccountView'

export function Home({ plan, report, go }: { plan: PlanMonth; report: ReportMonth; go: (r: CRoute) => void }) {
  const { reviews } = useReviews()
  const pl = monthPlan(plan.id)
  const rs = monthReviewSummary(pl, reviews)
  const withDesign = pl.filter((p) => p.creative).slice(0, 4)
  const top = monthContent(report.id).filter((c) => c.verdict?.key === 'standout').sort((a, b) => (b.verdict!.score ?? 0) - (a.verdict!.score ?? 0)).slice(0, 4)
  const s = report.summary
  return (
    <>
      <header className="p-head">
        <span className="eyebrow">Tatva Global School · Social media</span>
        <h1 className="p-title">Two things this month</h1>
        <p className="p-sub">Review what’s going out in {plan.label}, and see how {report.label} went.</p>
      </header>
      <AccountStrip onGo={() => go({ page: 'account' })} />
      <div className="home-grid">
        <button className="home-card primary" onClick={() => go({ page: 'review', month: plan.id })}>
          <span className="hc-step">Start of month</span>
          <h2>Review {plan.label}</h2>
          <p>{plural(pl.length, 'post')} planned. Designs are ready to check; reels come to you as a script first, then as the final cut.</p>
          <div className="hc-thumbs">{withDesign.map((p) => <Creative key={p.id} img={p.creative} format={p.format} />)}</div>
          <div className="hc-stats">
            <div className="hc-stat"><strong>{rs.waiting}</strong><span>waiting for you</span></div>
            <div className="hc-stat"><strong>{rs.approved + rs.partial}</strong><span>approved</span></div>
            <div className="hc-stat"><strong>{rs.changes}</strong><span>changes asked</span></div>
          </div>
          <span className="btn btn-primary hc-cta">Start reviewing <Icon name="arrow" size={16} /></span>
        </button>
        <button className="home-card" onClick={() => go({ page: 'results', month: report.id })}>
          <span className="hc-step">End of month</span>
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
