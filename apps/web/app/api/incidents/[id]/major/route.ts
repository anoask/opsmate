import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { setMajorIncidentById } from '@/lib/server/incidents/service'
import {
  incidentMajorInputSchema,
  incidentRouteParamsSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface MajorIncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: MajorIncidentRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentMajorInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const actor = await requireSessionActorName()

    return NextResponse.json(setMajorIncidentById(params.id, { ...body, actor }))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_MAJOR_REQUEST_INVALID',
      invalidRequestMessage: 'Major incident request is invalid.',
      internalErrorCode: 'INCIDENT_MAJOR_FAILED',
      internalErrorMessage: 'Unable to update major incident flag.',
    })
  }
}
