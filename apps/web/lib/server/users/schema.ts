import { z } from 'zod'

import type { User, UserRole, UserStatus } from '@/lib/types'

const userRoleSchema: z.ZodType<UserRole> = z.enum([
  'admin',
  'manager',
  'responder',
  'viewer',
])

const userStatusSchema: z.ZodType<UserStatus> = z.enum(['active', 'inactive'])

export const userSchema: z.ZodType<User> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  joinedAt: z.string().min(1),
})

export const usersListSchema = z.array(userSchema)
