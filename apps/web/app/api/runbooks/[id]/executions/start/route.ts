import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleRunbookRouteError } from '@/lib/server/runbooks/http'
import {
  runbookExecutionStartInputSchema,
  runbookRouteParamsSchema,
} from '@/lib/server/runbooks/schema'
import { startRunbookExecution } from '@/lib/server/runbooks/service'

export const dynamic = 'force-dynamic'

interface RunbookExecutionStartRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  request: Request,
  context: RunbookExecutionStartRouteContext,
) {
  try {
    const params = runbookRouteParamsSchema.parse(await context.params)
    const body = runbookExecutionStartInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const startedBy = await requireSessionActorName()

    return NextResponse.json(startRunbookExecution(params.id, { ...body, startedBy }))
  } catch (error) {
    return handleRunbookRouteError(error, {
      invalidRequestCode: 'RUNBOOK_EXECUTION_START_REQUEST_INVALID',
      invalidRequestMessage: 'Runbook execution start request is invalid.',
      internalErrorCode: 'RUNBOOK_EXECUTION_START_FAILED',
      internalErrorMessage: 'Unable to start runbook execution.',
    })
  }
}
