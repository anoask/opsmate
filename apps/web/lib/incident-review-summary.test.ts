import { describe, expect, it } from 'vitest'

import {
  actionItemAddressedFraction,
  aggregateTrackedActionItems,
  getActionItemProgress,
  hasCompletedReviewWithOpenActions,
} from '@/lib/incident-review-summary'
import type { IncidentReview } from '@/lib/types'

function review(partial: Partial<IncidentReview>): IncidentReview {
  return {
    summary: '',
    rootCause: '',
    followUps: '',
    status: 'not_started',
    actionItems: [],
    ...partial,
  }
}

describe('incident review summary helpers', () => {
  it('aggregates action item counts', () => {
    const r = review({
      actionItems: [
        { id: '1', title: 'a', owner: 'o', status: 'open', dueAt: null },
        { id: '2', title: 'b', owner: 'o', status: 'done', dueAt: null },
        { id: '3', title: 'c', owner: 'o', status: 'dropped', dueAt: null },
      ],
    })
    expect(getActionItemProgress(r)).toEqual({
      total: 3,
      open: 1,
      done: 1,
      dropped: 1,
    })
    expect(actionItemAddressedFraction(r)).toBeCloseTo(2 / 3)
  })

  it('detects completed review with still-open actions', () => {
    expect(
      hasCompletedReviewWithOpenActions(
        review({
          status: 'completed',
          actionItems: [
            { id: '1', title: 'a', owner: 'o', status: 'open', dueAt: null },
          ],
        }),
      ),
    ).toBe(true)
    expect(
      hasCompletedReviewWithOpenActions(
        review({
          status: 'completed',
          actionItems: [
            { id: '1', title: 'a', owner: 'o', status: 'done', dueAt: null },
          ],
        }),
      ),
    ).toBe(false)
  })

  it('sums progress across incidents', () => {
    const incidents = [
      { review: review({ actionItems: [{ id: 'a', title: '', owner: '', status: 'open', dueAt: null }] }) },
      { review: review({ actionItems: [{ id: 'b', title: '', owner: '', status: 'done', dueAt: null }] }) },
    ] as import('@/lib/types').Incident[]
    expect(aggregateTrackedActionItems(incidents)).toEqual({
      total: 2,
      open: 1,
      done: 1,
      dropped: 0,
    })
  })
})
