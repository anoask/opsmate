import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { IncidentNotFoundError } from '@/lib/server/incidents/service'

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
