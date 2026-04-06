import { z } from 'zod'

import { severitySchema } from '@/lib/server/incidents/schema'
import type {
  IncidentNotification,
  IncidentNotificationFeed,
  IncidentNotificationType,
} from '@/lib/types'

export const incidentNotificationTypeSchema: z.ZodType<IncidentNotificationType> =
  z.enum([
    'incident_created_critical',
    'incident_assigned',
    'incident_reopened',
    'incident_resolved',
  ])

export const incidentNotificationSchema: z.ZodType<IncidentNotification> = z.object({
  id: z.string().min(1),
  incidentId: z.string().min(1),
  eventId: z.string().min(1).nullable(),
  type: incidentNotificationTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  incidentTitle: z.string().min(1),
  incidentSeverity: severitySchema,
  createdAt: z.string().datetime({ offset: true }),
  readAt: z.string().datetime({ offset: true }).nullable(),
})

export const incidentNotificationFeedSchema: z.ZodType<IncidentNotificationFeed> =
  z.object({
    notifications: z.array(incidentNotificationSchema),
    unreadCount: z.number().int().min(0),
  })

export const incidentNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(25).default(8),
})

export type IncidentNotificationsQuery = z.infer<
  typeof incidentNotificationsQuerySchema
>
