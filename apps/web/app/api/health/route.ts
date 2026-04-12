import { NextResponse } from 'next/server'

import { getDb } from '@/lib/server/db'
import { getWorkspaceConfigFlags } from '@/lib/server/workspace-config-flags'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    db.prepare('SELECT 1').get()

    return NextResponse.json({
      status: 'ok',
      service: 'opsmate-web',
      datastore: 'sqlite',
      workspace: getWorkspaceConfigFlags({ databaseReachable: true }),
    })
  } catch (error) {
    console.error('[health] healthcheck failed', { error })

    return NextResponse.json(
      {
        status: 'error',
        service: 'opsmate-web',
        datastore: 'sqlite',
        workspace: getWorkspaceConfigFlags({ databaseReachable: false }),
      },
      { status: 500 },
    )
  }
}
