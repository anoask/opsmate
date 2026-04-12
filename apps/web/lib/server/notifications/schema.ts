import { z } from 'zod'

import { severitySchema } from '@/lib/server/incidents/schema'
import type {
  IncidentNotification,
  IncidentNotificationFeed,
  IncidentNotificationType,
  NotificationCenterFeed,
  NotificationCenterItem,
  SlackDeliveryStatus,
} from '@/lib/types'

export const incidentNotificationTypeSchema: z.ZodType<IncidentNotificationType> =
  z.enum([
    'incident_created_critical',
    'incident_assigned',
    'incident_reopened',
    'incident_resolved',
    'incident_major_updated',
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

export const slackDeliveryStatusSchema: z.ZodType<SlackDeliveryStatus> = z.enum([
  'delivered',
  'failed',
  'skipped',
  'not_attempted',
])

export const notificationCenterItemSchema: z.ZodType<NotificationCenterItem> = z.object({
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
  slackDeliveryStatus: slackDeliveryStatusSchema,
  slackAttemptedAt: z.string().datetime({ offset: true }).nullable(),
  slackDeliveryDetail: z.string().nullable(),
  retryEligible: z.boolean(),
})

export const notificationCenterFeedSchema: z.ZodType<NotificationCenterFeed> = z.object({
  items: z.array(notificationCenterItemSchema),
  unreadCount: z.number().int().min(0),
})

export const notificationCenterQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export type IncidentNotificationsQuery = z.infer<
  typeof incidentNotificationsQuerySchema
>
