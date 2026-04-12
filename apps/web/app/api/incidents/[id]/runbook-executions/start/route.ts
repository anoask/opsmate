import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleRunbookRouteError } from '@/lib/server/runbooks/http'
import { incidentRouteParamsSchema } from '@/lib/server/incidents/schema'
import { startRunbookExecutionForIncident } from '@/lib/server/runbooks/service'

export const dynamic = 'force-dynamic'

interface IncidentRunbookExecutionStartRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  request: Request,
  context: IncidentRunbookExecutionStartRouteContext,
) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    void (await request.json().catch(() => ({})))
    const startedBy = await requireSessionActorName()

    return NextResponse.json(
      startRunbookExecutionForIncident(params.id, startedBy),
    )
  } catch (error) {
    return handleRunbookRouteError(error, {
      invalidRequestCode: 'INCIDENT_RUNBOOK_EXECUTION_START_REQUEST_INVALID',
      invalidRequestMessage: 'Incident runbook execution start request is invalid.',
      internalErrorCode: 'INCIDENT_RUNBOOK_EXECUTION_START_FAILED',
      internalErrorMessage: 'Unable to start runbook execution from incident.',
    })
  }
}
