import type { UserRole } from '@/lib/types'

/** Ordered for selects and docs; keep aligned with `UserRole`. */
export const USER_ROLES_ORDERED: readonly UserRole[] = [
  'admin',
  'manager',
  'responder',
  'viewer',
] as const

export const roleDescriptions: Record<
  UserRole,
  { label: string; summary: string }
> = {
  admin: {
    label: 'Admin',
    summary:
      'Full access, including changing team roles and Slack notification routing for others.',
  },
  manager: {
    label: 'Manager',
    summary:
      'Leads response: incidents, runbooks, notification prefs for the team — not role changes.',
  },
  responder: {
    label: 'Responder',
    summary: 'Operational work on incidents and runbooks; read-only on team settings.',
  },
  viewer: {
    label: 'Viewer',
    summary: 'Read-only access to incidents and workspace context.',
  },
}
