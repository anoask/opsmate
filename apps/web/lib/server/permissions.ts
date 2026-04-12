import { roleHasPermission, type AppPermission } from '@/lib/permissions'
import { getStoredUserRoleForActor } from '@/lib/server/users/store'

export class ForbiddenActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenActionError'
  }
}

export function assertActorPermission(actor: string, permission: AppPermission) {
  const trimmed = actor.trim()
  const role = getStoredUserRoleForActor(trimmed)

  if (role === null) {
    throw new ForbiddenActionError(
      'This action requires a signed-in team member with a recognized role.',
    )
  }

  if (!roleHasPermission(role, permission)) {
    const hint =
      permission === 'team:roles'
        ? 'Only admins can change roles; ask an admin if you need access.'
        : 'Ask an admin or manager if you need access.'
    throw new ForbiddenActionError(
      `Your role (${role}) cannot perform this action yet. ${hint}`,
    )
  }
}
