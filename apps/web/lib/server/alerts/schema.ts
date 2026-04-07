import { z } from 'zod'

import { severitySchema } from '@/lib/server/incidents/schema'
import type { AlertActivityFeed, AlertActivityItem } from '@/lib/types'

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
