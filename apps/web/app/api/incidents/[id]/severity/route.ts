import { NextResponse } from 'next/server'

import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { changeIncidentSeverityById } from '@/lib/server/incidents/service'
import {
  incidentRouteParamsSchema,
  incidentSeverityChangeInputSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface ChangeIncidentSeverityRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: ChangeIncidentSeverityRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentSeverityChangeInputSchema.parse(
      await request.json().catch(() => ({})),
    )

    return NextResponse.json(changeIncidentSeverityById(params.id, body))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_SEVERITY_REQUEST_INVALID',
      invalidRequestMessage: 'Severity change request is invalid.',
      internalErrorCode: 'INCIDENT_SEVERITY_CHANGE_FAILED',
      internalErrorMessage: 'Unable to change the requested incident severity.',
    })
  }
}
