import type { Incident, IncidentReview } from '@/lib/types'

export interface ActionItemProgress {
  total: number
  open: number
  done: number
  dropped: number
}

export function getActionItemProgress(review: IncidentReview): ActionItemProgress {
  const items = review.actionItems ?? []
  let open = 0
  let done = 0
  let dropped = 0
  for (const row of items) {
    if (row.status === 'open') open += 1
    else if (row.status === 'done') done += 1
    else dropped += 1
  }
  return { total: items.length, open, done, dropped }
}

/** Addressed = done + dropped (no longer open). */
export function actionItemAddressedFraction(review: IncidentReview): number {
  const p = getActionItemProgress(review)
  if (p.total === 0) return 0
  return (p.done + p.dropped) / p.total
}

export function hasCompletedReviewWithOpenActions(review: IncidentReview): boolean {
  return review.status === 'completed' && getActionItemProgress(review).open > 0
}

export function aggregateTrackedActionItems(incidents: Incident[]): ActionItemProgress {
  let total = 0
  let open = 0
  let done = 0
  let dropped = 0
  for (const incident of incidents) {
    const p = getActionItemProgress(incident.review)
    total += p.total
    open += p.open
    done += p.done
    dropped += p.dropped
  }
  return { total, open, done, dropped }
}
