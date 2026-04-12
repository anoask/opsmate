import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { updateIncidentReviewById } from '@/lib/server/incidents/service'
import {
  incidentReviewUpdateInputSchema,
  incidentRouteParamsSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface ReviewIncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: ReviewIncidentRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentReviewUpdateInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const actor = await requireSessionActorName()

    return NextResponse.json(updateIncidentReviewById(params.id, { ...body, actor }))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_REVIEW_REQUEST_INVALID',
      invalidRequestMessage: 'Incident review request is invalid.',
      internalErrorCode: 'INCIDENT_REVIEW_FAILED',
      internalErrorMessage: 'Unable to save the incident review.',
    })
  }
}
