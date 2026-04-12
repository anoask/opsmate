import { buildApiUrl } from '@/lib/config'
import type {
  AlertActivityFeed,
  AlertHistoryFeed,
  AlertIngestDisposition,
} from '@/lib/types'

const REQUEST_TIMEOUT_MS = 6000

class AlertsApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'AlertsApiError'
  }
}

export async function getAlertActivity(limit = 10): Promise<AlertActivityFeed> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl(`/api/alerts/activity?limit=${limit}`), {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new AlertsApiError(
        `Alert activity request failed with status ${response.status}.`,
        response.status,
      )
    }

    return (await response.json()) as AlertActivityFeed
  } catch (error) {
    if (error instanceof AlertsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AlertsApiError('Alert activity request timed out.')
    }

    throw new AlertsApiError('Unable to reach the alert activity service.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function getAlertHistory(
  limit = 20,
  disposition?: AlertIngestDisposition,
): Promise<AlertHistoryFeed> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const query = new URLSearchParams({
      limit: String(limit),
    })
    if (disposition) {
      query.set('disposition', disposition)
    }
    const response = await fetch(
      buildApiUrl(`/api/alerts/history?${query.toString()}`),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      throw new AlertsApiError(
        `Alert history request failed with status ${response.status}.`,
        response.status,
      )
    }

    return (await response.json()) as AlertHistoryFeed
  } catch (error) {
    if (error instanceof AlertsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AlertsApiError('Alert history request timed out.')
    }

    throw new AlertsApiError('Unable to reach the alert history service.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}
