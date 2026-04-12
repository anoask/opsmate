'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchUsers } from '@/lib/api/users'
import { type AppPermission, roleHasPermission } from '@/lib/permissions'
import type { User, UserRole } from '@/lib/types'

/** System display name for filters when session is not yet loaded (should be rare on authed routes). */
export const OPSMATE_DEFAULT_ACTOR_NAME = 'OpsMate Bot'

type ActorContextValue = {
  actorName: string
  sessionUser: User | null
  sessionReady: boolean
  users: User[]
  usersLoaded: boolean
  currentRole: UserRole | null
  can: (permission: AppPermission) => boolean
  refreshUsers: () => Promise<void>
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

const ActorContext = createContext<ActorContextValue | null>(null)

export function ActorProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<User | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      const data = (await res.json()) as { user: User | null }
      setSessionUser(data.user)
    } catch {
      setSessionUser(null)
    } finally {
      setSessionReady(true)
    }
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      const list = await fetchUsers()
      setUsers(list)
    } catch {
      setUsers([])
    } finally {
      setUsersLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  useEffect(() => {
    void refreshUsers()
  }, [refreshUsers])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }, [])

  const actorName = sessionUser?.name ?? OPSMATE_DEFAULT_ACTOR_NAME

  const currentRole = useMemo((): UserRole | null => {
    return sessionUser?.role ?? null
  }, [sessionUser])

  const can = useCallback(
    (permission: AppPermission) => {
      if (!sessionReady || !sessionUser) {
        return false
      }
      return roleHasPermission(sessionUser.role, permission)
    },
    [sessionReady, sessionUser],
  )

  const value = useMemo(
    () => ({
      actorName,
      sessionUser,
      sessionReady,
      users,
      usersLoaded,
      currentRole,
      can,
      refreshUsers,
      refreshSession,
      signOut,
    }),
    [
      actorName,
      sessionUser,
      sessionReady,
      users,
      usersLoaded,
      currentRole,
      can,
      refreshUsers,
      refreshSession,
      signOut,
    ],
  )

  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>
}

export function useActor() {
  const ctx = useContext(ActorContext)
  if (!ctx) {
    throw new Error('useActor must be used within ActorProvider')
  }
  return ctx
}
