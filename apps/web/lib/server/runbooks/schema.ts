import { z } from 'zod'

import type {
  Runbook,
  RunbookExecution,
  RunbookExecutionStatus,
  RunbookStep,
  IncidentRunbookExecutionContext,
  Severity,
} from '@/lib/types'

export interface RunbookResponseDto extends Runbook {
  summary: string
  owner: string
  lastUpdated: string
  executionCount: number
  estimatedDuration: string
  relatedIncidentTypes: string[]
}

export interface RunbookRecord {
  id: string
  title: string
  category: string
  severity: Severity
  summary: string
  tags: string[]
  owner: string
  lastUpdated: string
  successRate: number
  executionCount: number
  estimatedDuration: string
  relatedIncidentTypes: string[]
  steps: RunbookStep[]
  executions: RunbookExecution[]
  createdAt: string
  lastExecuted: string | null
}

const severitySchema: z.ZodType<Severity> = z.enum([
  'critical',
  'high',
  'medium',
  'low',
])

const runbookExecutionStatusSchema: z.ZodType<RunbookExecutionStatus> = z.enum([
  'in_progress',
  'success',
  'failed',
  'partial',
])

const runbookStepSchema: z.ZodType<RunbookStep> = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  command: z.string().min(1).optional(),
  expectedOutput: z.string().min(1).optional(),
})

const runbookExecutionSchema: z.ZodType<RunbookExecution> = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  executedBy: z.string().min(1),
  duration: z.string().min(1),
  status: runbookExecutionStatusSchema,
  incidentId: z.string().min(1).optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  startedBy: z.string().min(1).optional(),
  completedStepIds: z.array(z.string().min(1)).optional(),
})

export const runbookRecordSchema: z.ZodType<RunbookRecord> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  severity: severitySchema,
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)),
  owner: z.string().min(1),
  lastUpdated: z.string().datetime({ offset: true }),
  successRate: z.number().min(0).max(100),
  executionCount: z.number().int().nonnegative(),
  estimatedDuration: z.string().min(1),
  relatedIncidentTypes: z.array(z.string().min(1)),
  steps: z.array(runbookStepSchema),
  executions: z.array(runbookExecutionSchema),
  createdAt: z.string().datetime({ offset: true }),
  lastExecuted: z.string().datetime({ offset: true }).nullable(),
})

export const runbookResponseDtoSchema: z.ZodType<RunbookResponseDto> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  severity: severitySchema,
  tags: z.array(z.string().min(1)),
  steps: z.array(runbookStepSchema),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  createdBy: z.string().min(1),
  successRate: z.number().min(0).max(100),
  avgExecutionTime: z.string().min(1),
  usageCount: z.number().int().nonnegative(),
  lastExecuted: z.string().datetime({ offset: true }).optional(),
  executions: z.array(runbookExecutionSchema),
  summary: z.string().min(1),
  owner: z.string().min(1),
  lastUpdated: z.string().datetime({ offset: true }),
  executionCount: z.number().int().nonnegative(),
  estimatedDuration: z.string().min(1),
  relatedIncidentTypes: z.array(z.string().min(1)),
})

export const runbooksListResponseDtoSchema: z.ZodType<RunbookResponseDto[]> = z.array(
  runbookResponseDtoSchema,
)

export const runbookRouteParamsSchema = z.object({
  id: z.string().trim().min(1),
})

export const runbookExecutionStartInputSchema = z.object({
  incidentId: z.string().trim().min(1),
  startedBy: z.string().trim().min(1).default('OpsMate Bot'),
})

export const runbookExecutionUpdateInputSchema = z.object({
  updatedBy: z.string().trim().min(1).default('OpsMate Bot'),
  status: runbookExecutionStatusSchema.optional(),
  completedStepIds: z.array(z.string().trim().min(1)).optional(),
})

export const runbookExecutionRouteParamsSchema = z.object({
  id: z.string().trim().min(1),
  executionId: z.string().trim().min(1),
})

export const incidentRunbookExecutionContextSchema: z.ZodType<IncidentRunbookExecutionContext> =
  z.object({
    runbookId: z.string().min(1).nullable(),
    runbookTitle: z.string().min(1).nullable(),
    steps: z.array(runbookStepSchema),
    activeExecution: runbookExecutionSchema.nullable(),
    history: z.array(runbookExecutionSchema),
  })

export type RunbookRouteParams = z.infer<typeof runbookRouteParamsSchema>
export type RunbookExecutionStartInput = z.infer<
  typeof runbookExecutionStartInputSchema
>
export type RunbookExecutionUpdateInput = z.infer<
  typeof runbookExecutionUpdateInputSchema
>
