import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { UnauthenticatedError } from '@/lib/server/auth/errors'
import { requireSessionActorName } from '@/lib/server/auth/session'
import {
  assertActorPermission,
  ForbiddenActionError,
} from '@/lib/server/permissions'
import {
  userPatchBodySchema,
  userRouteParamsSchema,
} from '@/lib/server/users/schema'
import {
  LastActiveAdminRemovalError,
  patchStoredUser,
} from '@/lib/server/users/store'

const SYSTEM_USER_ID = 'sys-opsmate-bot'

export const dynamic = 'force-dynamic'

interface UserIdRouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: Request, context: UserIdRouteContext) {
  try {
    const params = userRouteParamsSchema.parse(await context.params)
    const json: unknown = await request.json()
    const body = userPatchBodySchema.parse(json)

    const hasPrefs =
      body.notificationPrefs && Object.keys(body.notificationPrefs).length > 0
    const hasRole = body.role !== undefined

    if (!hasPrefs && !hasRole) {
      return NextResponse.json(
        {
          error: 'USER_PATCH_INVALID',
          message:
            'Provide notification preferences and/or a role to update.',
        },
        { status: 400 },
      )
    }

    const actor = await requireSessionActorName()

    if (hasPrefs) {
      assertActorPermission(actor, 'team:prefs')
    }
    if (hasRole) {
      assertActorPermission(actor, 'team:roles')
    }

    if (hasRole && params.id === SYSTEM_USER_ID) {
      return NextResponse.json(
        {
          error: 'USER_PATCH_INVALID',
          message: 'The system user role cannot be changed.',
        },
        { status: 400 },
      )
    }

    const updated = patchStoredUser(params.id, {
      notificationPrefs: hasPrefs ? body.notificationPrefs : undefined,
      role: hasRole ? body.role : undefined,
    })

    if (!updated) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: `User ${params.id} was not found.`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'USER_PATCH_INVALID',
          message: 'Request body is invalid.',
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (error instanceof UnauthenticatedError) {
      return NextResponse.json(
        {
          error: 'USER_ACTION_UNAUTHENTICATED',
          message: error.message,
        },
        { status: 401 },
      )
    }

    if (error instanceof ForbiddenActionError) {
      return NextResponse.json(
        {
          error: 'USER_ACTION_FORBIDDEN',
          message: error.message,
        },
        { status: 403 },
      )
    }

    if (error instanceof LastActiveAdminRemovalError) {
      return NextResponse.json(
        {
          error: 'USER_LAST_ADMIN',
          message: error.message,
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: 'USER_PATCH_FAILED',
        message: 'Unable to update user.',
      },
      { status: 500 },
    )
  }
}
