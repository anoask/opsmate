import { NextResponse } from 'next/server'

import { handleRunbookRouteError } from '@/lib/server/runbooks/http'
import { runbookRouteParamsSchema } from '@/lib/server/runbooks/schema'
import { getRunbookById } from '@/lib/server/runbooks/service'

export const dynamic = 'force-dynamic'

interface RunbookRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, context: RunbookRouteContext) {
  try {
    const params = runbookRouteParamsSchema.parse(await context.params)
    return NextResponse.json(getRunbookById(params.id))
  } catch (error) {
    return handleRunbookRouteError(error, {
      invalidRequestCode: 'RUNBOOK_REQUEST_INVALID',
      invalidRequestMessage: 'Runbook request parameters are invalid.',
      internalErrorCode: 'RUNBOOK_FETCH_FAILED',
      internalErrorMessage: 'Unable to load the requested runbook.',
    })
  }
}
