import { NextResponse } from 'next/server'

import { requireSessionActorName } from '@/lib/server/auth/session'
import { handleRunbookRouteError } from '@/lib/server/runbooks/http'
import {
  runbookExecutionRouteParamsSchema,
  runbookExecutionUpdateInputSchema,
} from '@/lib/server/runbooks/schema'
import { updateRunbookExecution } from '@/lib/server/runbooks/service'

export const dynamic = 'force-dynamic'

interface RunbookExecutionRouteContext {
  params: Promise<{
    id: string
    executionId: string
  }>
}

export async function PATCH(
  request: Request,
  context: RunbookExecutionRouteContext,
) {
  try {
    const params = runbookExecutionRouteParamsSchema.parse(await context.params)
    const body = runbookExecutionUpdateInputSchema.parse(
      await request.json().catch(() => ({})),
    )
    const updatedBy = await requireSessionActorName()

    return NextResponse.json(
      updateRunbookExecution(params.id, params.executionId, { ...body, updatedBy }),
    )
  } catch (error) {
    return handleRunbookRouteError(error, {
      invalidRequestCode: 'RUNBOOK_EXECUTION_UPDATE_REQUEST_INVALID',
      invalidRequestMessage: 'Runbook execution update request is invalid.',
      internalErrorCode: 'RUNBOOK_EXECUTION_UPDATE_FAILED',
      internalErrorMessage: 'Unable to update runbook execution.',
    })
  }
}
