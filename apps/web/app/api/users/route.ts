import { NextResponse } from 'next/server'

import { listStoredUsers } from '@/lib/server/users/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(listStoredUsers())
  } catch {
    return NextResponse.json(
      {
        error: 'USERS_FETCH_FAILED',
        message: 'Unable to load users.',
      },
      { status: 500 },
    )
  }
}
