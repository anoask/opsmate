import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { UnauthenticatedError } from '@/lib/server/auth/errors'
import { ForbiddenActionError } from '@/lib/server/permissions'
import {
  RunbookExecutionError,
  RunbookExecutionNotFoundError,
  RunbookNotFoundError,
} from '@/lib/server/runbooks/service'

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

  if (error instanceof UnauthenticatedError) {
    return jsonError(
      {
        error: 'RUNBOOK_ACTION_UNAUTHENTICATED',
        message: error.message,
      },
      401,
    )
  }

  if (error instanceof ForbiddenActionError) {
    return jsonError(
      {
        error: 'RUNBOOK_ACTION_FORBIDDEN',
        message: error.message,
      },
      403,
    )
  }

  if (error instanceof RunbookExecutionNotFoundError) {
    return jsonError(
      {
        error: 'RUNBOOK_EXECUTION_NOT_FOUND',
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

  if (error instanceof RunbookExecutionError) {
    return jsonError(
      {
        error: 'RUNBOOK_EXECUTION_INVALID',
        message: error.message,
      },
      409,
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
