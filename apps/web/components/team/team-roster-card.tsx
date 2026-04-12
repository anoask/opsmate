'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ComponentProps } from 'react'
import Link from 'next/link'
import { Mail, Users } from 'lucide-react'
import { useActor } from '@/components/actor-context'
import { fetchUsers, patchUser } from '@/lib/api/users'
import { roleDescriptions, USER_ROLES_ORDERED } from '@/lib/role-descriptions'
import { teamMembers } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import type { User, UserRole } from '@/lib/types'

const SYSTEM_USER_ID = 'sys-opsmate-bot'

function roleBadgeVariant(
  role: User['role'],
): ComponentProps<typeof Badge>['variant'] {
  const map: Record<User['role'], ComponentProps<typeof Badge>['variant']> = {
    admin: 'destructive',
    manager: 'default',
    responder: 'secondary',
    viewer: 'outline',
  }
  return map[role]
}

export function TeamRosterCard() {
  const { can, refreshSession, refreshUsers, sessionUser } = useActor()
  const [users, setUsers] = useState<User[]>([])
  const [source, setSource] = useState<'live' | 'demo'>('live')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const list = await fetchUsers()
      setUsers(list)
      setSource('live')
    } catch {
      setUsers(teamMembers)
      setSource('demo')
      setLoadError('Live team directory unavailable. Showing demo roster.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const canEditTeamPrefs = can('team:prefs')
  const canEditRoles = can('team:roles')

  const handlePrefChange = async (
    userId: string,
    key: keyof User['notificationPrefs'],
    checked: boolean,
  ) => {
    if (source !== 'live' || !canEditTeamPrefs) {
      return
    }
    setUpdatingId(userId)
    try {
      const updated = await patchUser(userId, {
        notificationPrefs: { [key]: checked },
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch {
      setLoadError('Could not save preferences. Refresh and try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    if (source !== 'live' || !canEditRoles) {
      return
    }
    setUpdatingId(userId)
    try {
      const updated = await patchUser(userId, { role })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      if (sessionUser?.id === userId) {
        void refreshSession()
        void refreshUsers()
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.message.trim()
          ? e.message.trim()
          : 'Could not update role. Try again.'
      setLoadError(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Card className="bg-card border-border shadow-black/20">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Team & ownership
          </CardTitle>
          <CardDescription>
            Roster used for incident assignment and actor display. Each person has a role that drives
            in-product permissions; admins may change roles here. Toggles control whether Slack sees a
            category: if no active teammate opts in, that category is skipped for the shared webhook
            (in-app notifications still appear for everyone).
          </CardDescription>
        </div>
        {source === 'live' ? (
          <Badge variant="outline" className="shrink-0 border-emerald-500/40 text-emerald-600/90">
            Live directory
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 text-muted-foreground">
            Demo roster
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loadError ? (
          <p className="text-sm text-amber-600/90">{loadError}</p>
        ) : null}
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading team…
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((member) => {
              const isSystem = member.id === SYSTEM_USER_ID
              const busy = updatingId === member.id

              return (
                <div
                  key={member.id}
                  className="rounded-lg border border-border/60 bg-secondary/35 p-4 shadow-sm shadow-black/5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-foreground">{member.name}</h4>
                        <Badge
                          variant={roleBadgeVariant(member.role)}
                          className="capitalize text-xs"
                        >
                          {member.role}
                        </Badge>
                        {member.status === 'inactive' ? (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        ) : null}
                        {isSystem ? (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        ) : null}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">{member.id}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {member.joinedAt}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {roleDescriptions[member.role].summary}
                      </p>
                      {!isSystem ? (
                        <div className="space-y-1.5 pt-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Role
                          </Label>
                          {source === 'live' && canEditRoles ? (
                            <Select
                              value={member.role}
                              disabled={busy}
                              onValueChange={(value) =>
                                void handleRoleChange(member.id, value as UserRole)
                              }
                            >
                              <SelectTrigger size="sm" className="h-8 w-full max-w-[220px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {USER_ROLES_ORDERED.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {roleDescriptions[r].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : source === 'live' ? (
                            <p className="text-[11px] text-muted-foreground">
                              Only admins can change roles. Your role is shown on the badge above.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isSystem ? (
                    <p className="mt-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                      Used for automated timeline actions and notifications. Not assignable as a
                      primary owner.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Notification preferences
                      </p>
                      {source === 'live' && !canEditTeamPrefs ? (
                        <p className="text-[11px] text-muted-foreground">
                          Admins and managers can edit these. Responders and viewers are read-only here.
                        </p>
                      ) : null}
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/50 px-3 py-2">
                          <Label
                            htmlFor={`${member.id}-critical`}
                            className="text-xs font-normal leading-snug text-foreground"
                          >
                            Critical creates
                          </Label>
                          <Switch
                            id={`${member.id}-critical`}
                            checked={member.notificationPrefs.notifyOnCritical}
                            disabled={source !== 'live' || !canEditTeamPrefs || busy}
                            onCheckedChange={(checked) =>
                              void handlePrefChange(member.id, 'notifyOnCritical', checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/50 px-3 py-2">
                          <Label
                            htmlFor={`${member.id}-assign`}
                            className="text-xs font-normal leading-snug text-foreground"
                          >
                            Assignments
                          </Label>
                          <Switch
                            id={`${member.id}-assign`}
                            checked={member.notificationPrefs.notifyOnAssignment}
                            disabled={source !== 'live' || !canEditTeamPrefs || busy}
                            onCheckedChange={(checked) =>
                              void handlePrefChange(member.id, 'notifyOnAssignment', checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/50 px-3 py-2">
                          <Label
                            htmlFor={`${member.id}-life`}
                            className="text-xs font-normal leading-snug text-foreground"
                          >
                            Resolve / reopen
                          </Label>
                          <Switch
                            id={`${member.id}-life`}
                            checked={member.notificationPrefs.notifyOnLifecycle}
                            disabled={source !== 'live' || !canEditTeamPrefs || busy}
                            onCheckedChange={(checked) =>
                              void handlePrefChange(member.id, 'notifyOnLifecycle', checked)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {!isLoading && source === 'live' ? (
          <div className="flex justify-end border-t border-border/50 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh
            </Button>
          </div>
        ) : null}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          This directory is the source of truth for{' '}
          <Link href="/incidents" className="text-primary underline-offset-2 hover:underline">
            incident assignment
          </Link>{' '}
          and session sign-in. Fine-grained enterprise RBAC can layer on later.
        </p>
      </CardContent>
    </Card>
  )
}
