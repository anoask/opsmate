import type { Incident, IncidentCategory } from '@/lib/types'
import {
  getAnalyticsWindowStart,
  type AnalyticsDateRange,
} from '@/lib/analytics/date-range'

export interface MetricsIncidentKpi {
  avgMttr: string
  resolvedToday: number
  activeIncidents: number
  criticalIncidents: number
}

export interface MetricsMttrPoint {
  week: string
  mttr: number
}

export interface MetricsIncidentVolumePoint {
  date: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

export interface MetricsIncidentCategoryBreakdown {
  category: string
  incidents: number
  avgMTTR: number
  resolution: number
}

export interface MetricsIncidentSnapshot {
  kpis: MetricsIncidentKpi
  mttrTrendData: MetricsMttrPoint[]
  incidentVolumeData: MetricsIncidentVolumePoint[]
  incidentCategoryBreakdown: MetricsIncidentCategoryBreakdown[]
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const categoryLabels: Record<IncidentCategory, string> = {
  application: 'Application',
  database: 'Database',
  infrastructure: 'Infrastructure',
  network: 'Network',
  security: 'Security',
}

function startOfDay(date: Date) {
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)
  return normalizedDate
}

function getAnchorTimestamp(incidents: Incident[]) {
  return (
    incidents.reduce((latestTimestamp, incident) => {
      const createdTimestamp = new Date(incident.createdAt).getTime()
      const resolvedTimestamp = incident.resolvedAt
        ? new Date(incident.resolvedAt).getTime()
        : 0

      return Math.max(latestTimestamp, createdTimestamp, resolvedTimestamp)
    }, 0) || Date.now()
  )
}

function getAnchorDate(incidents: Incident[], range: AnalyticsDateRange) {
  if (incidents.length > 0) {
    return startOfDay(new Date(getAnchorTimestamp(incidents)))
  }

  return startOfDay(new Date(getAnalyticsWindowStart(range)))
}

function getDayBuckets(incidents: Incident[], range: AnalyticsDateRange) {
  const anchorDate = getAnchorDate(incidents, range)

  const bucketCount = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90

  return Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(anchorDate)
    date.setDate(anchorDate.getDate() - (bucketCount - 1 - index))

    return {
      key: date.toISOString().slice(0, 10),
      label:
        range === '24h'
          ? 'Today'
          : bucketCount <= 7
            ? DAY_LABELS[date.getDay()]
            : `${date.getMonth() + 1}/${date.getDate()}`,
      date,
    }
  })
}

function getMttrMinutes(incident: Incident) {
  if (!incident.resolvedAt) {
    return null
  }

  const createdAt = new Date(incident.createdAt).getTime()
  const resolvedAt = new Date(incident.resolvedAt).getTime()

  if (Number.isNaN(createdAt) || Number.isNaN(resolvedAt) || resolvedAt < createdAt) {
    return null
  }

  return Math.round((resolvedAt - createdAt) / 60000)
}

function buildKpis(
  incidents: Incident[],
  range: AnalyticsDateRange,
): MetricsIncidentKpi {
  const resolvedIncidents = incidents.filter((incident) => incident.status === 'resolved')
  const resolvedMttrValues = resolvedIncidents
    .map(getMttrMinutes)
    .filter((value): value is number => value !== null)

  const anchorDateKey = getAnchorDate(incidents, range)
    .toISOString()
    .slice(0, 10)

  return {
    avgMttr: resolvedMttrValues.length
      ? `${Math.round(
          resolvedMttrValues.reduce((sum, value) => sum + value, 0) /
            resolvedMttrValues.length,
        )}m`
      : 'N/A',
    resolvedToday: resolvedIncidents.filter(
      (incident) => incident.resolvedAt?.slice(0, 10) === anchorDateKey,
    ).length,
    activeIncidents: incidents.filter((incident) => incident.status !== 'resolved').length,
    criticalIncidents: incidents.filter(
      (incident) =>
        incident.status !== 'resolved' && incident.severity === 'critical',
    ).length,
  }
}

function buildMttrTrendData(
  incidents: Incident[],
  range: AnalyticsDateRange,
): MetricsMttrPoint[] {
  const buckets = getDayBuckets(incidents, range).map((bucket) => ({
    key: bucket.key,
    week: bucket.label,
    values: [] as number[],
  }))

  const bucketLookup = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const incident of incidents) {
    if (!incident.resolvedAt) {
      continue
    }

    const mttr = getMttrMinutes(incident)
    const bucket = bucketLookup.get(incident.resolvedAt.slice(0, 10))

    if (mttr !== null && bucket) {
      bucket.values.push(mttr)
    }
  }

  return buckets.map((bucket) => ({
    week: bucket.week,
    mttr: bucket.values.length
      ? Math.round(
          bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length,
        )
      : 0,
  }))
}

function buildIncidentVolumeData(
  incidents: Incident[],
  range: AnalyticsDateRange,
): MetricsIncidentVolumePoint[] {
  const buckets = getDayBuckets(incidents, range).map((bucket) => ({
    key: bucket.key,
    date: bucket.label,
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }))

  const bucketLookup = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const incident of incidents) {
    const bucket = bucketLookup.get(incident.createdAt.slice(0, 10))

    if (!bucket) {
      continue
    }

    bucket.total += 1
    bucket[incident.severity] += 1
  }

  return buckets.map((bucket) => ({
    date: bucket.date,
    total: bucket.total,
    critical: bucket.critical,
    high: bucket.high,
    medium: bucket.medium,
    low: bucket.low,
  }))
}

function buildIncidentCategoryBreakdown(
  incidents: Incident[],
): MetricsIncidentCategoryBreakdown[] {
  const categories = Object.keys(categoryLabels) as IncidentCategory[]

  return categories
    .map((category) => {
      const categoryIncidents = incidents.filter(
        (incident) => incident.category === category,
      )

      const resolvedCategoryIncidents = categoryIncidents.filter(
        (incident) => incident.status === 'resolved',
      )

      const mttrValues = resolvedCategoryIncidents
        .map(getMttrMinutes)
        .filter((value): value is number => value !== null)

      return {
        category: categoryLabels[category],
        incidents: categoryIncidents.length,
        avgMTTR: mttrValues.length
          ? Math.round(
              mttrValues.reduce((sum, value) => sum + value, 0) / mttrValues.length,
            )
          : 0,
        resolution: categoryIncidents.length
          ? Math.round((resolvedCategoryIncidents.length / categoryIncidents.length) * 100)
          : 0,
      }
    })
    .filter((entry) => entry.incidents > 0)
}

export function buildMetricsIncidentSnapshot(
  incidents: Incident[],
  range: AnalyticsDateRange,
): MetricsIncidentSnapshot {
  return {
    kpis: buildKpis(incidents, range),
    mttrTrendData: buildMttrTrendData(incidents, range),
    incidentVolumeData: buildIncidentVolumeData(incidents, range),
    incidentCategoryBreakdown: buildIncidentCategoryBreakdown(incidents),
  }
}
