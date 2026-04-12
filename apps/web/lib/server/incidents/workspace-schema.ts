import { z } from 'zod'

import { alertHistoryItemSchema } from '@/lib/server/alerts/schema'
import { incidentNotificationSchema } from '@/lib/server/notifications/schema'
import type { IncidentWorkspaceEnrichment } from '@/lib/types'

export const incidentWorkspaceEnrichmentSchema: z.ZodType<IncidentWorkspaceEnrichment> =
  z.object({
    alertIngests: z.array(alertHistoryItemSchema),
    notifications: z.array(incidentNotificationSchema),
  })
