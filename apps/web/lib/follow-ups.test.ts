import { describe, expect, it } from 'vitest'

import {
  collectOpenReviewActionItems,
  countOverdueOpenReviewActionItems,
  isReviewActionDueOverdue,
} from '@/lib/follow-ups'
import type { Incident } from '@/lib/types'

function minimalIncident(
  id: string,
  review: Incident['review'],
): Incident {
  return {
    id,
    source: 's',
    title: 't',
    description: 'd',
    severity: 'high',
    status: 'resolved',
    category: 'application',
    assignedRunbook: null,
    assignedTo: null,
    alertMergeCount: 0,
    isMajorIncident: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: 'now',
    resolvedAt: '2024-01-02T00:00:00.000Z',
    timeline: [],
    notes: [],
    review,
  }
}

describe('follow-ups helpers', () => {
  it('treats overdue as strictly before local start of day', () => {
    const now = new Date('2026-04-08T12:00:00Z')
    expect(isReviewActionDueOverdue('2000-06-01', now)).toBe(true)
    expect(isReviewActionDueOverdue('2099-12-31', now)).toBe(false)
    expect(isReviewActionDueOverdue(null, now)).toBe(false)
    expect(isReviewActionDueOverdue('', now)).toBe(false)
  })

  it('collects and sorts open action items by due date', () => {
    const incidents = [
      minimalIncident('i2', {
        summary: '',
        rootCause: '',
        followUps: '',
        status: 'draft',
        actionItems: [
          {
            id: 'later',
            title: '',
            owner: '',
            status: 'open',
            dueAt: '2026-04-10',
          },
        ],
      }),
      minimalIncident('i1', {
        summary: '',
        rootCause: '',
        followUps: '',
        status: 'draft',
        actionItems: [
          {
            id: 'sooner',
            title: '',
            owner: '',
            status: 'open',
            dueAt: '2026-04-09',
          },
          {
            id: 'nodue',
            title: '',
            owner: '',
            status: 'open',
            dueAt: null,
          },
        ],
      }),
    ]
    const rows = collectOpenReviewActionItems(incidents)
    expect(rows.map((r) => r.actionItem.id)).toEqual(['sooner', 'later', 'nodue'])
  })

  it('counts overdue open items', () => {
    const now = new Date('2026-04-08T12:00:00Z')
    const incidents = [
      minimalIncident('a', {
        summary: '',
        rootCause: '',
        followUps: '',
        status: 'draft',
        actionItems: [
          {
            id: '1',
            title: '',
            owner: '',
            status: 'open',
            dueAt: '2000-01-01',
          },
          {
            id: '2',
            title: '',
            owner: '',
            status: 'open',
            dueAt: '2099-06-01',
          },
        ],
      }),
    ]
    expect(countOverdueOpenReviewActionItems(incidents, now)).toBe(1)
  })
})
