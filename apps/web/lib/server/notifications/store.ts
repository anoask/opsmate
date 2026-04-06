import { getDb } from '@/lib/server/db'
import {
  incidentNotificationFeedSchema,
  incidentNotificationSchema,
} from '@/lib/server/notifications/schema'
import type { IncidentNotification } from '@/lib/types'

type IncidentNotificationRow = {
  id: string
  incident_id: string
  event_id: string | null
  type: IncidentNotification['type']
  title: string
  message: string
  incident_title: string
  incident_severity: IncidentNotification['incidentSeverity']
  created_at: string
  read_at: string | null
}

export interface StoredIncidentNotificationRecord {
  id: string
  incidentId: string
  eventId?: string | null
  type: IncidentNotification['type']
  title: string
  message: string
  incidentTitle: string
  incidentSeverity: IncidentNotification['incidentSeverity']
  createdAt: string
  readAt?: string | null
}

function parseNotificationRow(row: IncidentNotificationRow) {
  return incidentNotificationSchema.parse({
    id: row.id,
    incidentId: row.incident_id,
    eventId: row.event_id,
    type: row.type,
    title: row.title,
    message: row.message,
    incidentTitle: row.incident_title,
    incidentSeverity: row.incident_severity,
    createdAt: row.created_at,
    readAt: row.read_at,
  })
}

export function listStoredIncidentNotifications(limit = 8) {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
        id,
        incident_id,
        event_id,
        type,
        title,
        message,
        incident_title,
        incident_severity,
        created_at,
        read_at
      FROM incident_notifications
      ORDER BY datetime(created_at) DESC, rowid DESC
      LIMIT ?`,
    )
    .all(limit) as IncidentNotificationRow[]

  const unreadRow = db
    .prepare(
      'SELECT COUNT(*) as count FROM incident_notifications WHERE read_at IS NULL',
    )
    .get() as { count: number }

  return incidentNotificationFeedSchema.parse({
    notifications: rows.map(parseNotificationRow),
    unreadCount: unreadRow.count,
  })
}
