import { getAuthSecret } from '@/lib/server/auth/auth-secret'
import { unsealSession } from '@/lib/server/auth/session-token'

/** Edge-safe session check for middleware (no `next/headers`). */
export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false
  }
  try {
    const secret = getAuthSecret()
    const payload = await unsealSession(token, secret)
    return payload !== null
  } catch {
    return false
  }
}
