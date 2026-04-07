import { getDb } from '@/lib/server/db'
import { usersListSchema } from '@/lib/server/users/schema'

type UserRow = {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'responder' | 'viewer'
  status: 'active' | 'inactive'
  joined_at: string
}

function parseUserRow(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  }
}

export function listStoredUsers() {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
        id,
        name,
        email,
        role,
        status,
        joined_at
      FROM users
      ORDER BY status = 'active' DESC, name ASC`,
    )
    .all() as UserRow[]

  return usersListSchema.parse(rows.map(parseUserRow))
}

export function resolveActorIdentity(actor: string, fallbackName = 'OpsMate Bot') {
  const normalizedActor = actor.trim()
  if (!normalizedActor) {
    return fallbackName
  }

  if (normalizedActor.toLowerCase() === 'opsmate') {
    return 'OpsMate Bot'
  }

  const lowercaseActor = normalizedActor.toLowerCase()
  const db = getDb()
  const row = db
    .prepare(
      `SELECT name
       FROM users
       WHERE lower(id) = ?
          OR lower(email) = ?
          OR lower(name) = ?
       LIMIT 1`,
    )
    .get(lowercaseActor, lowercaseActor, lowercaseActor) as
    | { name: string }
    | undefined

  return row?.name ?? normalizedActor
}
