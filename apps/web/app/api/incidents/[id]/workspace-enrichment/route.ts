import { NextResponse } from 'next/server'

import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { incidentRouteParamsSchema } from '@/lib/server/incidents/schema'
import { getIncidentWorkspaceEnrichment } from '@/lib/server/incidents/workspace'

export const dynamic = 'force-dynamic'

interface WorkspaceEnrichmentRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, context: WorkspaceEnrichmentRouteContext) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    return NextResponse.json(getIncidentWorkspaceEnrichment(params.id))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_REQUEST_INVALID',
      invalidRequestMessage: 'Incident request parameters are invalid.',
      internalErrorCode: 'INCIDENT_WORKSPACE_ENRICHMENT_FAILED',
      internalErrorMessage: 'Unable to load workspace data for this incident.',
    })
  }
}
