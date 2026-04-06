import { z } from 'zod'

import {
  analyticsDateRangeValues,
  type AnalyticsDateRange,
} from '@/lib/analytics/date-range'
import type {
  Incident,
  IncidentCategory,
  IncidentNote,
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

export const incidentDtoSchema: z.ZodType<Incident> = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: severitySchema,
  status: incidentStatusSchema,
  category: incidentCategorySchema,
  assignedRunbook: z.string().min(1).nullable(),
  assignedTo: z.string().min(1).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().min(1),
  resolvedAt: z.string().datetime({ offset: true }).nullable(),
  timeline: z.array(incidentTimelineEventSchema),
  notes: z.array(incidentNoteSchema),
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

export const incidentsListDtoSchema: z.ZodType<Incident[]> = z.array(
  incidentDtoSchema,
)

export const incidentListQuerySchema = z.object({
  range: z.enum(analyticsDateRangeValues).optional(),
})

export const incidentRouteParamsSchema = z.object({
  id: z.string().trim().min(1),
})

export const incidentLifecycleActionInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate'),
  note: z.string().trim().min(1).optional(),
})

export const incidentAssignInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate'),
  assignee: z.string().trim().min(1),
})

export const incidentSeverityChangeInputSchema = z.object({
  actor: z.string().trim().min(1).default('OpsMate'),
  severity: severitySchema,
})

export const incidentNoteCreateInputSchema = z.object({
  author: z.string().trim().min(1).default('OpsMate'),
  content: z.string().trim().min(1),
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
