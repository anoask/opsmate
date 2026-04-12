import type { IncidentNotificationType, SlackDeliveryStatus } from '@/lib/types'

export const incidentNotificationTypeLabels: Record<IncidentNotificationType, string> = {
  incident_created_critical: 'Critical created',
  incident_assigned: 'Assignment',
  incident_reopened: 'Reopened',
  incident_resolved: 'Resolved',
  incident_major_updated: 'Major flag',
}

export const slackDeliveryStatusLabels: Record<SlackDeliveryStatus, string> = {
  delivered: 'Slack delivered',
  failed: 'Slack failed',
  skipped: 'Slack skipped',
  not_attempted: 'Slack not sent yet',
}

/** Badge styles aligned with incident / alert language (outline + tint). */
export const slackDeliveryStatusBadgeClassName: Record<SlackDeliveryStatus, string> = {
  delivered:
    'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  failed: 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200',
  skipped:
    'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200',
  not_attempted: 'border-border/60 bg-secondary/50 text-muted-foreground',
}

export function formatSlackDeliveryDetail(detail: string | null): string | null {
  if (!detail?.trim()) {
    return null
  }
  if (detail === 'routing_no_subscribers_for_category') {
    return 'No teammate has this notification category enabled for Slack.'
  }
  if (detail === 'slack_webhook_not_configured') {
    return 'Slack webhook URL is not configured.'
  }
  if (detail === 'network_error') {
    return 'Network error calling Slack.'
  }
  if (detail.startsWith('unsupported_type:')) {
    const rest = detail.slice('unsupported_type:'.length)
    return `Slack does not handle this notification type (${rest || 'unknown'}).`
  }
  if (detail.startsWith('http_status:')) {
    const code = detail.slice('http_status:'.length)
    return `Slack webhook returned HTTP ${code}.`
  }
  return detail
}

export function slackRetryHint(item: {
  slackDeliveryStatus: SlackDeliveryStatus
  retryEligible: boolean
}): string | null {
  if (item.retryEligible) {
    return null
  }
  if (item.slackDeliveryStatus === 'failed') {
    return 'Slack failed but retry is not offered — refresh or check delivery history.'
  }
  if (item.slackDeliveryStatus === 'skipped') {
    return 'Skipped deliveries are not retried; fix webhook or routing and wait for new events.'
  }
  if (item.slackDeliveryStatus === 'delivered') {
    return 'Already delivered to Slack.'
  }
  return 'Slack has not been attempted for this notification yet.'
}
