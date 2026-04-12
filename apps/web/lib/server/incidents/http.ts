import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { UnauthenticatedError } from '@/lib/server/auth/errors'
import { ForbiddenActionError } from '@/lib/server/permissions'
import { IncidentStateConflictError } from '@/lib/server/incidents/store'
import {
  IncidentLifecycleError,
  IncidentNotFoundError,
} from '@/lib/server/incidents/service'

interface IncidentErrorBody {
  error: string
  message: string
  details?: unknown
}

interface IncidentRouteErrorConfig {
  invalidRequestCode: string
  invalidRequestMessage: string
  internalErrorCode: string
  internalErrorMessage: string
}

function jsonError(body: IncidentErrorBody, status: number) {
  return NextResponse.json(body, { status })
}

export function handleIncidentRouteError(
  error: unknown,
  config: IncidentRouteErrorConfig,
) {
  if (error instanceof IncidentNotFoundError) {
    return jsonError(
      {
        error: 'INCIDENT_NOT_FOUND',
        message: error.message,
      },
      404,
    )
  }

  if (error instanceof UnauthenticatedError) {
    return jsonError(
      {
        error: 'INCIDENT_ACTION_UNAUTHENTICATED',
        message: error.message,
      },
      401,
    )
  }

  if (error instanceof ForbiddenActionError) {
    return jsonError(
      {
        error: 'INCIDENT_ACTION_FORBIDDEN',
        message: error.message,
      },
      403,
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

  if (error instanceof IncidentLifecycleError) {
    return jsonError(
      {
        error: 'INCIDENT_TRANSITION_INVALID',
        message: error.message,
      },
      409,
    )
  }

  if (error instanceof IncidentStateConflictError) {
    return jsonError(
      {
        error: 'INCIDENT_STATE_CONFLICT',
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
