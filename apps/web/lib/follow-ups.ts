import type { Incident, IncidentReviewActionItem } from '@/lib/types'

function startOfLocalDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** True if `dueAt` is before the start of the local calendar day for `now` (strictly overdue). */
export function isReviewActionDueOverdue(
  dueAt: string | null,
  now: Date = new Date(),
): boolean {
  if (!dueAt?.trim()) {
    return false
  }
  const t = Date.parse(dueAt)
  if (Number.isNaN(t)) {
    return false
  }
  return t < startOfLocalDay(now)
}

export function countOverdueOpenReviewActionItems(
  incidents: Incident[],
  now?: Date,
): number {
  return collectOpenReviewActionItems(incidents).filter((row) =>
    isReviewActionDueOverdue(row.actionItem.dueAt, now),
  ).length
}

/** Flattened open action item with parent incident context (from review_json). */
export interface OpenReviewActionItemRow {
  actionItem: IncidentReviewActionItem
  incidentId: string
  incidentTitle: string
  incidentSeverity: Incident['severity']
  incidentStatus: Incident['status']
  incidentIsMajor: boolean
}

function dueSortKey(dueAt: string | null): number {
  if (!dueAt) return Number.POSITIVE_INFINITY
  const t = Date.parse(dueAt)
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t
}

/**
 * Collect action items with status `open` from each incident's post-incident review.
 * Sorted by due date (soonest first, missing due last), then incident id, then item id.
 */
export function collectOpenReviewActionItems(
  incidents: Incident[],
): OpenReviewActionItemRow[] {
  const rows: OpenReviewActionItemRow[] = []

  for (const incident of incidents) {
    const items = incident.review?.actionItems ?? []
    for (const actionItem of items) {
      if (actionItem.status !== 'open') continue
      rows.push({
        actionItem,
        incidentId: incident.id,
        incidentTitle: incident.title,
        incidentSeverity: incident.severity,
        incidentStatus: incident.status,
        incidentIsMajor: incident.isMajorIncident,
      })
    }
  }

  rows.sort((a, b) => {
    const da = dueSortKey(a.actionItem.dueAt)
    const db = dueSortKey(b.actionItem.dueAt)
    if (da !== db) return da - db
    const idCmp = a.incidentId.localeCompare(b.incidentId)
    if (idCmp !== 0) return idCmp
    return a.actionItem.id.localeCompare(b.actionItem.id)
  })

  return rows
}
