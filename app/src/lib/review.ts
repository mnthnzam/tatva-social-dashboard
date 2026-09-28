import { useCallback, useEffect, useState } from 'react'
import type { PlanItem } from '../types'
import { DATA } from './data'
import { day } from './format'

/**
 * Prototype review store. Decisions live in this browser only (localStorage), so they are
 * not shared with anyone yet — the hosted version moves this to the database.
 */
export type Decision = 'approved' | 'changes'
export interface StageReview { decision: Decision; comment: string; by: string; at: string }
export type Reviews = Record<string, StageReview> // key: `${planId}|${stageKey}`

const KEY = 'tatva-reviews-v1'
const NAME_KEY = 'tatva-reviewer'
const EVT = 'tatva-reviews-changed'

function load(): Reviews {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Reviews
  } catch {
    return {}
  }
}
function save(r: Reviews) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* private mode: keep in memory only */
  }
  memory = r
  window.dispatchEvent(new Event(EVT))
}
let memory: Reviews = load()

export function useReviews() {
  const [reviews, setReviews] = useState<Reviews>(memory)
  useEffect(() => {
    const on = () => setReviews({ ...memory })
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])
  const decide = useCallback((p: PlanItem, stageKeys: string[], decision: Decision, comment: string, by: string) => {
    const next = { ...memory }
    const at = new Date().toISOString()
    for (const k of stageKeys) next[`${p.id}|${k}`] = { decision, comment, by, at }
    save(next)
  }, [])
  const undo = useCallback((p: PlanItem, stageKeys: string[]) => {
    const next = { ...memory }
    for (const k of stageKeys) delete next[`${p.id}|${k}`]
    save(next)
  }, [])
  const reset = useCallback(() => save({}), [])
  return { reviews, decide, undo, reset }
}

export function useReviewerName(): [string, (s: string) => void] {
  const [name, setName] = useState<string>(() => {
    try {
      return localStorage.getItem(NAME_KEY) || ''
    } catch {
      return ''
    }
  })
  const set = (s: string) => {
    setName(s)
    try {
      localStorage.setItem(NAME_KEY, s)
    } catch {
      /* ignore */
    }
  }
  return [name, set]
}

export type PostState = 'waiting' | 'approved' | 'changes' | 'partial' | 'notready'

/** Where a post stands for the reviewer: which stages they can act on now, and the overall state. */
export function postState(p: PlanItem, reviews: Reviews) {
  const stages = p.stages ?? []
  const withReview = stages.map((s) => ({ ...s, review: reviews[`${p.id}|${s.key}`] }))
  const actionable = withReview.filter((s) => s.available && !s.review)
  const changes = withReview.filter((s) => s.review?.decision === 'changes')
  const approved = withReview.filter((s) => s.review?.decision === 'approved')
  let state: PostState
  if (changes.length) state = 'changes'
  else if (actionable.length) state = 'waiting'
  else if (approved.length === stages.length && stages.length) state = 'approved'
  else if (approved.length) state = 'partial'
  else state = 'notready'
  return { stages: withReview, actionable, state }
}

export function monthReviewSummary(plan: PlanItem[], reviews: Reviews) {
  const counts = { waiting: 0, approved: 0, changes: 0, partial: 0, notready: 0 }
  for (const p of plan) counts[postState(p, reviews).state]++
  return counts
}

/** Plain-text summary a reviewer can paste into WhatsApp or email. */
export function feedbackText(monthLabel: string, plan: PlanItem[], reviews: Reviews, by: string) {
  const lines: string[] = [`${DATA.brand.name} · ${monthLabel} content review${by ? ` · ${by}` : ''}`, '']
  const changes: string[] = []
  const ok: string[] = []
  for (const p of plan) {
    // group stages decided together (same decision + comment) into one line per post
    const groups = new Map<string, { r: StageReview; labels: string[] }>()
    for (const s of p.stages ?? []) {
      const r = reviews[`${p.id}|${s.key}`]
      if (!r) continue
      const k = `${r.decision}|${r.comment}`
      const g = groups.get(k) ?? { r, labels: [] }
      g.labels.push(s.label.toLowerCase())
      groups.set(k, g)
    }
    for (const { r, labels } of groups.values()) {
      const tag = `${day(p.date)} · ${p.title} (${labels.join(' + ')})`
      if (r.decision === 'changes') changes.push(`• ${tag}\n  ${r.comment || 'Changes requested'}`)
      else ok.push(`• ${tag}${r.comment ? ` — ${r.comment}` : ''}`)
    }
  }
  if (changes.length) lines.push(`CHANGES REQUESTED (${changes.length})`, ...changes, '')
  if (ok.length) lines.push(`APPROVED (${ok.length})`, ...ok, '')
  const pending = plan.filter((p) => postState(p, reviews).state === 'waiting').length
  if (pending) lines.push(`Still to review: ${pending}`)
  return lines.join('\n').trim()
}
