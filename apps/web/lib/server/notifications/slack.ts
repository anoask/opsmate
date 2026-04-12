import { hasSlackRoutingSubscriber } from '@/lib/server/notifications/routing'
import {
  recordIncidentNotificationDeliveryAttempt,
  type StoredIncidentNotificationRecord,
} from '@/lib/server/notifications/store'

const SUPPORTED_SLACK_TYPES = new Set<StoredIncidentNotificationRecord['type']>([
  'incident_created_critical',
  'incident_assigned',
  'incident_reopened',
  'incident_resolved',
  'incident_major_updated',
])

function getSlackWebhookUrl() {
  const configured = process.env.SLACK_WEBHOOK_URL?.trim()
  return configured && configured.length > 0 ? configured : null
}

function buildSlackText(notification: StoredIncidentNotificationRecord) {
  return `*${notification.title}* - ${notification.message}\nIncident: ${notification.incidentId} (${notification.incidentSeverity})`
}

function recordDeliveryAttemptSafe(options: {
  notificationId: string
  status: 'delivered' | 'failed' | 'skipped'
  detail?: string
}) {
  try {
    recordIncidentNotificationDeliveryAttempt({
      notificationId: options.notificationId,
      channel: 'slack',
      status: options.status,
      detail: options.detail ?? null,
    })
  } catch (error) {
    console.warn('[slack] failed to record delivery outcome', {
      notificationId: options.notificationId,
      status: options.status,
      error,
    })
  }
}

export async function deliverSlackNotificationsBestEffort(
  notifications: StoredIncidentNotificationRecord[],
) {
  if (notifications.length === 0) {
    return
  }

  const webhookUrl = getSlackWebhookUrl()
  if (!webhookUrl) {
    for (const notification of notifications) {
      recordDeliveryAttemptSafe({
        notificationId: notification.id,
        status: 'skipped',
        detail: 'slack_webhook_not_configured',
      })
    }
    return
  }

  for (const notification of notifications) {
    if (!SUPPORTED_SLACK_TYPES.has(notification.type)) {
      recordDeliveryAttemptSafe({
        notificationId: notification.id,
        status: 'skipped',
        detail: `unsupported_type:${notification.type}`,
      })
      continue
    }

    if (!hasSlackRoutingSubscriber(notification.type)) {
      recordDeliveryAttemptSafe({
        notificationId: notification.id,
        status: 'skipped',
        detail: 'routing_no_subscribers_for_category',
      })
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
        recordDeliveryAttemptSafe({
          notificationId: notification.id,
          status: 'failed',
          detail: `http_status:${response.status}`,
        })
        console.warn('[slack] notification delivery failed', {
          type: notification.type,
          incidentId: notification.incidentId,
          status: response.status,
        })
        continue
      }

      recordDeliveryAttemptSafe({
        notificationId: notification.id,
        status: 'delivered',
      })
    } catch (error) {
      recordDeliveryAttemptSafe({
        notificationId: notification.id,
        status: 'failed',
        detail: 'network_error',
      })
      console.warn('[slack] notification delivery error', {
        type: notification.type,
        incidentId: notification.incidentId,
        error,
      })
    }
  }
}
