import { getDb } from '@/lib/server/db'
import { alertActivityFeedSchema } from '@/lib/server/alerts/schema'
import type { AlertActivityItem } from '@/lib/types'

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
