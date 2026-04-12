import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { alertHistoryQuerySchema } from '@/lib/server/alerts/schema'
import { listStoredAlertHistory } from '@/lib/server/alerts/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = alertHistoryQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
      disposition: searchParams.get('disposition') ?? undefined,
    })

    return NextResponse.json(listStoredAlertHistory(query.limit, query.disposition))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'ALERT_HISTORY_REQUEST_INVALID',
          message: 'Alert history request is invalid.',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'ALERT_HISTORY_FETCH_FAILED',
        message: 'Unable to load alert history.',
      },
      { status: 500 },
    )
  }
}
