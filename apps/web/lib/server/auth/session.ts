import { cookies } from 'next/headers'

import { getAuthSecret } from '@/lib/server/auth/auth-secret'
import { UnauthenticatedError } from '@/lib/server/auth/errors'
import { sealSession, unsealSession } from '@/lib/server/auth/session-token'
import { SESSION_COOKIE_NAME } from '@/lib/server/auth/constants'
import { getStoredUserById } from '@/lib/server/users/store'

export { SESSION_COOKIE_NAME }

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export async function readSessionPayloadFromToken(token: string) {
  const secret = getAuthSecret()
  return unsealSession(token, secret)
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return null
  }
  const payload = await readSessionPayloadFromToken(token)
  return payload?.userId ?? null
}

/**
 * For GET /api/auth/session only: drop the cookie when a value is present but fails verify/expiry.
 */
export async function getSessionUserIdClearingStaleCookie(): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return null
  }
  const payload = await readSessionPayloadFromToken(token)
  if (!payload) {
    await clearSessionCookie()
    return null
  }
  return payload.userId
}

export async function requireSessionUserId(): Promise<string> {
  const id = await getSessionUserId()
  if (!id) {
    throw new UnauthenticatedError()
  }
  return id
}

export async function requireSessionActorName(): Promise<string> {
  const userId = await requireSessionUserId()
  const user = getStoredUserById(userId)
  if (!user || user.status !== 'active') {
    throw new UnauthenticatedError('Your account is not available. Sign in again.')
  }
  return user.name
}

export async function setSessionCookie(userId: string) {
  const secret = getAuthSecret()
  const token = await sealSession(userId, secret, SESSION_MAX_AGE_SEC)
  const jar = await cookies()
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
