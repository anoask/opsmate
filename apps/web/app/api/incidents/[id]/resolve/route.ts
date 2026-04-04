import { NextResponse } from 'next/server'

import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { resolveIncidentById } from '@/lib/server/incidents/service'
import { incidentRouteParamsSchema } from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface ResolveIncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(_: Request, context: ResolveIncidentRouteContext) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    return NextResponse.json(resolveIncidentById(params.id))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_RESOLVE_REQUEST_INVALID',
      invalidRequestMessage: 'Resolve request parameters are invalid.',
      internalErrorCode: 'INCIDENT_RESOLVE_FAILED',
      internalErrorMessage: 'Unable to resolve the requested incident.',
    })
  }
}
