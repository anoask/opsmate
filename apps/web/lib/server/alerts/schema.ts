import { z } from 'zod'

import { severitySchema } from '@/lib/server/incidents/schema'
import type {
  AlertActivityFeed,
  AlertActivityItem,
  AlertHistoryFeed,
  AlertHistoryItem,
} from '@/lib/types'

export const alertActivityTypeSchema: z.ZodType<AlertActivityItem['type']> = z.enum([
  'incident_created',
  'alert_merged',
])

export const alertActivityItemSchema: z.ZodType<AlertActivityItem> = z.object({
  id: z.string().min(1),
  incidentId: z.string().min(1),
  incidentTitle: z.string().min(1),
  incidentSeverity: severitySchema,
  incidentSource: z.string().min(1),
  type: alertActivityTypeSchema,
  description: z.string().min(1),
  mergeCount: z.number().int().min(0),
  createdAt: z.string().datetime({ offset: true }),
})

export const alertActivityFeedSchema: z.ZodType<AlertActivityFeed> = z.object({
  items: z.array(alertActivityItemSchema),
})

export const alertActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(25).default(10),
})

export const alertHistoryDispositionSchema: z.ZodType<AlertHistoryItem['disposition']> = z.enum(
  ['incident_created', 'incident_merged'],
)

export const alertHistoryItemSchema: z.ZodType<AlertHistoryItem> = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  category: z.enum(['application', 'database', 'infrastructure', 'network', 'security']),
  title: z.string().min(1),
  severity: severitySchema,
  description: z.string().min(1),
  dedupKey: z.string().min(1),
  disposition: alertHistoryDispositionSchema,
  incidentId: z.string().min(1),
  ingestedAt: z.string().datetime({ offset: true }),
})

export const alertHistoryFeedSchema: z.ZodType<AlertHistoryFeed> = z.object({
  items: z.array(alertHistoryItemSchema),
})

export const alertHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  disposition: alertHistoryDispositionSchema.optional(),
})
