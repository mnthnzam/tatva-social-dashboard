export type Format = 'Static' | 'Reel' | 'Carousel'
export type Marker = 'planned' | 'lastminute' | 'unconfirmed' | 'collab'
export type PlanStatus = 'On date' | 'Late' | 'Early' | 'Not posted' | 'Replaced' | 'Upcoming' | 'Planned'

export interface Img { src: string; w: number; h: number; from: 'meta' | 'canva' }

export interface Metrics {
  views: number; views_ads: number; views_org: number
  reach: number; reach_ads: number; reach_org: number
  inter: number; inter_ads: number; inter_org: number
  likes: number; likes_ads: number; likes_org: number
  comments: number; comments_ads: number; comments_org: number
  shares: number; shares_ads: number; shares_org: number
  saves: number; saves_ads: number; saves_org: number
  clicks: number; clicks_ads: number; clicks_org: number
  follows: number; follows_ads: number; follows_org: number
  avgPlay: number | null
}

export interface Content {
  id: string; ids: string[]; family: string; account: string
  date: string; month: string; platforms: string; crossposted: boolean
  format: Format; caption: string; metrics: Metrics
  perPlatform: Record<string, { views: number; reach: number; inter: number }>
  image: Img | null
  marker: Marker; planId: string | null; title: string; owner: string | null
  partner?: string
  evidence: string | null; note: string | null; replacesPlanId: string | null
  boosted: boolean; boostPlanned: boolean; index: number | null
  plain: Plain
  verdict: { key: VerdictKey; label: string; score: number | null } | null
  why: string
}

export type VerdictKey = 'standout' | 'steady' | 'quiet' | 'boosted'
export interface Plain { reached: number; reactions: number; passedOn: number; follows: number }
export interface Stage { key: string; label: string; available: boolean; waiting: string | null }

export interface PlanItem {
  id: string; month: string; date: string | null; title: string; bucket: string; format: Format
  platforms: string; owner: 'Zamstars' | 'Tatva'; ownerInferred: boolean; dependency: string | null
  designer: string | null; sheetStatus: string | null; boostPlanned: boolean
  concept: string | null; copy: string | null; caption: string | null; visual?: string | null
  state?: string | null
  status: PlanStatus; lag: number | null; contentId: string | null; replacedBy: string | null
  confidence: 'confirmed' | 'likely' | null; note: string | null; creative: Img | null
  needsFootage: boolean; footageDue: string | null; dueText: string | null; need: string | null
  stages?: Stage[]
}

export interface Insight { kind: string; tone: 'good' | 'warn' | 'neutral'; title: string; body: string; refs: string[] }

export interface ReportSummary {
  planned: number; due: number; delivered: number; status: Record<string, number>
  byOwner: Record<string, { due: number; delivered: number }>
  posts: number; markers: Partial<Record<Marker, number>>
  formats: Record<string, { count: number; views_org: number; median: number }>
  views_org: number; views_ads: number; reach_org: number; inter_org: number
  shares: number; saves: number; comments: number; follows: number; clicks: number
  boosted: number; unplannedViewsShare: number
  collab: { posts: number; views: number; partners: Record<string, { count: number; views: number; inter: number }> }
  stories: { count: number; views: number }
  plain: Plain; boostReach: number; verdicts: Record<VerdictKey, number>
}

export interface PlanSummary {
  planned: number; dated: number; designReady: number; needsFootage: number
  linkedin: number; boostPlanned: number; formats: Record<string, number>
}

export interface ReportMonth { id: string; label: string; year: number; kind: 'report'; summary: ReportSummary; insights: Insight[] }
export interface PlanMonth { id: string; label: string; year: number; kind: 'plan'; summary: PlanSummary; insights: Insight[] }
export type Month = ReportMonth | PlanMonth

export interface AccountMetric { value: number; change: number }
export interface AccountPlatform {
  label: string; handle: string; followers: number; followersLabel: string
  metrics: Record<string, AccountMetric>
  split: Record<string, number>
  daily: Record<string, (number | null)[]>
  note?: string
}
export interface Account {
  capturedAt: string
  period: { start: string; end: string; label: string; compare: string }
  days: string[]
  platforms: Record<'instagram' | 'facebook', AccountPlatform>
}

export interface Dataset {
  account: Account
  generatedAt: string; dataCutoff: string
  brand: { id: string; name: string; short: string; ig: string; fb: string }
  brands: { id: string; name: string; short: string; connected: boolean; reason?: string }[]
  sources: { name: string; detail: string }[]
  baselines: Record<string, { n: number; median: number }>
  typical: Record<string, Plain & { n: number }>
  months: Month[]; plan: PlanItem[]; content: Content[]
  stories: Record<string, { count: number; views: number }>
}
