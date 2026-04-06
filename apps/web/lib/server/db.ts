import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { getAnalyticsWindowStart } from '@/lib/analytics/date-range'
import { getCurrentDemoIncidents } from '@/lib/demo-incidents'
import { runbooks as mockRunbooks } from '@/lib/mock-data'
import {
  incidentsListDtoSchema,
  type IncidentDto,
} from '@/lib/server/incidents/schema'
import {
  runbookRecordSchema,
  type RunbookRecord,
} from '@/lib/server/runbooks/schema'

const defaultDatabasePath = path.join(process.cwd(), 'data', 'opsmate.db')

function getDatabasePath() {
  const configuredPath = process.env.SQLITE_DB_PATH?.trim()
  return configuredPath ? path.resolve(configuredPath) : defaultDatabasePath
}

function ensureDatabaseDirectory(databasePath: string) {
  mkdirSync(path.dirname(databasePath), { recursive: true })
}

function createSeedRunbooks() {
  const relatedIncidentTypesByRunbookId: Record<string, string[]> = {
    'RB-101': ['high_cpu', 'resource_exhaustion'],
    'RB-087': ['database_connection_pool', 'stale_connections'],
    'RB-054': ['auth_service_restart', 'authentication_errors'],
    'RB-042': ['payment_errors', 'checkout_failures'],
    'RB-029': ['memory_leak', 'resource_pressure'],
  }

  return mockRunbooks.map((runbook) =>
    runbookRecordSchema.parse({
      id: runbook.id,
      title: runbook.title,
      category: runbook.category,
      severity: runbook.severity,
      summary: runbook.description,
      tags: runbook.tags,
      owner: runbook.createdBy,
      lastUpdated: runbook.updatedAt,
      successRate: runbook.successRate,
      executionCount: runbook.usageCount,
      estimatedDuration: runbook.avgExecutionTime,
      relatedIncidentTypes:
        relatedIncidentTypesByRunbookId[runbook.id] ?? runbook.tags,
      steps: runbook.steps,
      executions: runbook.executions,
      createdAt: runbook.createdAt,
      lastExecuted: runbook.lastExecuted ?? null,
    }),
  )
}

function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      assigned_runbook TEXT,
      assigned_to TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT,
      timeline_json TEXT NOT NULL,
      notes_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS runbooks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      summary TEXT NOT NULL,
      owner TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      success_rate REAL NOT NULL,
      execution_count INTEGER NOT NULL,
      estimated_duration TEXT NOT NULL,
      related_incident_types_json TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      executions_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_executed TEXT
    );
  `)
}

function seedIncidents(db: Database.Database) {
  const parsedIncidents = incidentsListDtoSchema.parse(getCurrentDemoIncidents())
  const upsertIncident = db.prepare(`
    INSERT INTO incidents (
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
      notes_json = excluded.notes_json
  `)

  const seedTransaction = db.transaction((incidents: IncidentDto[]) => {
    for (const incident of incidents) {
      upsertIncident.run({
        id: incident.id,
        source: incident.source,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        category: incident.category,
        assigned_runbook: incident.assignedRunbook,
        assigned_to: incident.assignedTo,
        created_at: incident.createdAt,
        updated_at: incident.updatedAt,
        resolved_at: incident.resolvedAt,
        timeline_json: JSON.stringify(incident.timeline),
        notes_json: JSON.stringify(incident.notes),
      })
    }
  })

  const existingIncidents = db
    .prepare('SELECT id, created_at FROM incidents')
    .all() as Array<{ id: string; created_at: string }>

  if (existingIncidents.length === 0) {
    seedTransaction(parsedIncidents)
    return
  }

  const seedIds = new Set(parsedIncidents.map((incident) => incident.id))
  const hasOnlySeedIncidents =
    existingIncidents.length === seedIds.size &&
    existingIncidents.every((incident) => seedIds.has(incident.id))

  if (!hasOnlySeedIncidents) {
    return
  }

  const latestSeedTimestamp = existingIncidents.reduce((latestTimestamp, incident) => {
    const createdAt = new Date(incident.created_at).getTime()
    return Number.isNaN(createdAt) ? latestTimestamp : Math.max(latestTimestamp, createdAt)
  }, 0)

  if (latestSeedTimestamp < getAnalyticsWindowStart('90d').getTime()) {
    seedTransaction(parsedIncidents)
  }
}

function seedRunbooks(db: Database.Database) {
  const runbookCount = db
    .prepare('SELECT COUNT(*) as count FROM runbooks')
    .get() as { count: number }

  if (runbookCount.count > 0) {
    return
  }

  const parsedRunbooks = createSeedRunbooks()
  const insertRunbook = db.prepare(`
    INSERT INTO runbooks (
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
    ) VALUES (
      @id,
      @title,
      @category,
      @severity,
      @summary,
      @owner,
      @last_updated,
      @success_rate,
      @execution_count,
      @estimated_duration,
      @related_incident_types_json,
      @tags_json,
      @steps_json,
      @executions_json,
      @created_at,
      @last_executed
    )
  `)

  const seedTransaction = db.transaction((runbooks: RunbookRecord[]) => {
    for (const runbook of runbooks) {
      insertRunbook.run({
        id: runbook.id,
        title: runbook.title,
        category: runbook.category,
        severity: runbook.severity,
        summary: runbook.summary,
        owner: runbook.owner,
        last_updated: runbook.lastUpdated,
        success_rate: runbook.successRate,
        execution_count: runbook.executionCount,
        estimated_duration: runbook.estimatedDuration,
        related_incident_types_json: JSON.stringify(runbook.relatedIncidentTypes),
        tags_json: JSON.stringify(runbook.tags),
        steps_json: JSON.stringify(runbook.steps),
        executions_json: JSON.stringify(runbook.executions),
        created_at: runbook.createdAt,
        last_executed: runbook.lastExecuted,
      })
    }
  })

  seedTransaction(parsedRunbooks)
}

function initializeDatabase() {
  const databasePath = getDatabasePath()
  ensureDatabaseDirectory(databasePath)

  const db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  createSchema(db)
  seedIncidents(db)
  seedRunbooks(db)

  return db
}

declare global {
  var __opsmateDb__: Database.Database | undefined
}

export function getDb() {
  if (!globalThis.__opsmateDb__) {
    globalThis.__opsmateDb__ = initializeDatabase()
  }

  return globalThis.__opsmateDb__
}
