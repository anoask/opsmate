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
  } catch {
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
