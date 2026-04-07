import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { alertActivityQuerySchema } from '@/lib/server/alerts/schema'
import { listStoredAlertActivity } from '@/lib/server/alerts/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = alertActivityQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    })

    return NextResponse.json(listStoredAlertActivity(query.limit))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'ALERT_ACTIVITY_REQUEST_INVALID',
          message: 'Alert activity request is invalid.',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'ALERT_ACTIVITY_FETCH_FAILED',
        message: 'Unable to load alert activity.',
      },
      { status: 500 },
    )
  }
}
