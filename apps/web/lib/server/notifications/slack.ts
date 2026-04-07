import type { StoredIncidentNotificationRecord } from '@/lib/server/notifications/store'

const SUPPORTED_SLACK_TYPES = new Set<StoredIncidentNotificationRecord['type']>([
  'incident_created_critical',
  'incident_assigned',
  'incident_reopened',
  'incident_resolved',
])

function getSlackWebhookUrl() {
  const configured = process.env.SLACK_WEBHOOK_URL?.trim()
  return configured && configured.length > 0 ? configured : null
}

function buildSlackText(notification: StoredIncidentNotificationRecord) {
  return `*${notification.title}* - ${notification.message}\nIncident: ${notification.incidentId} (${notification.incidentSeverity})`
}

export async function deliverSlackNotificationsBestEffort(
  notifications: StoredIncidentNotificationRecord[],
) {
  if (notifications.length === 0) {
    return
  }

  const webhookUrl = getSlackWebhookUrl()
  if (!webhookUrl) {
    return
  }

  for (const notification of notifications) {
    if (!SUPPORTED_SLACK_TYPES.has(notification.type)) {
      continue
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: buildSlackText(notification),
        }),
      })

      if (!response.ok) {
        console.warn('[slack] notification delivery failed', {
          type: notification.type,
          incidentId: notification.incidentId,
          status: response.status,
        })
      }
    } catch (error) {
      console.warn('[slack] notification delivery error', {
        type: notification.type,
        incidentId: notification.incidentId,
        error,
      })
    }
  }
}
