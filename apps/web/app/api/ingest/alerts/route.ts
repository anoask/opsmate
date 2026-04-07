import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { ingestAlert } from '@/lib/server/incidents/service'

export const dynamic = 'force-dynamic'

const ALERT_INGEST_SECRET_ENV = 'ALERT_INGEST_SECRET'

function getConfiguredSecret(): string {
  return process.env[ALERT_INGEST_SECRET_ENV]?.trim() ?? ''
}

function isAuthorized(request: Request, expected: string): boolean {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return false
  }
  const token = authorization.slice('Bearer '.length).trim()
  return token.length > 0 && token === expected
}

export async function POST(request: Request) {
  const expected = getConfiguredSecret()
  if (!expected) {
    return NextResponse.json(
      {
        error: 'INGEST_DISABLED',
        message: 'Alert ingest is not configured (set ALERT_INGEST_SECRET).',
      },
      { status: 503 },
    )
  }

  if (!isAuthorized(request, expected)) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing ingest credentials.',
      },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Request body must be JSON.' },
      { status: 400 },
    )
  }

  try {
    const { incident, deduplicated } = ingestAlert(body)
    return NextResponse.json(
      {
        incidentId: incident.id,
        severity: incident.severity,
        deduplicated,
      },
      { status: deduplicated ? 200 : 201 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'ALERT_INGEST_INVALID',
          message: 'Alert payload failed validation.',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'ALERT_INGEST_FAILED',
        message: 'Unable to create incident from alert.',
      },
      { status: 500 },
    )
  }
}
