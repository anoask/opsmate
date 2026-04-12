import { buildApiUrl } from '@/lib/config'
import type { User, UserNotificationPrefs, UserRole } from '@/lib/types'

const REQUEST_TIMEOUT_MS = 6000

class UsersApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'UsersApiError'
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      let detail = `Users request failed with status ${response.status}.`
      try {
        const errBody = (await response.json()) as { message?: string }
        if (typeof errBody.message === 'string' && errBody.message.trim()) {
          detail = errBody.message.trim()
        }
      } catch {
        // ignore parse errors
      }
      throw new UsersApiError(detail, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof UsersApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UsersApiError('Users request timed out.')
    }

    throw new UsersApiError('Unable to reach the users service.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function fetchUsers(): Promise<User[]> {
  return requestJson<User[]>('/api/users')
}

export async function patchUser(
  userId: string,
  body: {
    notificationPrefs?: Partial<UserNotificationPrefs>
    role?: UserRole
  },
): Promise<User> {
  return requestJson<User>(`/api/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function patchUserNotificationPrefs(
  userId: string,
  prefs: Partial<UserNotificationPrefs>,
): Promise<User> {
  return patchUser(userId, { notificationPrefs: prefs })
}
