import {
  getStoredIncident,
  listStoredIncidents,
  saveStoredIncident,
} from '@/lib/server/incidents/store'
import {
  type IncidentListQuery,
  incidentRouteParamsSchema,
  incidentDtoSchema,
  incidentsListDtoSchema,
  type IncidentDto,
} from '@/lib/server/incidents/schema'

export class IncidentNotFoundError extends Error {
  constructor(id: string) {
    super(`Incident ${id} was not found.`)
    this.name = 'IncidentNotFoundError'
  }
}

function formatTimelineTimestamp(date: Date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

function createResolvedIncident(incident: IncidentDto) {
  if (incident.status === 'resolved') {
    return incident
  }

  const now = new Date()
  const resolvedAt = now.toISOString()

  return {
    ...incident,
    status: 'resolved' as const,
    updatedAt: 'Just now',
    resolvedAt,
    timeline: [
      ...incident.timeline,
      {
        id: `resolved-${incident.id}-${now.getTime()}`,
        timestamp: formatTimelineTimestamp(now),
        type: 'resolved' as const,
        description: 'Incident resolved from OpsMate API',
        user: 'OpsMate',
      },
    ],
  }
}

export function listIncidents(query?: IncidentListQuery) {
  return incidentsListDtoSchema.parse(listStoredIncidents(query))
}

export function getIncidentById(id: string) {
  const parsedParams = incidentRouteParamsSchema.parse({ id })
  const incident = getStoredIncident(parsedParams.id)

  if (!incident) {
    throw new IncidentNotFoundError(parsedParams.id)
  }

  return incidentDtoSchema.parse(incident)
}

export function resolveIncidentById(id: string) {
  const incident = getIncidentById(id)
  const resolvedIncident = createResolvedIncident(incident)

  return incidentDtoSchema.parse(saveStoredIncident(resolvedIncident))
}
