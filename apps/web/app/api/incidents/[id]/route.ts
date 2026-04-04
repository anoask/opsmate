import { NextResponse } from 'next/server'

import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { getIncidentById } from '@/lib/server/incidents/service'
import { incidentRouteParamsSchema } from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface IncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, context: IncidentRouteContext) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    return NextResponse.json(getIncidentById(params.id))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_REQUEST_INVALID',
      invalidRequestMessage: 'Incident request parameters are invalid.',
      internalErrorCode: 'INCIDENT_FETCH_FAILED',
      internalErrorMessage: 'Unable to load the requested incident.',
    })
  }
}
