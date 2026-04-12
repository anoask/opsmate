import { z } from 'zod'

import { assertActorPermission } from '@/lib/server/permissions'
import { deliverSlackNotificationsBestEffort } from '@/lib/server/notifications/slack'
import {
  getLatestSlackDeliveryAttempt,
  getStoredIncidentNotificationById,
  listFailedSlackNotificationIds,
} from '@/lib/server/notifications/store'

export class NotificationReplayError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotificationReplayError'
  }
}

export const slackRetryRequestSchema = z.object({
  notificationId: z.string().trim().min(1).optional(),
  retryFailedLimit: z.coerce.number().int().min(1).max(25).optional(),
})

export type SlackRetryRequest = z.infer<typeof slackRetryRequestSchema>

export async function retrySlackNotificationDelivery(
  input: SlackRetryRequest,
  actor: string,
) {
  assertActorPermission(actor, 'notifications:replay')

  if (input.notificationId) {
    const notification = getStoredIncidentNotificationById(input.notificationId)
    if (!notification) {
      throw new NotificationReplayError(
        `Notification ${input.notificationId} was not found.`,
      )
    }

    const latestAttempt = getLatestSlackDeliveryAttempt(notification.id)
    if (latestAttempt?.status !== 'failed') {
      throw new NotificationReplayError(
        `Notification ${notification.id} is not currently in failed slack status.`,
      )
    }

    await deliverSlackNotificationsBestEffort([notification])
    return {
      attempted: 1,
      mode: 'single' as const,
    }
  }

  const retryLimit = input.retryFailedLimit ?? 5
  const failedIds = listFailedSlackNotificationIds(retryLimit)
  if (failedIds.length === 0) {
    return {
      attempted: 0,
      mode: 'batch' as const,
    }
  }

  const notifications = failedIds
    .map((id) => getStoredIncidentNotificationById(id))
    .filter((record): record is NonNullable<typeof record> => Boolean(record))

  if (notifications.length === 0) {
    return {
      attempted: 0,
      mode: 'batch' as const,
    }
  }

  await deliverSlackNotificationsBestEffort(notifications)
  return {
    attempted: notifications.length,
    mode: 'batch' as const,
  }
}
