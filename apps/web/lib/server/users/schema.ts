import { z } from 'zod'

import type { User, UserNotificationPrefs, UserRole, UserStatus } from '@/lib/types'

const userRoleSchema: z.ZodType<UserRole> = z.enum([
  'admin',
  'manager',
  'responder',
  'viewer',
])

const userStatusSchema: z.ZodType<UserStatus> = z.enum(['active', 'inactive'])

export const userNotificationPrefsSchema: z.ZodType<UserNotificationPrefs> = z.object({
  notifyOnCritical: z.boolean(),
  notifyOnAssignment: z.boolean(),
  notifyOnLifecycle: z.boolean(),
})

export const userSchema: z.ZodType<User> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  joinedAt: z.string().min(1),
  notificationPrefs: userNotificationPrefsSchema,
})

export const usersListSchema = z.array(userSchema)

export const userNotificationPrefsPatchSchema = z
  .object({
    notifyOnCritical: z.boolean(),
    notifyOnAssignment: z.boolean(),
    notifyOnLifecycle: z.boolean(),
  })
  .partial()

export const userRouteParamsSchema = z.object({
  id: z.string().trim().min(1),
})

export const userPatchBodySchema = z.object({
  notificationPrefs: userNotificationPrefsPatchSchema.optional(),
  role: userRoleSchema.optional(),
})
