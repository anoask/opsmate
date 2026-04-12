import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { resolveIncidentById } from '@/lib/server/incidents/service'
import {
  incidentLifecycleActionInputSchema,
  incidentRouteParamsSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface ResolveIncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: ResolveIncidentRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentLifecycleActionInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const actor = await requireSessionActorName()

    return NextResponse.json(resolveIncidentById(params.id, { ...body, actor }))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_RESOLVE_REQUEST_INVALID',
      invalidRequestMessage: 'Resolve request parameters are invalid.',
      internalErrorCode: 'INCIDENT_RESOLVE_FAILED',
      internalErrorMessage: 'Unable to resolve the requested incident.',
    })
  }
}
