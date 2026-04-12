import type { UserRole } from '@/lib/types'

/**
 * Product-facing permission keys. Roles map to capabilities without SSO yet.
 * "Engineer" in UI = manager | responder (operational).
 */
export type AppPermission =
  | 'incidents:write'
  | 'runbooks:execute'
  | 'notifications:replay'
  | 'team:prefs'
  | 'team:roles'

const ENGINEER_ROLES: ReadonlySet<UserRole> = new Set(['responder'])

export function roleHasPermission(role: UserRole, permission: AppPermission): boolean {
  if (permission === 'team:roles') {
    return role === 'admin'
  }

  if (role === 'admin' || role === 'manager') {
    return true
  }

  if (role === 'viewer') {
    return false
  }

  if (ENGINEER_ROLES.has(role)) {
    if (permission === 'team:prefs') {
      return false
    }
    return true
  }

  return false
}

export function permissionLabel(permission: AppPermission): string {
  switch (permission) {
    case 'incidents:write':
      return 'Incident changes'
    case 'runbooks:execute':
      return 'Runbook execution'
    case 'notifications:replay':
      return 'Notification replay'
    case 'team:prefs':
      return 'Team notification preferences'
    case 'team:roles':
      return 'Team roles'
    default:
      return permission
  }
}
