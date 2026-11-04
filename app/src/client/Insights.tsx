import type { BriefItem, Content, ReportMonth } from '../types'
import type { Selection } from '../components/Drawer'
import { contentById, monthContent, monthPlan, reportMonths } from '../lib/data'
import { n, pct, plural } from '../lib/format'
import { Creative } from '../components/Creative'
import { Icon } from '../components/Icon'
import { FunnelStrip } from './Funnel'

const inr = (x: number) =>
  x >= 100000 ? `₹${(x / 100000).toFixed(2).replace(/\.?0+$/, '')}L` : x >= 1000 ? `₹${(x / 1000).toFixed(1).replace(/\.0$/, '')}K` : `₹${Math.round(x)}`

const VERDICT = {
  working: { label: 'Working', cls: 'good' },
  check: { label: 'Needs checking', cls: 'warn' },
  not: { label: 'Not working', cls: 'bad' },
} as const

/** The owner's page: one month, read in two minutes. Money first, then what to keep, what to fix, and what to decide. */
export function Insights({ month, open, go }: { month: ReportMonth; open: (s: Selection) => void; go: (page: string) => void }) {
  const s = month.summary
  const L = month.leads
  const brief = L?.brief ?? null
  const idx = reportMonths.findIndex((m) => m.id === month.id)
  const prev = idx > 0 ? reportMonths[idx - 1] : undefined
  const own = monthContent(month.id).filter((c) => c.marker !== 'collab')
  const added = own.filter((c) => c.marker === 'tatva').length
  const camps = L?.paid.campaigns ?? []
  const spend = L?.paid.spend ?? null
  const enquiries = L?.funnel.enquiries?.value ?? null
  const metaLeadSpend = camps.filter((c) => c.platform === 'Meta' && c.resultType === 'leads').reduce((a, c) => a + (c.spend ?? 0), 0)
  const web = L?.web ? L.web.channels.reduce((a, c) => a + c.sessions, 0) : null
  const reachDelta = prev && prev.summary.plain.reached ? s.plain.reached / prev.summary.plain.reached - 1 : null

  // Without a written brief (months before lead tracking), fall back to what the posts alone can say.
  const ranked = own.filter((c) => c.verdict?.score != null).sort((a, b) => b.verdict!.score! - a.verdict!.score!)
  const working: BriefItem[] = brief?.working ?? ranked.filter((c) => c.verdict!.key === 'standout').slice(0, 3).map((c) => ({ title: c.title, stat: c.verdict!.label, body: c.why, ref: `c:${c.id}` }))
  const notPosted = monthPlan(month.id).filter((p) => p.status === 'Not posted')
  const missed = notPosted.length
  const footage = notPosted.filter((p) => p.dependency === 'Footage from Tatva').length
  const notWorking: BriefItem[] = brief?.notWorking ?? [
    ...ranked.filter((c) => c.verdict!.key === 'quiet').slice(-2).reverse().map((c) => ({ title: c.title, stat: c.verdict!.label, body: c.why, ref: `c:${c.id}` })),
    ...(missed ? [{ title: 'Planned posts that didn’t go out', stat: `${missed} of ${s.due}`, body: footage ? `${plural(footage, 'was a reel', 'were reels')} waiting on footage from the Tatva team.` : 'They didn’t go out and nothing replaced them.', ref: null }] : []),
  ]

  const money = (brief?.money ?? []).map((g) => {
    const cs = camps.filter((c) => g.campaigns.includes(c.name))
    const sp = cs.reduce((a, c) => a + (c.spend ?? 0), 0)
    const res = cs.reduce((a, c) => a + (c.results ?? 0), 0)
    return { ...g, spend: sp, results: res }
  }).sort((a, b) => b.spend - a.spend)
  const moneyTotal = money.reduce((a, g) => a + g.spend, 0)

  const refOpen = (ref: string | null) => {
    if (!ref) return
    const [k, id] = ref.split(':')
    open({ kind: k as 'c' | 'p', id })
  }
  const refPost = (ref: string | null): Content | undefined => (ref?.startsWith('c:') ? contentById.get(ref.slice(2)) : undefined)

  return (
    <div className="ins">
      <header className="ins-hero">
        <span className="eyebrow">{month.label} {month.year} · Insights{month.value ? ` · Value of the month: ${month.value}` : ''}</span>
        <h1 className="ins-headline">{brief?.headline ?? autoHeadline(month, prev)}</h1>
      </header>

      <div className="ins-kpis">
        <Kpi label="Spent on ads" value={spend !== null ? inr(spend) : '—'} sub={L?.paid.spendBy ? Object.entries(L.paid.spendBy).map(([k, v]) => `${k} ${inr(v)}`).join(' · ') : 'Paid data starts in October'} />
        <Kpi label="Admission enquiries" value={enquiries !== null ? n(enquiries) : '—'} sub={enquiries && metaLeadSpend ? `₹${Math.round(metaLeadSpend / enquiries)} each from Meta ads` : 'Lead tracking starts in October'} accent />
        <Kpi label="People reached, unpaid" value={n(s.plain.reached)} sub={reachDelta !== null ? `${reachDelta >= 0 ? '↑' : '↓'} ${pct(Math.abs(reachDelta))} on ${prev!.label}` : 'Organic reach across posts'} tone={reachDelta !== null ? (reachDelta >= 0 ? 'up' : 'down') : undefined} />
        <Kpi label="Posts that went out" value={String(s.posts)} sub={`${s.delivered} of ${s.due} planned${added ? ` + ${added} added by Tatva` : ''}`} />
        {web !== null && <Kpi label="Website visits" value={n(web)} sub="All channels, Google Analytics" />}
      </div>

      {money.length > 0 && (
        <section className="ins-sec">
          <div className="ins-h"><h2>Where the money went</h2><span>{inr(moneyTotal)} across {plural(camps.length, 'campaign')}</span></div>
          <div className="money-bar" role="img" aria-label="Spend split">
            {money.map((g) => <span key={g.label} className={`mb-${VERDICT[g.verdict].cls}`} style={{ flex: g.spend }} title={`${g.label}: ${inr(g.spend)}`} />)}
          </div>
          <div className="money-rows">
            {money.map((g) => (
              <div key={g.label} className="money-row">
                <div className="mr-main">
                  <span className={`mr-dot mb-${VERDICT[g.verdict].cls}`} />
                  <div>
                    <div className="mr-t">{g.label} <span className={`ins-chip ${VERDICT[g.verdict].cls}`}>{VERDICT[g.verdict].label}</span></div>
                    <p className="mr-note">{g.note}</p>
                  </div>
                </div>
                <div className="mr-nums">
                  <span><b>{inr(g.spend)}</b>{pct(g.spend / moneyTotal)} of spend</span>
                  <span><b>{g.outcome}</b>{g.per && g.results ? `₹${Math.round(g.spend / g.results)} per ${g.per}` : 'no enquiries'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="ins-sec ins-two">
        <div>
          <div className="ins-h"><h2><span className="ins-ic good"><Icon name="up" size={16} /></span>What's working</h2></div>
          <div className="ins-cards">
            {working.map((w) => <Card key={w.title} item={w} tone="good" post={refPost(w.ref)} onOpen={() => refOpen(w.ref)} />)}
          </div>
        </div>
        <div>
          <div className="ins-h"><h2><span className="ins-ic bad"><Icon name="down" size={16} /></span>What isn't</h2></div>
          <div className="ins-cards">
            {notWorking.map((w) => <Card key={w.title} item={w} tone="bad" post={refPost(w.ref)} onOpen={() => refOpen(w.ref)} />)}
          </div>
        </div>
      </section>

      {brief?.decisions && brief.decisions.length > 0 && (
        <section className="ins-sec">
          <div className="ins-h"><h2>Decisions for {nextMonth(month.id)}</h2><span>What would change next month's numbers most</span></div>
          <ol className="ins-dec">
            {brief.decisions.map((d, i) => (
              <li key={i}><span className="dec-n">{i + 1}</span><span className="dec-t">{d.text}</span><span className="dec-o">{d.owner}</span></li>
            ))}
          </ol>
        </section>
      )}

      <section className="ins-sec">
        <div className="ins-h"><h2>From reach to admissions</h2><span>How far social media carried parents this month</span></div>
        <FunnelStrip month={month} />
      </section>

      <div className="ins-more">
        <button className="btn btn-line" onClick={() => go('results')}>See every number for {month.label} <Icon name="arrow" size={16} /></button>
        <button className="btn btn-quiet" onClick={() => go('posts')}>Browse the posts <Icon name="arrow" size={16} /></button>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, accent, tone }: { label: string; value: string; sub: string; accent?: boolean; tone?: 'up' | 'down' }) {
  return (
    <div className={`ins-kpi${accent ? ' accent' : ''}`}>
      <span className="k-l">{label}</span>
      <strong className="k-v">{value}</strong>
      <span className={`k-s${tone ? ` ${tone}` : ''}`}>{sub}</span>
    </div>
  )
}

function Card({ item, tone, post, onOpen }: { item: BriefItem; tone: 'good' | 'bad'; post?: Content; onOpen: () => void }) {
  const Tag = item.ref ? 'button' : 'div'
  return (
    <Tag className={`ins-card ${tone}${item.ref ? ' link' : ''}`} onClick={item.ref ? onOpen : undefined}>
      {post && <div className="ic-img"><Creative img={post.image} format={post.format} placeholder="" /></div>}
      <div className="ic-body">
        <span className={`ic-stat ${tone}`}>{item.stat}</span>
        <h3>{item.title}</h3>
        <p>{item.body}</p>
      </div>
    </Tag>
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const nextMonth = (id: string) => MONTHS[Number(id.slice(5, 7)) % 12]

function autoHeadline(m: ReportMonth, prev?: ReportMonth) {
  const s = m.summary
  const d = prev ? s.plain.reached / Math.max(prev.summary.plain.reached, 1) - 1 : 0
  const reach = prev ? `${d >= 0 ? 'up' : 'down'} ${Math.round(Math.abs(d) * 100)}% on ${prev.label}` : 'the first month on record'
  return `${s.posts} posts reached ${n(s.plain.reached)} people, ${reach}. ${s.verdicts.standout} stood out; ${s.delivered} of ${s.due} planned posts went out.`
}
