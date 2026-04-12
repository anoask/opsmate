import { listStoredAlertIngestsForIncident } from '@/lib/server/alerts/store'
import { getStoredIncident } from '@/lib/server/incidents/store'
import { IncidentNotFoundError } from '@/lib/server/incidents/service'
import { incidentWorkspaceEnrichmentSchema } from '@/lib/server/incidents/workspace-schema'
import { listStoredIncidentNotificationsForIncident } from '@/lib/server/notifications/store'

export function getIncidentWorkspaceEnrichment(incidentId: string) {
  const incident = getStoredIncident(incidentId)
  if (!incident) {
    throw new IncidentNotFoundError(incidentId)
  }

  const alertIngests = listStoredAlertIngestsForIncident(incident.id, 15)
  const notifications = listStoredIncidentNotificationsForIncident(incident.id, 10)

  return incidentWorkspaceEnrichmentSchema.parse({
    alertIngests,
    notifications,
  })
}
