import { NextResponse } from 'next/server'

import {
  clearSessionCookie,
  getSessionUserIdClearingStaleCookie,
} from '@/lib/server/auth/session'
import { getStoredUserById } from '@/lib/server/users/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getSessionUserIdClearingStaleCookie()
  if (!userId) {
    return NextResponse.json({ user: null })
  }

  const user = getStoredUserById(userId)
  if (!user || user.status !== 'active') {
    await clearSessionCookie()
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({ user })
}
