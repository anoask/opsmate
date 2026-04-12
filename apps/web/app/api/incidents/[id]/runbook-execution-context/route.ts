import { NextResponse } from 'next/server'

import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { incidentRouteParamsSchema } from '@/lib/server/incidents/schema'
import { getIncidentRunbookExecutionContext } from '@/lib/server/runbooks/service'

export const dynamic = 'force-dynamic'

interface RunbookExecutionContextRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, context: RunbookExecutionContextRouteContext) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    return NextResponse.json(getIncidentRunbookExecutionContext(params.id))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_RUNBOOK_CONTEXT_REQUEST_INVALID',
      invalidRequestMessage: 'Incident runbook execution context request is invalid.',
      internalErrorCode: 'INCIDENT_RUNBOOK_CONTEXT_FETCH_FAILED',
      internalErrorMessage: 'Unable to load runbook execution context for incident.',
    })
  }
}
