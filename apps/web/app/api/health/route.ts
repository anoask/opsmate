import { NextResponse } from 'next/server'

import { getDb } from '@/lib/server/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    db.prepare('SELECT 1').get()

    return NextResponse.json({
      status: 'ok',
      service: 'opsmate-web',
      datastore: 'sqlite',
    })
  } catch (error) {
    console.error('[health] healthcheck failed', { error })

    return NextResponse.json(
      {
        status: 'error',
        service: 'opsmate-web',
        datastore: 'sqlite',
      },
      { status: 500 },
    )
  }
}
