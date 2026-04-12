import { getDb } from '@/lib/server/db'
import {
  incidentNotificationFeedSchema,
  incidentNotificationSchema,
  notificationCenterFeedSchema,
  notificationCenterItemSchema,
} from '@/lib/server/notifications/schema'
import { randomUUID } from 'node:crypto'
import type { IncidentNotification, NotificationCenterItem } from '@/lib/types'

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

type NotificationDeliveryRow = {
  notification_id: string
  status: NotificationDeliveryStatus
  detail: string | null
  attempted_at: string
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

export type NotificationDeliveryStatus = 'delivered' | 'failed' | 'skipped'

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

export function listStoredIncidentNotificationsForIncident(
  incidentId: string,
  limit = 10,
) {
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
      WHERE incident_id = ?
      ORDER BY datetime(created_at) DESC, rowid DESC
      LIMIT ?`,
    )
    .all(incidentId, limit) as IncidentNotificationRow[]

  return rows.map(parseNotificationRow)
}

export function recordIncidentNotificationDeliveryAttempt(options: {
  notificationId: string
  channel: 'slack'
  status: NotificationDeliveryStatus
  detail?: string | null
  attemptedAt?: string
}) {
  const db = getDb()
  db.prepare(
    `INSERT INTO incident_notification_deliveries (
      id,
      notification_id,
      channel,
      status,
      detail,
      attempted_at
    ) VALUES (
      @id,
      @notification_id,
      @channel,
      @status,
      @detail,
      @attempted_at
    )`,
  ).run({
    id: `notif_delivery_${randomUUID()}`,
    notification_id: options.notificationId,
    channel: options.channel,
    status: options.status,
    detail: options.detail ?? null,
    attempted_at: options.attemptedAt ?? new Date().toISOString(),
  })
}

export function getStoredIncidentNotificationById(id: string) {
  const db = getDb()
  const row = db
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
      WHERE id = ?`,
    )
    .get(id) as IncidentNotificationRow | undefined

  return row ? parseNotificationRow(row) : null
}

export function getLatestSlackDeliveryAttempt(notificationId: string) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT
        notification_id,
        status,
        detail,
        attempted_at
      FROM incident_notification_deliveries
      WHERE notification_id = ?
        AND channel = 'slack'
      ORDER BY datetime(attempted_at) DESC, rowid DESC
      LIMIT 1`,
    )
    .get(notificationId) as NotificationDeliveryRow | undefined

  return row ?? null
}

export function listFailedSlackNotificationIds(limit = 10) {
  const db = getDb()
  const rows = db
    .prepare(
      `WITH latest_slack_attempt AS (
        SELECT
          notification_id,
          status,
          attempted_at,
          row_number() OVER (
            PARTITION BY notification_id
            ORDER BY datetime(attempted_at) DESC, rowid DESC
          ) AS rn
        FROM incident_notification_deliveries
        WHERE channel = 'slack'
      )
      SELECT notification_id
      FROM latest_slack_attempt
      WHERE rn = 1
        AND status = 'failed'
      ORDER BY datetime(attempted_at) DESC
      LIMIT ?`,
    )
    .all(limit) as Array<{ notification_id: string }>

  return rows.map((row) => row.notification_id)
}

function toNotificationCenterItem(options: {
  notification: IncidentNotification
  latestSlackDelivery: NotificationDeliveryRow | null
}): NotificationCenterItem {
  const status = options.latestSlackDelivery?.status ?? 'not_attempted'
  return notificationCenterItemSchema.parse({
    ...options.notification,
    slackDeliveryStatus: status,
    slackAttemptedAt: options.latestSlackDelivery?.attempted_at ?? null,
    slackDeliveryDetail: options.latestSlackDelivery?.detail ?? null,
    retryEligible: status === 'failed',
  })
}

export function listStoredNotificationCenterItems(limit = 30) {
  const feed = listStoredIncidentNotifications(limit)

  const items = feed.notifications.map((notification) =>
    toNotificationCenterItem({
      notification,
      latestSlackDelivery: getLatestSlackDeliveryAttempt(notification.id),
    }),
  )

  return notificationCenterFeedSchema.parse({
    items,
    unreadCount: feed.unreadCount,
  })
}
