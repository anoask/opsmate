import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { incidentNotificationsQuerySchema } from '@/lib/server/notifications/schema'
import { listStoredIncidentNotifications } from '@/lib/server/notifications/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = incidentNotificationsQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    })

    return NextResponse.json(listStoredIncidentNotifications(query.limit))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'NOTIFICATIONS_REQUEST_INVALID',
          message: 'Notifications request is invalid.',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'NOTIFICATIONS_FETCH_FAILED',
        message: 'Unable to load notifications.',
      },
      { status: 500 },
    )
  }
}
