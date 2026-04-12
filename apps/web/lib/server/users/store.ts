import { getDb } from '@/lib/server/db'
import {
  userNotificationPrefsPatchSchema,
  userSchema,
  usersListSchema,
} from '@/lib/server/users/schema'
import type { UserNotificationPrefs, UserRole } from '@/lib/types'

export class LastActiveAdminRemovalError extends Error {
  constructor() {
    super('At least one active admin must remain.')
    this.name = 'LastActiveAdminRemovalError'
  }
}

type UserRow = {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'responder' | 'viewer'
  status: 'active' | 'inactive'
  joined_at: string
  notify_critical?: number | null
  notify_assignment?: number | null
  notify_lifecycle?: number | null
}

function sqliteBool(value: number | null | undefined, defaultTrue = true) {
  if (value == null) {
    return defaultTrue
  }
  return value !== 0
}

function parsePrefsFromRow(row: UserRow): UserNotificationPrefs {
  return {
    notifyOnCritical: sqliteBool(row.notify_critical, true),
    notifyOnAssignment: sqliteBool(row.notify_assignment, true),
    notifyOnLifecycle: sqliteBool(row.notify_lifecycle, true),
  }
}

function parseUserRow(row: UserRow) {
  return userSchema.parse({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
    notificationPrefs: parsePrefsFromRow(row),
  })
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
        joined_at,
        notify_critical,
        notify_assignment,
        notify_lifecycle
      FROM users
      ORDER BY status = 'active' DESC, name ASC`,
    )
    .all() as UserRow[]

  return usersListSchema.parse(rows.map(parseUserRow))
}

export function getStoredUserById(userId: string) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT
        id,
        name,
        email,
        role,
        status,
        joined_at,
        notify_critical,
        notify_assignment,
        notify_lifecycle
      FROM users
      WHERE id = ?
      LIMIT 1`,
    )
    .get(userId) as UserRow | undefined

  if (!row) {
    return null
  }

  return parseUserRow(row)
}

export function updateStoredUserNotificationPrefs(
  userId: string,
  patch: Partial<UserNotificationPrefs>,
) {
  const parsedPatch = userNotificationPrefsPatchSchema.parse(patch)
  const existing = getStoredUserById(userId)
  if (!existing) {
    return null
  }

  const next: UserNotificationPrefs = {
    notifyOnCritical:
      parsedPatch.notifyOnCritical ?? existing.notificationPrefs.notifyOnCritical,
    notifyOnAssignment:
      parsedPatch.notifyOnAssignment ?? existing.notificationPrefs.notifyOnAssignment,
    notifyOnLifecycle:
      parsedPatch.notifyOnLifecycle ?? existing.notificationPrefs.notifyOnLifecycle,
  }

  const db = getDb()
  db.prepare(
    `UPDATE users SET
      notify_critical = @notify_critical,
      notify_assignment = @notify_assignment,
      notify_lifecycle = @notify_lifecycle
    WHERE id = @id`,
  ).run({
    id: userId,
    notify_critical: next.notifyOnCritical ? 1 : 0,
    notify_assignment: next.notifyOnAssignment ? 1 : 0,
    notify_lifecycle: next.notifyOnLifecycle ? 1 : 0,
  })

  return getStoredUserById(userId)
}

/**
 * Applies optional notification preference and/or role updates in one write.
 * Throws {@link LastActiveAdminRemovalError} when demoting the only active admin.
 */
export function patchStoredUser(
  userId: string,
  patch: {
    notificationPrefs?: Partial<UserNotificationPrefs>
    role?: UserRole
  },
) {
  const existing = getStoredUserById(userId)
  if (!existing) {
    return null
  }

  const hasPrefKeys =
    patch.notificationPrefs && Object.keys(patch.notificationPrefs).length > 0
  const roleProvided = patch.role !== undefined

  let nextRole = existing.role
  if (roleProvided && patch.role !== existing.role) {
    if (
      existing.role === 'admin' &&
      existing.status === 'active' &&
      patch.role !== 'admin'
    ) {
      const db = getDb()
      const row = db
        .prepare(
          `SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND status = 'active' AND id != ?`,
        )
        .get(userId) as { c: number }
      if (row.c < 1) {
        throw new LastActiveAdminRemovalError()
      }
    }
    nextRole = patch.role!
  }

  let nextPrefs = existing.notificationPrefs
  if (hasPrefKeys) {
    const parsedPatch = userNotificationPrefsPatchSchema.parse(
      patch.notificationPrefs,
    )
    nextPrefs = {
      notifyOnCritical:
        parsedPatch.notifyOnCritical ?? existing.notificationPrefs.notifyOnCritical,
      notifyOnAssignment:
        parsedPatch.notifyOnAssignment ??
        existing.notificationPrefs.notifyOnAssignment,
      notifyOnLifecycle:
        parsedPatch.notifyOnLifecycle ??
        existing.notificationPrefs.notifyOnLifecycle,
    }
  }

  const roleChanged = nextRole !== existing.role
  const prefsChanged =
    nextPrefs.notifyOnCritical !== existing.notificationPrefs.notifyOnCritical ||
    nextPrefs.notifyOnAssignment !== existing.notificationPrefs.notifyOnAssignment ||
    nextPrefs.notifyOnLifecycle !== existing.notificationPrefs.notifyOnLifecycle

  if (!roleChanged && !prefsChanged) {
    return existing
  }

  const db = getDb()
  db.prepare(
    `UPDATE users SET
      role = @role,
      notify_critical = @notify_critical,
      notify_assignment = @notify_assignment,
      notify_lifecycle = @notify_lifecycle
    WHERE id = @id`,
  ).run({
    id: userId,
    role: nextRole,
    notify_critical: nextPrefs.notifyOnCritical ? 1 : 0,
    notify_assignment: nextPrefs.notifyOnAssignment ? 1 : 0,
    notify_lifecycle: nextPrefs.notifyOnLifecycle ? 1 : 0,
  })

  return getStoredUserById(userId)
}

export function getStoredUserRoleForActor(actor: string): UserRole | null {
  const normalizedActor = actor.trim()
  if (!normalizedActor) {
    return null
  }

  const lowercaseActor = normalizedActor.toLowerCase()
  const db = getDb()

  if (lowercaseActor === 'opsmate' || lowercaseActor === 'opsmate bot') {
    const bot = db
      .prepare(`SELECT role FROM users WHERE id = ? LIMIT 1`)
      .get('sys-opsmate-bot') as { role: UserRole } | undefined
    return bot?.role ?? 'admin'
  }

  const row = db
    .prepare(
      `SELECT role
       FROM users
       WHERE lower(id) = ?
          OR lower(email) = ?
          OR lower(name) = ?
       LIMIT 1`,
    )
    .get(lowercaseActor, lowercaseActor, lowercaseActor) as
    | { role: UserRole }
    | undefined

  return row?.role ?? null
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
