import {
  runbookRecordSchema,
  type RunbookRecord,
} from '@/lib/server/runbooks/schema'
import { getDb } from '@/lib/server/db'

function cloneRunbookRecord(runbook: RunbookRecord): RunbookRecord {
  return {
    ...runbook,
    tags: [...runbook.tags],
    relatedIncidentTypes: [...runbook.relatedIncidentTypes],
    steps: runbook.steps.map((step) => ({ ...step })),
    executions: runbook.executions.map((execution) => ({ ...execution })),
  }
}

function parseRunbookRow(row: {
  id: string
  title: string
  category: string
  severity: RunbookRecord['severity']
  summary: string
  owner: string
  last_updated: string
  success_rate: number
  execution_count: number
  estimated_duration: string
  related_incident_types_json: string
  tags_json: string
  steps_json: string
  executions_json: string
  created_at: string
  last_executed: string | null
}) {
  return runbookRecordSchema.parse({
    id: row.id,
    title: row.title,
    category: row.category,
    severity: row.severity,
    summary: row.summary,
    owner: row.owner,
    lastUpdated: row.last_updated,
    successRate: row.success_rate,
    executionCount: row.execution_count,
    estimatedDuration: row.estimated_duration,
    relatedIncidentTypes: JSON.parse(
      row.related_incident_types_json,
    ) as RunbookRecord['relatedIncidentTypes'],
    tags: JSON.parse(row.tags_json) as RunbookRecord['tags'],
    steps: JSON.parse(row.steps_json) as RunbookRecord['steps'],
    executions: JSON.parse(row.executions_json) as RunbookRecord['executions'],
    createdAt: row.created_at,
    lastExecuted: row.last_executed,
  })
}

export function listStoredRunbooks() {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
        id,
        title,
        category,
        severity,
        summary,
        owner,
        last_updated,
        success_rate,
        execution_count,
        estimated_duration,
        related_incident_types_json,
        tags_json,
        steps_json,
        executions_json,
        created_at,
        last_executed
      FROM runbooks
      ORDER BY datetime(last_updated) DESC`,
    )
    .all() as Array<Parameters<typeof parseRunbookRow>[0]>

  return rows.map((row) => cloneRunbookRecord(parseRunbookRow(row)))
}

export function getStoredRunbook(id: string) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT
        id,
        title,
        category,
        severity,
        summary,
        owner,
        last_updated,
        success_rate,
        execution_count,
        estimated_duration,
        related_incident_types_json,
        tags_json,
        steps_json,
        executions_json,
        created_at,
        last_executed
      FROM runbooks
      WHERE id = ?`,
    )
    .get(id) as Parameters<typeof parseRunbookRow>[0] | undefined

  return row ? cloneRunbookRecord(parseRunbookRow(row)) : null
}

export function getStoredRunbookByTitle(title: string) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT
        id,
        title,
        category,
        severity,
        summary,
        owner,
        last_updated,
        success_rate,
        execution_count,
        estimated_duration,
        related_incident_types_json,
        tags_json,
        steps_json,
        executions_json,
        created_at,
        last_executed
      FROM runbooks
      WHERE lower(title) = lower(?)
      LIMIT 1`,
    )
    .get(title) as Parameters<typeof parseRunbookRow>[0] | undefined

  return row ? cloneRunbookRecord(parseRunbookRow(row)) : null
}

export function saveStoredRunbook(runbook: RunbookRecord) {
  const db = getDb()
  const parsed = runbookRecordSchema.parse(runbook)

  db.prepare(
    `UPDATE runbooks SET
      title = @title,
      category = @category,
      severity = @severity,
      summary = @summary,
      owner = @owner,
      last_updated = @last_updated,
      success_rate = @success_rate,
      execution_count = @execution_count,
      estimated_duration = @estimated_duration,
      related_incident_types_json = @related_incident_types_json,
      tags_json = @tags_json,
      steps_json = @steps_json,
      executions_json = @executions_json,
      created_at = @created_at,
      last_executed = @last_executed
    WHERE id = @id`,
  ).run({
    id: parsed.id,
    title: parsed.title,
    category: parsed.category,
    severity: parsed.severity,
    summary: parsed.summary,
    owner: parsed.owner,
    last_updated: parsed.lastUpdated,
    success_rate: parsed.successRate,
    execution_count: parsed.executionCount,
    estimated_duration: parsed.estimatedDuration,
    related_incident_types_json: JSON.stringify(parsed.relatedIncidentTypes),
    tags_json: JSON.stringify(parsed.tags),
    steps_json: JSON.stringify(parsed.steps),
    executions_json: JSON.stringify(parsed.executions),
    created_at: parsed.createdAt,
    last_executed: parsed.lastExecuted,
  })

  return cloneRunbookRecord(parsed)
}
