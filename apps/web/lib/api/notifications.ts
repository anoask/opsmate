import { buildApiUrl } from '@/lib/config'
import type { IncidentNotificationFeed } from '@/lib/types'

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
