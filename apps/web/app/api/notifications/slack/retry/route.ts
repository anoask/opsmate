import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { UnauthenticatedError } from '@/lib/server/auth/errors'
import { requireSessionActorName } from '@/lib/server/auth/session'
import { ForbiddenActionError } from '@/lib/server/permissions'
import {
  NotificationReplayError,
  retrySlackNotificationDelivery,
  slackRetryRequestSchema,
} from '@/lib/server/notifications/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const parsedInput = slackRetryRequestSchema.parse(
      await request.json().catch(() => ({})),
    )
    const actor = await requireSessionActorName()
    const result = await retrySlackNotificationDelivery(parsedInput, actor)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'NOTIFICATIONS_SLACK_RETRY_REQUEST_INVALID',
          message: 'Slack retry request is invalid.',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (error instanceof NotificationReplayError) {
      return NextResponse.json(
        {
          error: 'NOTIFICATIONS_SLACK_RETRY_NOT_ALLOWED',
          message: error.message,
        },
        { status: 409 },
      )
    }

    if (error instanceof UnauthenticatedError) {
      return NextResponse.json(
        {
          error: 'NOTIFICATIONS_ACTION_UNAUTHENTICATED',
          message: error.message,
        },
        { status: 401 },
      )
    }

    if (error instanceof ForbiddenActionError) {
      return NextResponse.json(
        {
          error: 'NOTIFICATIONS_ACTION_FORBIDDEN',
          message: error.message,
        },
        { status: 403 },
      )
    }

    return NextResponse.json(
      {
        error: 'NOTIFICATIONS_SLACK_RETRY_FAILED',
        message: 'Unable to replay Slack notification delivery.',
      },
      { status: 500 },
    )
  }
}
