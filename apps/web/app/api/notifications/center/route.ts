import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { notificationCenterQuerySchema } from '@/lib/server/notifications/schema'
import { listStoredNotificationCenterItems } from '@/lib/server/notifications/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = notificationCenterQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    })

    return NextResponse.json(listStoredNotificationCenterItems(query.limit))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'NOTIFICATIONS_CENTER_REQUEST_INVALID',
          message: 'Notification center request is invalid.',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'NOTIFICATIONS_CENTER_FETCH_FAILED',
        message: 'Unable to load notification center feed.',
      },
      { status: 500 },
    )
  }
}
