import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { reopenIncidentById } from '@/lib/server/incidents/service'
import {
  incidentLifecycleActionInputSchema,
  incidentRouteParamsSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface ReopenIncidentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: ReopenIncidentRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentLifecycleActionInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const actor = await requireSessionActorName()

    return NextResponse.json(reopenIncidentById(params.id, { ...body, actor }))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_REOPEN_REQUEST_INVALID',
      invalidRequestMessage: 'Reopen request is invalid.',
      internalErrorCode: 'INCIDENT_REOPEN_FAILED',
      internalErrorMessage: 'Unable to reopen the requested incident.',
    })
  }
}
