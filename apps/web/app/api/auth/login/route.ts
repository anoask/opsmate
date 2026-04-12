import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

import { setSessionCookie } from '@/lib/server/auth/session'
import { getStoredUserById } from '@/lib/server/users/store'

export const dynamic = 'force-dynamic'

const loginBodySchema = z.object({
  userId: z.string().trim().min(1),
})

export async function POST(request: Request) {
  try {
    const body = loginBodySchema.parse(await request.json().catch(() => ({})))
    const user = getStoredUserById(body.userId)

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        {
          error: 'LOGIN_INVALID_USER',
          message: 'That user is not available to sign in.',
        },
        { status: 400 },
      )
    }

    await setSessionCookie(user.id)

    return NextResponse.json({ ok: true, user })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'LOGIN_INVALID', message: 'Invalid sign-in request.', details: error.flatten() },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'LOGIN_FAILED', message: 'Unable to sign in right now.' },
      { status: 500 },
    )
  }
}
