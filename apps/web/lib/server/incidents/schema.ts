import { z } from 'zod'

import {
  analyticsDateRangeValues,
  type AnalyticsDateRange,
} from '@/lib/analytics/date-range'
import type {
  Incident,
  IncidentCategory,
  IncidentNote,
  IncidentReview,
  IncidentReviewActionItemStatus,
  IncidentReviewStatus,
  IncidentTimelineEvent,
  Status,
} from '@/lib/types'

export const severitySchema = z.enum(['critical', 'high', 'medium', 'low'])
export const incidentCategorySchema: z.ZodType<IncidentCategory> = z.enum([
  'application',
  'database',
  'infrastructure',
  'network',
  'security',
])
export const incidentStatusSchema: z.ZodType<Status> = z.enum([
  'open',
  'acknowledged',
  'investigating',
  'resolved',
])
export const incidentTimelineEventTypeSchema = z.enum([
  'created',
  'acknowledged',
  'updated',
  'alert_merged',
  'assigned',
  'escalated',
  'severity_changed',
  'resolved',
  'reopened',
  'comment',
])

export const incidentTimelineEventSchema: z.ZodType<IncidentTimelineEvent> = z.object(
  {
    id: z.string().min(1),
    timestamp: z.string().min(1),
    type: incidentTimelineEventTypeSchema,
    description: z.string().min(1),
    user: z.string().min(1).optional(),
  },
)

export const incidentNoteSchema: z.ZodType<IncidentNote> = z.object({
  id: z.string().min(1),
  user: z.string().min(1),
  timestamp: z.string().min(1),
  content: z.string().min(1),
})

export const incidentReviewStatusSchema: z.ZodType<IncidentReviewStatus> = z.enum([
  'not_started',
  'draft',
  'completed',
])

export const incidentReviewActionItemStatusSchema: z.ZodType<IncidentReviewActionItemStatus> =
  z.enum(['open', 'done', 'dropped'])

export const incidentReviewActionItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  owner: z.string(),
  status: incidentReviewActionItemStatusSchema,
  dueAt: z.preprocess((v) => {
    if (v === undefined || v === null) return null
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t === '' ? null : t
  }, z.union([z.string(), z.null()])),
})

export const incidentReviewSchema = z.object({
  summary: z.string(),
  rootCause: z.string(),
  followUps: z.string(),
  status: incidentReviewStatusSchema,
  actionItems: z.array(incidentReviewActionItemSchema).default([]),
})

/** Default review when none is stored (e.g. legacy rows, new incidents). */
export const emptyIncidentReview: IncidentReview = {
  summary: '',
  rootCause: '',
  followUps: '',
  status: 'not_started',
  actionItems: [],
}

export const incidentDtoSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: severitySchema,
  status: incidentStatusSchema,
  category: incidentCategorySchema,
  assignedRunbook: z.string().min(1).nullable(),
  assignedTo: z.string().min(1).nullable(),
  alertMergeCount: z.number().int().min(0).default(0),
  isMajorIncident: z.boolean().default(false),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().min(1),
  resolvedAt: z.string().datetime({ offset: true }).nullable(),
  timeline: z.array(incidentTimelineEventSchema),
  notes: z.array(incidentNoteSchema),
  review: incidentReviewSchema,
}).superRefine((incident, context) => {
  if (incident.status === 'resolved' && !incident.resolvedAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['resolvedAt'],
      message: 'Resolved incidents must include resolvedAt.',
    })
  }

  if (incident.status !== 'resolved' && incident.resolvedAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['resolvedAt'],
      message: 'Only resolved incidents can include resolvedAt.',
    })
  }
})

export const incidentsListDtoSchema = z.array(incidentDtoSchema)

export const incidentListQuerySchema = z.object({
  range: z.enum(analyticsDateRangeValues).optional(),
})

export const incidentRouteParamsSchema = z.object({
  id: z.string().trim().min(1),
})

export const incidentLifecycleActionInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate Bot'),
  note: z.string().trim().min(1).optional(),
})

export const incidentAssignInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate Bot'),
  assignee: z.string().trim().min(1),
})

export const incidentSeverityChangeInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate Bot'),
  severity: severitySchema,
})

export const incidentNoteCreateInputSchema = z.object({
  author: z.string().trim().min(1).default('OpsMate Bot'),
  content: z.string().trim().min(1),
})

export const alertIngestInputSchema = z.object({
  title: z.string().trim().min(1),
  severity: severitySchema,
  category: incidentCategorySchema,
  source: z.string().trim().min(1),
  description: z.string().trim().optional(),
  /** When set, repeat ingests with the same key merge into one open incident. */
  dedupKey: z.string().trim().min(1).max(256).optional(),
})

export const incidentMajorInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate Bot'),
  isMajor: z.boolean(),
})

export const incidentReviewUpdateInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate Bot'),
  review: incidentReviewSchema,
})

export type IncidentDto = Incident
export type IncidentListQuery = {
  range?: AnalyticsDateRange
}
export type IncidentRouteParams = z.infer<typeof incidentRouteParamsSchema>
export type IncidentLifecycleActionInput = z.infer<
  typeof incidentLifecycleActionInputSchema
>
export type IncidentAssignInput = z.infer<typeof incidentAssignInputSchema>
export type IncidentSeverityChangeInput = z.infer<
  typeof incidentSeverityChangeInputSchema
>
export type IncidentNoteCreateInput = z.infer<
  typeof incidentNoteCreateInputSchema
>
export type AlertIngestInput = z.infer<typeof alertIngestInputSchema>
export type IncidentMajorInput = z.infer<typeof incidentMajorInputSchema>
export type IncidentReviewUpdateInput = z.infer<typeof incidentReviewUpdateInputSchema>
