import { NextResponse } from 'next/server'

import { handleRunbookRouteError } from '@/lib/server/runbooks/http'
import { listRunbooks } from '@/lib/server/runbooks/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(listRunbooks())
  } catch (error) {
    return handleRunbookRouteError(error, {
      invalidRequestCode: 'RUNBOOKS_REQUEST_INVALID',
      invalidRequestMessage: 'Runbooks request is invalid.',
      internalErrorCode: 'RUNBOOKS_LIST_FAILED',
      internalErrorMessage: 'Unable to load runbooks.',
    })
  }
}
