import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { RunbookNotFoundError } from '@/lib/server/runbooks/service'

interface RunbookErrorBody {
  error: string
  message: string
  details?: unknown
}

interface RunbookRouteErrorConfig {
  invalidRequestCode: string
  invalidRequestMessage: string
  internalErrorCode: string
  internalErrorMessage: string
}

function jsonError(body: RunbookErrorBody, status: number) {
  return NextResponse.json(body, { status })
}

export function handleRunbookRouteError(
  error: unknown,
  config: RunbookRouteErrorConfig,
) {
  if (error instanceof RunbookNotFoundError) {
    return jsonError(
      {
        error: 'RUNBOOK_NOT_FOUND',
        message: error.message,
      },
      404,
    )
  }

  if (error instanceof ZodError) {
    return jsonError(
      {
        error: config.invalidRequestCode,
        message: config.invalidRequestMessage,
        details: error.flatten(),
      },
      400,
    )
  }

  return jsonError(
    {
      error: config.internalErrorCode,
      message: config.internalErrorMessage,
    },
    500,
  )
}
