import { runbooks as mockRunbooks } from '@/lib/mock-data'
import { buildApiUrl } from '@/lib/config'
import type {
  Runbook,
  RunbookExecution,
  RunbookExecutionStatus,
  RunbookStep,
  Severity,
} from '@/lib/types'

export type RunbooksDataSource = 'backend' | 'mock'

export interface RunbookListResult {
  runbooks: Runbook[]
  source: RunbooksDataSource
  warning?: string
}

export interface RunbookResult {
  runbook: Runbook
  source: RunbooksDataSource
  warning?: string
}

const REQUEST_TIMEOUT_MS = 6000

export const RUNBOOKS_FALLBACK_MESSAGE =
  'Live runbook service is unavailable. Showing demo data instead.'

class RunbooksApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'RunbooksApiError'
  }
}

type RunbookApiResponse = Partial<
  Omit<Runbook, 'steps' | 'executions' | 'description' | 'createdBy' | 'updatedAt'>
> & {
  id?: string
  title?: string | null
  category?: string | null
  description?: string | null
  summary?: string | null
  severity?: Severity | string | null
  tags?: string[] | null
  steps?: RunbookStep[] | null
  createdAt?: string | null
  updatedAt?: string | null
  lastUpdated?: string | null
  createdBy?: string | null
  owner?: string | null
  successRate?: number | null
  avgExecutionTime?: string | null
  estimatedDuration?: string | null
  usageCount?: number | null
  executionCount?: number | null
  lastExecuted?: string | null
  executions?: RunbookExecution[] | null
  relatedIncidentTypes?: string[] | null
}

const VALID_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']
const VALID_EXECUTION_STATUSES: RunbookExecutionStatus[] = [
  'success',
  'failed',
  'partial',
]

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidIsoDate(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value))
}

function getValidSeverity(value: unknown, fallback?: Severity): Severity {
  if (typeof value === 'string' && VALID_SEVERITIES.includes(value as Severity)) {
    return value as Severity
  }

  return fallback ?? 'medium'
}

function normalizeRunbookStep(step: RunbookStep, fallback?: RunbookStep): RunbookStep {
  return {
    id: isNonEmptyString(step.id) ? step.id : fallback?.id ?? 'step',
    order:
      typeof step.order === 'number' && Number.isFinite(step.order)
        ? step.order
        : fallback?.order ?? 1,
    title: isNonEmptyString(step.title) ? step.title : fallback?.title ?? 'Untitled step',
    description: isNonEmptyString(step.description)
      ? step.description
      : fallback?.description ?? 'No step description available.',
    command: isNonEmptyString(step.command) ? step.command : fallback?.command,
    expectedOutput: isNonEmptyString(step.expectedOutput)
      ? step.expectedOutput
      : fallback?.expectedOutput,
  }
}

function normalizeRunbookExecution(
  execution: RunbookExecution,
  fallback?: RunbookExecution,
): RunbookExecution {
  return {
    id: isNonEmptyString(execution.id) ? execution.id : fallback?.id ?? 'execution',
    timestamp: isValidIsoDate(execution.timestamp)
      ? execution.timestamp
      : fallback?.timestamp ?? new Date().toISOString(),
    executedBy: isNonEmptyString(execution.executedBy)
      ? execution.executedBy
      : fallback?.executedBy ?? 'Unknown',
    duration: isNonEmptyString(execution.duration)
      ? execution.duration
      : fallback?.duration ?? 'Unknown',
    status:
      typeof execution.status === 'string' &&
      VALID_EXECUTION_STATUSES.includes(execution.status as RunbookExecutionStatus)
        ? (execution.status as RunbookExecutionStatus)
        : (fallback?.status ?? 'success'),
    incidentId: isNonEmptyString(execution.incidentId)
      ? execution.incidentId
      : fallback?.incidentId,
  }
}

function normalizeRunbook(
  runbook: RunbookApiResponse,
  fallback?: Runbook,
): Runbook {
  const steps = Array.isArray(runbook.steps)
    ? runbook.steps.map((step, index) =>
        normalizeRunbookStep(step, fallback?.steps[index]),
      )
    : (fallback?.steps ?? []).map((step) => normalizeRunbookStep(step))

  const executions = Array.isArray(runbook.executions)
    ? runbook.executions.map((execution, index) =>
        normalizeRunbookExecution(execution, fallback?.executions[index]),
      )
    : (fallback?.executions ?? []).map((execution) =>
        normalizeRunbookExecution(execution),
      )

  return {
    id: isNonEmptyString(runbook.id) ? runbook.id : fallback?.id ?? 'RB-UNKNOWN',
    title: isNonEmptyString(runbook.title)
      ? runbook.title
      : fallback?.title ?? 'Untitled runbook',
    category: isNonEmptyString(runbook.category)
      ? runbook.category
      : fallback?.category ?? 'General',
    description: isNonEmptyString(runbook.description)
      ? runbook.description
      : isNonEmptyString(runbook.summary)
        ? runbook.summary
        : fallback?.description ?? 'No runbook summary available.',
    severity: getValidSeverity(runbook.severity, fallback?.severity),
    tags: Array.isArray(runbook.tags)
      ? runbook.tags.filter(isNonEmptyString)
      : (fallback?.tags ?? []),
    steps,
    createdAt: isValidIsoDate(runbook.createdAt)
      ? runbook.createdAt
      : fallback?.createdAt ?? new Date().toISOString(),
    updatedAt: isValidIsoDate(runbook.updatedAt)
      ? runbook.updatedAt
      : isValidIsoDate(runbook.lastUpdated)
        ? runbook.lastUpdated
        : fallback?.updatedAt ?? new Date().toISOString(),
    createdBy: isNonEmptyString(runbook.createdBy)
      ? runbook.createdBy
      : isNonEmptyString(runbook.owner)
        ? runbook.owner
        : fallback?.createdBy ?? 'OpsMate',
    successRate:
      typeof runbook.successRate === 'number'
        ? runbook.successRate
        : (fallback?.successRate ?? 0),
    avgExecutionTime: isNonEmptyString(runbook.avgExecutionTime)
      ? runbook.avgExecutionTime
      : isNonEmptyString(runbook.estimatedDuration)
        ? runbook.estimatedDuration
        : fallback?.avgExecutionTime ?? 'Unknown',
    usageCount:
      typeof runbook.usageCount === 'number'
        ? runbook.usageCount
        : typeof runbook.executionCount === 'number'
          ? runbook.executionCount
          : (fallback?.usageCount ?? 0),
    lastExecuted: isValidIsoDate(runbook.lastExecuted)
      ? runbook.lastExecuted
      : fallback?.lastExecuted,
    executions,
  }
}

function cloneRunbook(runbook: Runbook): Runbook {
  return normalizeRunbook(runbook, runbook)
}

function cloneRunbooks(runbooks: Runbook[]) {
  return runbooks.map(cloneRunbook)
}

function getMockRunbookById(id: string) {
  const runbook = mockRunbooks.find((item) => item.id === id)
  return runbook ? cloneRunbook(runbook) : null
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl(`/api/runbooks${path}`), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new RunbooksApiError(
        `Runbooks request failed with status ${response.status}.`,
        response.status,
      )
    }

    if (response.status === 204) {
      return null
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof RunbooksApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RunbooksApiError('Runbooks request timed out.')
    }

    throw new RunbooksApiError('Unable to reach the runbooks service.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function getRunbooks(): Promise<Runbook[]> {
  const runbooks = await requestJson<RunbookApiResponse[]>('')
  return runbooks
    ? runbooks.map((runbook) =>
        normalizeRunbook(
          runbook,
          isNonEmptyString(runbook.id) ? getMockRunbookById(runbook.id) ?? undefined : undefined,
        ),
      )
    : []
}

export async function getRunbook(id: string): Promise<Runbook> {
  const runbook = await requestJson<RunbookApiResponse>(`/${id}`)

  if (!runbook) {
    throw new RunbooksApiError(`Runbook ${id} returned no data.`)
  }

  return normalizeRunbook(runbook, getMockRunbookById(id) ?? undefined)
}

export async function loadRunbooks(): Promise<RunbookListResult> {
  try {
    return {
      runbooks: await getRunbooks(),
      source: 'backend',
    }
  } catch {
    return {
      runbooks: cloneRunbooks(mockRunbooks),
      source: 'mock',
      warning: RUNBOOKS_FALLBACK_MESSAGE,
    }
  }
}

export async function loadRunbook(
  id: string,
  fallbackRunbook?: Runbook,
): Promise<RunbookResult> {
  try {
    return {
      runbook: await getRunbook(id),
      source: 'backend',
    }
  } catch {
    const runbook = fallbackRunbook ? cloneRunbook(fallbackRunbook) : getMockRunbookById(id)

    if (!runbook) {
      throw new RunbooksApiError(`Unable to load runbook ${id}.`)
    }

    return {
      runbook,
      source: 'mock',
      warning: RUNBOOKS_FALLBACK_MESSAGE,
    }
  }
}
