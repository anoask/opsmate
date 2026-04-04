import type { Incident } from '@/lib/types'

export const analyticsDateRangeValues = ['24h', '7d', '30d', '90d'] as const

export type AnalyticsDateRange = (typeof analyticsDateRangeValues)[number]

export const defaultAnalyticsDateRange: AnalyticsDateRange = '7d'

export function getAnalyticsWindowStart(
  range: AnalyticsDateRange,
  now = new Date(),
) {
  const start = new Date(now)

  switch (range) {
    case '24h':
      start.setHours(start.getHours() - 24)
      break
    case '7d':
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      break
    case '30d':
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      break
    case '90d':
      start.setDate(start.getDate() - 89)
      start.setHours(0, 0, 0, 0)
      break
  }

  return start
}

export function isIncidentInDateRange(
  incident: Incident,
  range: AnalyticsDateRange,
  now = new Date(),
) {
  const start = getAnalyticsWindowStart(range, now).getTime()
  const createdAt = new Date(incident.createdAt).getTime()
  const resolvedAt = incident.resolvedAt
    ? new Date(incident.resolvedAt).getTime()
    : null

  return createdAt >= start || (resolvedAt !== null && resolvedAt >= start)
}
