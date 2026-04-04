import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { incidentListQuerySchema } from '@/lib/server/incidents/schema'
import { listIncidents } from '@/lib/server/incidents/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = incidentListQuerySchema.parse({
      range: searchParams.get('range') ?? undefined,
    })

    return NextResponse.json(listIncidents(query))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'INCIDENTS_RESPONSE_INVALID',
          message: 'Incidents data failed validation.',
          details: error.flatten(),
        },
        { status: 500 },
      )
    }
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENTS_REQUEST_INVALID',
      invalidRequestMessage: 'Incidents request is invalid.',
      internalErrorCode: 'INCIDENTS_LIST_FAILED',
      internalErrorMessage: 'Unable to load incidents.',
    })
  }
}
