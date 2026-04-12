import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleIncidentRouteError } from '@/lib/server/incidents/http'
import { addIncidentNoteById } from '@/lib/server/incidents/service'
import {
  incidentNoteCreateInputSchema,
  incidentRouteParamsSchema,
} from '@/lib/server/incidents/schema'

export const dynamic = 'force-dynamic'

interface IncidentNotesRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, context: IncidentNotesRouteContext) {
  try {
    const params = incidentRouteParamsSchema.parse(await context.params)
    const body = incidentNoteCreateInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const author = await requireSessionActorName()

    return NextResponse.json(addIncidentNoteById(params.id, { ...body, author }))
  } catch (error) {
    return handleIncidentRouteError(error, {
      invalidRequestCode: 'INCIDENT_NOTE_REQUEST_INVALID',
      invalidRequestMessage: 'Add note request is invalid.',
      internalErrorCode: 'INCIDENT_NOTE_CREATE_FAILED',
      internalErrorMessage: 'Unable to add a note to the requested incident.',
    })
  }
}
