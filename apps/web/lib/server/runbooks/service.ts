import { randomUUID } from 'node:crypto'

import { getStoredIncident } from '@/lib/server/incidents/store'
import { IncidentNotFoundError } from '@/lib/server/incidents/service'
import { assertActorPermission } from '@/lib/server/permissions'
import {
  getStoredRunbookByTitle,
  getStoredRunbook,
  listStoredRunbooks,
  saveStoredRunbook,
} from '@/lib/server/runbooks/store'
import {
  incidentRunbookExecutionContextSchema,
  runbookExecutionStartInputSchema,
  runbookExecutionUpdateInputSchema,
  runbookRecordSchema,
  runbookResponseDtoSchema,
  runbookRouteParamsSchema,
  type RunbookExecutionStartInput,
  type RunbookExecutionUpdateInput,
  runbooksListResponseDtoSchema,
  type RunbookRecord,
} from '@/lib/server/runbooks/schema'

export class RunbookNotFoundError extends Error {
  constructor(id: string) {
    super(`Runbook ${id} was not found.`)
    this.name = 'RunbookNotFoundError'
  }
}

export class RunbookExecutionNotFoundError extends Error {
  constructor(runbookId: string, executionId: string) {
    super(`Runbook execution ${executionId} was not found for ${runbookId}.`)
    this.name = 'RunbookExecutionNotFoundError'
  }
}

export class RunbookExecutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RunbookExecutionError'
  }
}

function toRunbookResponseDto(runbook: RunbookRecord) {
  const parsedRunbook = runbookRecordSchema.parse(runbook)

  return runbookResponseDtoSchema.parse({
    id: parsedRunbook.id,
    title: parsedRunbook.title,
    category: parsedRunbook.category,
    description: parsedRunbook.summary,
    severity: parsedRunbook.severity,
    tags: parsedRunbook.tags,
    steps: parsedRunbook.steps,
    createdAt: parsedRunbook.createdAt,
    updatedAt: parsedRunbook.lastUpdated,
    createdBy: parsedRunbook.owner,
    successRate: parsedRunbook.successRate,
    avgExecutionTime: parsedRunbook.estimatedDuration,
    usageCount: parsedRunbook.executionCount,
    lastExecuted: parsedRunbook.lastExecuted ?? undefined,
    executions: parsedRunbook.executions,
    summary: parsedRunbook.summary,
    owner: parsedRunbook.owner,
    lastUpdated: parsedRunbook.lastUpdated,
    executionCount: parsedRunbook.executionCount,
    estimatedDuration: parsedRunbook.estimatedDuration,
    relatedIncidentTypes: parsedRunbook.relatedIncidentTypes,
  })
}

export function listRunbooks() {
  return runbooksListResponseDtoSchema.parse(
    listStoredRunbooks().map(toRunbookResponseDto),
  )
}

export function getRunbookById(id: string) {
  const parsedParams = runbookRouteParamsSchema.parse({ id })
  const runbook = getStoredRunbook(parsedParams.id)

  if (!runbook) {
    throw new RunbookNotFoundError(parsedParams.id)
  }

  return toRunbookResponseDto(runbook)
}

function recalculateSuccessRate(executions: RunbookRecord['executions']) {
  const completed = executions.filter((item) => item.status !== 'in_progress')
  if (completed.length === 0) {
    return 0
  }

  const successful = completed.filter((item) => item.status === 'success').length
  return Math.round((successful / completed.length) * 100)
}

export function startRunbookExecution(
  runbookId: string,
  input: RunbookExecutionStartInput,
) {
  const parsedRunbookId = runbookRouteParamsSchema.parse({ id: runbookId }).id
  const parsedInput = runbookExecutionStartInputSchema.parse(input)
  assertActorPermission(parsedInput.startedBy, 'runbooks:execute')

  const runbook = getStoredRunbook(parsedRunbookId)
  if (!runbook) {
    throw new RunbookNotFoundError(parsedRunbookId)
  }

  const now = new Date().toISOString()
  const execution = {
    id: `exec_${randomUUID()}`,
    timestamp: now,
    startedAt: now,
    completedAt: undefined,
    startedBy: parsedInput.startedBy,
    executedBy: parsedInput.startedBy,
    duration: 'In progress',
    status: 'in_progress' as const,
    incidentId: parsedInput.incidentId,
    completedStepIds: [] as string[],
  }

  const updatedRunbook = saveStoredRunbook(
    runbookRecordSchema.parse({
      ...runbook,
      executions: [...runbook.executions, execution],
      executionCount: runbook.executionCount + 1,
      lastExecuted: now,
      lastUpdated: now,
    }),
  )

  return {
    runbook: toRunbookResponseDto(updatedRunbook),
    execution,
  }
}

export function updateRunbookExecution(
  runbookId: string,
  executionId: string,
  input: RunbookExecutionUpdateInput,
) {
  const parsedRunbookId = runbookRouteParamsSchema.parse({ id: runbookId }).id
  const parsedInput = runbookExecutionUpdateInputSchema.parse(input)
  assertActorPermission(parsedInput.updatedBy, 'runbooks:execute')

  const runbook = getStoredRunbook(parsedRunbookId)
  if (!runbook) {
    throw new RunbookNotFoundError(parsedRunbookId)
  }

  const existingExecution = runbook.executions.find((item) => item.id === executionId)
  if (!existingExecution) {
    throw new RunbookExecutionNotFoundError(parsedRunbookId, executionId)
  }

  if (
    existingExecution.status !== 'in_progress' &&
    parsedInput.status &&
    parsedInput.status !== existingExecution.status
  ) {
    throw new RunbookExecutionError(
      `Execution ${executionId} is already completed and cannot change status.`,
    )
  }

  const now = new Date()
  const updatedExecution = {
    ...existingExecution,
    completedStepIds: parsedInput.completedStepIds ?? existingExecution.completedStepIds ?? [],
    status: parsedInput.status ?? existingExecution.status,
  }

  if (updatedExecution.status !== 'in_progress') {
    updatedExecution.completedAt = updatedExecution.completedAt ?? now.toISOString()
    const startedAt = updatedExecution.startedAt ?? updatedExecution.timestamp
    const started = new Date(startedAt).getTime()
    const completed = new Date(updatedExecution.completedAt).getTime()
    if (!Number.isNaN(started) && !Number.isNaN(completed) && completed >= started) {
      const minutes = Math.max(1, Math.round((completed - started) / 60000))
      updatedExecution.duration = `${minutes} minute${minutes === 1 ? '' : 's'}`
    }
  } else {
    updatedExecution.duration = 'In progress'
  }

  const updatedExecutions = runbook.executions.map((item) =>
    item.id === executionId ? updatedExecution : item,
  )

  const updatedRunbook = saveStoredRunbook(
    runbookRecordSchema.parse({
      ...runbook,
      executions: updatedExecutions,
      successRate: recalculateSuccessRate(updatedExecutions),
      lastUpdated: now.toISOString(),
    }),
  )

  return {
    runbook: toRunbookResponseDto(updatedRunbook),
    execution: updatedExecution,
  }
}

export function getIncidentRunbookExecutionContext(incidentId: string) {
  const incident = getStoredIncident(incidentId)
  if (!incident) {
    throw new IncidentNotFoundError(incidentId)
  }

  if (!incident.assignedRunbook) {
    return incidentRunbookExecutionContextSchema.parse({
      runbookId: null,
      runbookTitle: null,
      steps: [],
      activeExecution: null,
      history: [],
    })
  }

  const runbook = getStoredRunbookByTitle(incident.assignedRunbook)
  if (!runbook) {
    return incidentRunbookExecutionContextSchema.parse({
      runbookId: null,
      runbookTitle: incident.assignedRunbook,
      steps: [],
      activeExecution: null,
      history: [],
    })
  }

  const forIncident = runbook.executions.filter((item) => item.incidentId === incident.id)
  const inProgress = forIncident.filter((item) => item.status === 'in_progress')
  const activeExecution =
    inProgress.length === 0
      ? null
      : [...inProgress].sort(
          (a, b) =>
            new Date(b.startedAt ?? b.timestamp).getTime() -
            new Date(a.startedAt ?? a.timestamp).getTime(),
        )[0] ?? null

  const history = [...forIncident]
    .filter((item) => item.status !== 'in_progress')
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.startedAt ?? b.timestamp).getTime() -
        new Date(a.completedAt ?? a.startedAt ?? a.timestamp).getTime(),
    )
    .slice(0, 5)

  return incidentRunbookExecutionContextSchema.parse({
    runbookId: runbook.id,
    runbookTitle: runbook.title,
    steps: runbook.steps,
    activeExecution,
    history,
  })
}

export function startRunbookExecutionForIncident(
  incidentId: string,
  startedBy: string,
) {
  assertActorPermission(startedBy, 'runbooks:execute')
  const incident = getStoredIncident(incidentId)
  if (!incident) {
    throw new RunbookExecutionError(`Incident ${incidentId} was not found.`)
  }

  if (!incident.assignedRunbook) {
    throw new RunbookExecutionError(
      `Incident ${incidentId} does not have an assigned runbook.`,
    )
  }

  if (incident.status === 'resolved') {
    throw new RunbookExecutionError(
      `Incident ${incidentId} is resolved and cannot start new runbook executions.`,
    )
  }

  const runbook = getStoredRunbookByTitle(incident.assignedRunbook)
  if (!runbook) {
    throw new RunbookExecutionError(
      `Assigned runbook "${incident.assignedRunbook}" was not found.`,
    )
  }

  return startRunbookExecution(runbook.id, {
    incidentId,
    startedBy,
  })
}
