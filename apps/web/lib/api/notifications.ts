import { buildApiUrl } from '@/lib/config'
import type { IncidentNotificationFeed, NotificationCenterFeed } from '@/lib/types'

const REQUEST_TIMEOUT_MS = 6000

class NotificationsApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'NotificationsApiError'
  }
}

export async function getNotificationFeed(limit = 8): Promise<IncidentNotificationFeed> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl(`/api/notifications?limit=${limit}`), {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new NotificationsApiError(
        `Notifications request failed with status ${response.status}.`,
        response.status,
      )
    }

    return (await response.json()) as IncidentNotificationFeed
  } catch (error) {
    if (error instanceof NotificationsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new NotificationsApiError('Notifications request timed out.')
    }

    throw new NotificationsApiError('Unable to reach the notifications service.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function getNotificationCenterFeed(
  limit = 30,
): Promise<NotificationCenterFeed> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl(`/api/notifications/center?limit=${limit}`), {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new NotificationsApiError(
        `Notification center request failed with status ${response.status}.`,
        response.status,
      )
    }

    return (await response.json()) as NotificationCenterFeed
  } catch (error) {
    if (error instanceof NotificationsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new NotificationsApiError('Notification center request timed out.')
    }

    throw new NotificationsApiError('Unable to reach the notification center service.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function retrySlackNotification(notificationId: string) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl('/api/notifications/slack/retry'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new NotificationsApiError(
        `Slack retry request failed with status ${response.status}.`,
        response.status,
      )
    }
  } catch (error) {
    if (error instanceof NotificationsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new NotificationsApiError('Slack retry request timed out.')
    }

    throw new NotificationsApiError('Unable to replay Slack delivery.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function retryRecentFailedSlackNotifications(limit = 5) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl('/api/notifications/slack/retry'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ retryFailedLimit: limit }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new NotificationsApiError(
        `Slack batch retry request failed with status ${response.status}.`,
        response.status,
      )
    }
  } catch (error) {
    if (error instanceof NotificationsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new NotificationsApiError('Slack batch retry request timed out.')
    }

    throw new NotificationsApiError('Unable to replay recent failed Slack deliveries.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}
