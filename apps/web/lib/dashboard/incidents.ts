import type { Incident, IncidentCategory } from '@/lib/types'

export interface DashboardIncidentTrendPoint {
  date: string
  incidents: number
  resolved: number
}

export interface DashboardIncidentCategoryPoint {
  category: string
  count: number
  fill: string
}

export interface DashboardIncidentSnapshot {
  activeAlerts: number
  resolvedIncidents: number
  investigatingIncidents: number
  criticalActiveIncidents: number
  recentIncidents: Incident[]
  incidentTrendData: DashboardIncidentTrendPoint[]
  categoryData: DashboardIncidentCategoryPoint[]
}

function sortIncidentsByCreatedAtDesc(incidents: Incident[]) {
  return [...incidents].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const incidentCategoryMeta: Record<
  IncidentCategory,
  { label: string; fill: string }
> = {
  application: {
    label: 'Application',
    fill: 'var(--color-chart-2)',
  },
  database: {
    label: 'Database',
    fill: 'var(--color-chart-3)',
  },
  infrastructure: {
    label: 'Infrastructure',
    fill: 'var(--color-chart-1)',
  },
  network: {
    label: 'Network',
    fill: 'var(--color-chart-4)',
  },
  security: {
    label: 'Security',
    fill: 'var(--color-chart-5)',
  },
}

function startOfDay(date: Date) {
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)
  return normalizedDate
}

function buildIncidentTrendData(
  incidents: Incident[],
): DashboardIncidentTrendPoint[] {
  const anchorTimestamp =
    incidents.reduce((latestTimestamp, incident) => {
      const createdTimestamp = new Date(incident.createdAt).getTime()
      const resolvedTimestamp = incident.resolvedAt
        ? new Date(incident.resolvedAt).getTime()
        : 0

      return Math.max(latestTimestamp, createdTimestamp, resolvedTimestamp)
    }, 0) || Date.now()

  const anchorDate = startOfDay(new Date(anchorTimestamp))
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchorDate)
    date.setDate(anchorDate.getDate() - (6 - index))

    return {
      key: date.toISOString().slice(0, 10),
      date: WEEKDAY_LABELS[date.getDay()],
      incidents: 0,
      resolved: 0,
    }
  })

  const dayLookup = new Map(days.map((day) => [day.key, day]))

  for (const incident of incidents) {
    const createdKey = incident.createdAt.slice(0, 10)
    const createdDay = dayLookup.get(createdKey)

    if (createdDay) {
      createdDay.incidents += 1
    }

    if (incident.resolvedAt) {
      const resolvedKey = incident.resolvedAt.slice(0, 10)
      const resolvedDay = dayLookup.get(resolvedKey)

      if (resolvedDay) {
        resolvedDay.resolved += 1
      }
    }
  }

  return days.map((day) => ({
    date: day.date,
    incidents: day.incidents,
    resolved: day.resolved,
  }))
}

function buildIncidentCategoryData(
  incidents: Incident[],
): DashboardIncidentCategoryPoint[] {
  const counts = new Map<IncidentCategory, number>()

  for (const incident of incidents) {
    counts.set(incident.category, (counts.get(incident.category) ?? 0) + 1)
  }

  return Object.entries(incidentCategoryMeta)
    .map(([category, meta]) => ({
      category: meta.label,
      count: counts.get(category as IncidentCategory) ?? 0,
      fill: meta.fill,
    }))
    .filter((entry) => entry.count > 0)
}

export function buildDashboardIncidentSnapshot(
  incidents: Incident[],
): DashboardIncidentSnapshot {
  const sortedIncidents = sortIncidentsByCreatedAtDesc(incidents)
  const activeIncidents = incidents.filter((incident) => incident.status !== 'resolved')
  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === 'resolved',
  )
  const investigatingIncidents = incidents.filter(
    (incident) => incident.status === 'investigating',
  )
  const criticalActiveIncidents = activeIncidents.filter(
    (incident) => incident.severity === 'critical',
  )

  return {
    activeAlerts: activeIncidents.length,
    resolvedIncidents: resolvedIncidents.length,
    investigatingIncidents: investigatingIncidents.length,
    criticalActiveIncidents: criticalActiveIncidents.length,
    recentIncidents: sortedIncidents.slice(0, 5),
    incidentTrendData: buildIncidentTrendData(incidents),
    categoryData: buildIncidentCategoryData(incidents),
  }
}
