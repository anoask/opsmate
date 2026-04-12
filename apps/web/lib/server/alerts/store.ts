import { getDb } from '@/lib/server/db'
import {
  alertActivityFeedSchema,
  alertHistoryFeedSchema,
  alertHistoryItemSchema,
} from '@/lib/server/alerts/schema'
import type { AlertActivityItem, AlertHistoryItem } from '@/lib/types'

type AlertActivityRow = {
  id: string
  incident_id: string
  incident_title: string
  incident_severity: AlertActivityItem['incidentSeverity']
  incident_source: string
  event_type: 'created' | 'alert_merged'
  description: string
  metadata_json: string | null
  merge_count: number | null
  created_at: string
}

type AlertActivityMetadata = {
  incidentTitle?: string
  incidentSeverity?: AlertActivityItem['incidentSeverity']
  incidentSource?: string
  mergeCount?: number
}

function parseAlertActivityMetadata(value: string | null): AlertActivityMetadata | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as AlertActivityMetadata
  } catch {
    return null
  }
}

function parseAlertActivityRow(row: AlertActivityRow): AlertActivityItem {
  const metadata = parseAlertActivityMetadata(row.metadata_json)

  return {
    id: row.id,
    incidentId: row.incident_id,
    incidentTitle: metadata?.incidentTitle ?? row.incident_title,
    incidentSeverity: metadata?.incidentSeverity ?? row.incident_severity,
    incidentSource: metadata?.incidentSource ?? row.incident_source,
    type: row.event_type === 'created' ? 'incident_created' : 'alert_merged',
    description: row.description,
    mergeCount:
      typeof metadata?.mergeCount === 'number' && metadata.mergeCount >= 0
        ? Math.floor(metadata.mergeCount)
        : (row.merge_count ?? 0),
    createdAt: row.created_at,
  }
}

export function listStoredAlertActivity(limit = 10) {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
        ev.id,
        ev.incident_id,
        inc.title as incident_title,
        inc.severity as incident_severity,
        inc.source as incident_source,
        ev.type as event_type,
        ev.description,
        ev.metadata_json,
        inc.alert_merge_count as merge_count,
        ev.created_at
      FROM incident_events ev
      INNER JOIN incidents inc
        ON inc.id = ev.incident_id
      WHERE ev.type IN ('created', 'alert_merged')
      ORDER BY datetime(ev.created_at) DESC, ev.rowid DESC
      LIMIT ?`,
    )
    .all(limit) as AlertActivityRow[]

  return alertActivityFeedSchema.parse({
    items: rows.map(parseAlertActivityRow),
  })
}

type AlertHistoryRow = {
  id: string
  source: string
  category: AlertHistoryItem['category']
  title: string
  severity: AlertHistoryItem['severity']
  description: string
  dedup_key: string
  disposition: AlertHistoryItem['disposition']
  incident_id: string
  ingested_at: string
}

function parseAlertHistoryRow(row: AlertHistoryRow): AlertHistoryItem {
  return alertHistoryItemSchema.parse({
    id: row.id,
    source: row.source,
    category: row.category,
    title: row.title,
    severity: row.severity,
    description: row.description,
    dedupKey: row.dedup_key,
    disposition: row.disposition,
    incidentId: row.incident_id,
    ingestedAt: row.ingested_at,
  })
}

export function recordAlertIngestHistory(input: {
  id: string
  source: string
  category: AlertHistoryItem['category']
  title: string
  severity: AlertHistoryItem['severity']
  description: string
  dedupKey: string
  disposition: AlertHistoryItem['disposition']
  incidentId: string
  ingestedAt: string
}) {
  const parsed = alertHistoryItemSchema.parse(input)
  const db = getDb()

  db.prepare(
    `INSERT INTO alert_ingests (
      id,
      source,
      category,
      title,
      severity,
      description,
      dedup_key,
      disposition,
      incident_id,
      ingested_at
    ) VALUES (
      @id,
      @source,
      @category,
      @title,
      @severity,
      @description,
      @dedup_key,
      @disposition,
      @incident_id,
      @ingested_at
    )`,
  ).run({
    id: parsed.id,
    source: parsed.source,
    category: parsed.category,
    title: parsed.title,
    severity: parsed.severity,
    description: parsed.description,
    dedup_key: parsed.dedupKey,
    disposition: parsed.disposition,
    incident_id: parsed.incidentId,
    ingested_at: parsed.ingestedAt,
  })
}

export function listStoredAlertHistory(
  limit = 20,
  disposition?: AlertHistoryItem['disposition'],
) {
  const db = getDb()
  const rows = (
    disposition
      ? db
          .prepare(
            `SELECT
              id,
              source,
              category,
              title,
              severity,
              description,
              dedup_key,
              disposition,
              incident_id,
              ingested_at
            FROM alert_ingests
            WHERE disposition = ?
            ORDER BY datetime(ingested_at) DESC, rowid DESC
            LIMIT ?`,
          )
          .all(disposition, limit)
      : db
          .prepare(
            `SELECT
              id,
              source,
              category,
              title,
              severity,
              description,
              dedup_key,
              disposition,
              incident_id,
              ingested_at
            FROM alert_ingests
            ORDER BY datetime(ingested_at) DESC, rowid DESC
            LIMIT ?`,
          )
          .all(limit)
  ) as AlertHistoryRow[]

  return alertHistoryFeedSchema.parse({
    items: rows.map(parseAlertHistoryRow),
  })
}

export function listStoredAlertIngestsForIncident(incidentId: string, limit = 15) {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
        id,
        source,
        category,
        title,
        severity,
        description,
        dedup_key,
        disposition,
        incident_id,
        ingested_at
      FROM alert_ingests
      WHERE incident_id = ?
      ORDER BY datetime(ingested_at) DESC, rowid DESC
      LIMIT ?`,
    )
    .all(incidentId, limit) as AlertHistoryRow[]

  return rows.map(parseAlertHistoryRow)
}
