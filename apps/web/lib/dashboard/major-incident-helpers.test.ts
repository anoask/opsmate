import { describe, expect, it } from 'vitest'

import {
  countResolvedMajorsPendingReview,
  listActiveMajorIncidents,
} from '@/lib/dashboard/major-incident-helpers'
import type { Incident } from '@/lib/types'

function inc(partial: Partial<Incident> & Pick<Incident, 'id'>): Incident {
  return {
    source: 's',
    title: 't',
    description: 'd',
    severity: 'high',
    status: 'open',
    category: 'application',
    assignedRunbook: null,
    assignedTo: null,
    alertMergeCount: 0,
    isMajorIncident: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: 'now',
    resolvedAt: null,
    timeline: [],
    notes: [],
    review: {
      summary: '',
      rootCause: '',
      followUps: '',
      status: 'not_started',
      actionItems: [],
    },
    ...partial,
  }
}

describe('major-incident helpers', () => {
  it('lists only non-resolved majors, newest first', () => {
    const incidents = [
      inc({
        id: 'a',
        isMajorIncident: true,
        status: 'resolved',
        createdAt: '2024-01-02T00:00:00.000Z',
      }),
      inc({
        id: 'b',
        isMajorIncident: true,
        status: 'investigating',
        createdAt: '2024-01-03T00:00:00.000Z',
      }),
      inc({
        id: 'c',
        isMajorIncident: true,
        status: 'open',
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
      inc({ id: 'd', isMajorIncident: false, status: 'open' }),
    ]
    const active = listActiveMajorIncidents(incidents, 10)
    expect(active.map((i) => i.id)).toEqual(['b', 'c'])
  })

  it('counts resolved majors whose review is not completed', () => {
    const incidents = [
      inc({
        id: 'x',
        status: 'resolved',
        isMajorIncident: true,
        review: {
          summary: '',
          rootCause: '',
          followUps: '',
          status: 'draft',
          actionItems: [],
        },
      }),
      inc({
        id: 'y',
        status: 'resolved',
        isMajorIncident: true,
        review: {
          summary: 'done',
          rootCause: '',
          followUps: '',
          status: 'completed',
          actionItems: [],
        },
      }),
      inc({
        id: 'z',
        status: 'resolved',
        isMajorIncident: false,
        review: {
          summary: '',
          rootCause: '',
          followUps: '',
          status: 'draft',
          actionItems: [],
        },
      }),
    ]
    expect(countResolvedMajorsPendingReview(incidents)).toBe(1)
  })
})
