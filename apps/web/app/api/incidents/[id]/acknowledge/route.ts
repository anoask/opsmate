import { NextResponse } from 'next/server'

import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { acknowledgeIncidentById } from '@/lib/server/incidents/service'
import {
  incidentLifecycleActionInputSchema,
  incidentRouteParamsSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface AcknowledgeIncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: AcknowledgeIncidentRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentLifecycleActionInputSchema.parse(
      await request.json().catch(() => ({})),
    )

    return NextResponse.json(acknowledgeIncidentById(params.id, body))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_ACKNOWLEDGE_REQUEST_INVALID',
      invalidRequestMessage: 'Acknowledge request is invalid.',
      internalErrorCode: 'INCIDENT_ACKNOWLEDGE_FAILED',
      internalErrorMessage: 'Unable to acknowledge the requested incident.',
    })
  }
}
