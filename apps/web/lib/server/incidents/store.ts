import { getAnalyticsWindowStart, type AnalyticsDateRange } from '@/lib/analytics/date-range'
import {
  incidentDtoSchema,
  type IncidentDto,
} from '@/lib/server/incidents/schema'
import { getDb } from '@/lib/server/db'

function cloneIncident(incident: IncidentDto): IncidentDto {
  return {
    ...incident,
    timeline: incident.timeline.map((event) => ({ ...event })),
    notes: incident.notes.map((note) => ({ ...note })),
  }
}

function parseIncidentRow(row: {
  id: string
  source: string
  title: string
  description: string
  severity: IncidentDto['severity']
  status: IncidentDto['status']
  category: IncidentDto['category']
  assigned_runbook: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  timeline_json: string
  notes_json: string
}) {
  return incidentDtoSchema.parse({
    id: row.id,
    source: row.source,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    category: row.category,
    assignedRunbook: row.assigned_runbook,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    timeline: JSON.parse(row.timeline_json) as IncidentDto['timeline'],
    notes: JSON.parse(row.notes_json) as IncidentDto['notes'],
  })
}

export function listStoredIncidents(options?: { range?: AnalyticsDateRange }) {
  const db = getDb()
  const baseQuery = `SELECT
      id,
      source,
      title,
      description,
      severity,
      status,
      category,
      assigned_runbook,
      assigned_to,
      created_at,
      updated_at,
      resolved_at,
      timeline_json,
      notes_json
    FROM incidents`

  const rows = options?.range
    ? (db
        .prepare(
          `${baseQuery}
          WHERE datetime(created_at) >= datetime(?)
             OR (resolved_at IS NOT NULL AND datetime(resolved_at) >= datetime(?))
          ORDER BY datetime(created_at) DESC`,
        )
        .all(
          getAnalyticsWindowStart(options.range).toISOString(),
          getAnalyticsWindowStart(options.range).toISOString(),
        ) as Array<Parameters<typeof parseIncidentRow>[0]>)
    : (db
        .prepare(`${baseQuery} ORDER BY datetime(created_at) DESC`)
        .all() as Array<Parameters<typeof parseIncidentRow>[0]>)

  return rows.map((row) => cloneIncident(parseIncidentRow(row)))
}

export function getStoredIncident(id: string) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT
        id,
        source,
        title,
        description,
        severity,
        status,
        category,
        assigned_runbook,
        assigned_to,
        created_at,
        updated_at,
        resolved_at,
        timeline_json,
        notes_json
      FROM incidents
      WHERE id = ?`,
    )
    .get(id) as Parameters<typeof parseIncidentRow>[0] | undefined

  return row ? cloneIncident(parseIncidentRow(row)) : null
}

export function saveStoredIncident(incident: IncidentDto) {
  const db = getDb()
  const parsedIncident = incidentDtoSchema.parse(incident)

  db.prepare(
    `INSERT INTO incidents (
      id,
      source,
      title,
      description,
      severity,
      status,
      category,
      assigned_runbook,
      assigned_to,
      created_at,
      updated_at,
      resolved_at,
      timeline_json,
      notes_json
    ) VALUES (
      @id,
      @source,
      @title,
      @description,
      @severity,
      @status,
      @category,
      @assigned_runbook,
      @assigned_to,
      @created_at,
      @updated_at,
      @resolved_at,
      @timeline_json,
      @notes_json
    )
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      title = excluded.title,
      description = excluded.description,
      severity = excluded.severity,
      status = excluded.status,
      category = excluded.category,
      assigned_runbook = excluded.assigned_runbook,
      assigned_to = excluded.assigned_to,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      resolved_at = excluded.resolved_at,
      timeline_json = excluded.timeline_json,
      notes_json = excluded.notes_json`,
  ).run({
    id: parsedIncident.id,
    source: parsedIncident.source,
    title: parsedIncident.title,
    description: parsedIncident.description,
    severity: parsedIncident.severity,
    status: parsedIncident.status,
    category: parsedIncident.category,
    assigned_runbook: parsedIncident.assignedRunbook,
    assigned_to: parsedIncident.assignedTo,
    created_at: parsedIncident.createdAt,
    updated_at: parsedIncident.updatedAt,
    resolved_at: parsedIncident.resolvedAt,
    timeline_json: JSON.stringify(parsedIncident.timeline),
    notes_json: JSON.stringify(parsedIncident.notes),
  })

  return cloneIncident(parsedIncident)
}
