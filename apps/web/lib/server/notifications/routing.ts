import { listStoredUsers } from '@/lib/server/users/store'
import type { IncidentNotification, UserNotificationPrefs } from '@/lib/types'

const SYSTEM_USER_ID = 'sys-opsmate-bot'

/** Maps notification types to the user preference that gates Slack fan-out. */
const NOTIFICATION_TYPE_PREF: Partial<
  Record<IncidentNotification['type'], keyof UserNotificationPrefs>
> = {
  incident_created_critical: 'notifyOnCritical',
  incident_assigned: 'notifyOnAssignment',
  incident_resolved: 'notifyOnLifecycle',
  incident_reopened: 'notifyOnLifecycle',
  incident_major_updated: 'notifyOnLifecycle',
}

/**
 * True if at least one active (non-system) user has the matching pref enabled.
 * Used to decide whether to post to the shared Slack webhook for this category.
 */
export function hasSlackRoutingSubscriber(
  notificationType: IncidentNotification['type'],
): boolean {
  const prefKey = NOTIFICATION_TYPE_PREF[notificationType]
  if (!prefKey) {
    return false
  }

  const users = listStoredUsers()
  return users.some(
    (u) =>
      u.status === 'active' &&
      u.id !== SYSTEM_USER_ID &&
      u.notificationPrefs[prefKey] === true,
  )
}
