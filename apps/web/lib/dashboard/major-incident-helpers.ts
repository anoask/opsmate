import type { Incident } from '@/lib/types'

export function listActiveMajorIncidents(
  incidents: Incident[],
  limit = 6,
): Incident[] {
  return incidents
    .filter((i) => i.status !== 'resolved' && i.isMajorIncident)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit)
}

export function countResolvedMajorsPendingReview(incidents: Incident[]): number {
  return incidents.filter(
    (i) =>
      i.status === 'resolved' &&
      i.isMajorIncident &&
      i.review.status !== 'completed',
  ).length
}
