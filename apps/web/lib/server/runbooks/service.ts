import {
  getStoredRunbook,
  listStoredRunbooks,
} from '@/lib/server/runbooks/store'
import {
  runbookRecordSchema,
  runbookResponseDtoSchema,
  runbookRouteParamsSchema,
  runbooksListResponseDtoSchema,
  type RunbookRecord,
} from '@/lib/server/runbooks/schema'

export class RunbookNotFoundError extends Error {
  constructor(id: string) {
    super(`Runbook ${id} was not found.`)
    this.name = 'RunbookNotFoundError'
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
