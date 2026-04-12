import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { assignIncidentById } from '@/lib/server/incidents/service'
import {
  incidentAssignInputSchema,
  incidentRouteParamsSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface AssignIncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: AssignIncidentRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentAssignInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const actor = await requireSessionActorName()

    return NextResponse.json(assignIncidentById(params.id, { ...body, actor }))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_ASSIGN_REQUEST_INVALID',
      invalidRequestMessage: 'Assign request is invalid.',
      internalErrorCode: 'INCIDENT_ASSIGN_FAILED',
      internalErrorMessage: 'Unable to assign the requested incident.',
    })
  }
}
