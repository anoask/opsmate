import { mkdirSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('server flows (isolated sqlite)', () => {
  beforeEach(() => {
    vi.resetModules()
    delete (globalThis as { __opsmateDb__?: unknown }).__opsmateDb__
    const dbFile = path.join(tmpdir(), `opsmate-${randomUUID()}.db`)
    mkdirSync(path.dirname(dbFile), { recursive: true })
    process.env.SQLITE_DB_PATH = dbFile
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    const p = process.env.SQLITE_DB_PATH
    if (p) {
      try {
        unlinkSync(p)
      } catch {
        /* ignore */
      }
    }
    vi.restoreAllMocks()
  })

  it('ingest creates then merges on matching dedup key', async () => {
    const { ingestAlert } = await import('@/lib/server/incidents/service')

    const dedupKey = `dedup-${randomUUID()}`
    const base = {
      title: 'First',
      severity: 'high' as const,
      category: 'database' as const,
      source: 'PagerDuty',
      description: 'x',
      dedupKey,
    }

    const first = ingestAlert(base)
    expect(first.deduplicated).toBe(false)
    expect(first.incident.alertMergeCount).toBe(0)

    const second = ingestAlert({ ...base, title: 'Second title' })
    expect(second.deduplicated).toBe(true)
    expect(second.incident.id).toBe(first.incident.id)
    expect(second.incident.alertMergeCount).toBe(1)
    expect(second.incident.title).toBe('Second title')
  })

  it('blocks runbook execution start when incident is resolved', async () => {
    const { startRunbookExecutionForIncident, RunbookExecutionError } =
      await import('@/lib/server/runbooks/service')
    const { resolveIncidentById } = await import('@/lib/server/incidents/service')

    // Seeded title must match a runbook row (`Memory Leak Investigation` = RB-029).
    const incidentId = 'INC-2843'
    const actor = 'Jordan Lee'

    const started = startRunbookExecutionForIncident(incidentId, actor)
    expect(started.execution.incidentId).toBe(incidentId)

    resolveIncidentById(incidentId, { actor: 'Sarah Chen' })

    expect(() =>
      startRunbookExecutionForIncident(incidentId, actor),
    ).toThrowError(RunbookExecutionError)

    expect(() =>
      startRunbookExecutionForIncident(incidentId, actor),
    ).toThrow(/resolved and cannot start new runbook executions/)
  })

  it('denies runbook execution for viewer role', async () => {
    const { startRunbookExecutionForIncident } = await import(
      '@/lib/server/runbooks/service',
    )
    const { ForbiddenActionError } = await import('@/lib/server/permissions')

    expect(() =>
      startRunbookExecutionForIncident('INC-2843', 'Casey Johnson'),
    ).toThrow(ForbiddenActionError)
  })

  it('toggles major incident flag and rejects no-op toggle', async () => {
    const { setMajorIncidentById, IncidentLifecycleError } = await import(
      '@/lib/server/incidents/service'
    )

    const id = 'INC-2846'
    const actor = 'Sarah Chen'

    const marked = setMajorIncidentById(id, { actor, isMajor: true })
    expect(marked.isMajorIncident).toBe(true)

    const cleared = setMajorIncidentById(id, { actor, isMajor: false })
    expect(cleared.isMajorIncident).toBe(false)

    expect(() => setMajorIncidentById(id, { actor, isMajor: false })).toThrow(
      IncidentLifecycleError,
    )
  })
})
