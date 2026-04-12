import { describe, expect, it } from 'vitest'

import { isPublicApiPath } from '@/lib/server/auth/api-access-policy'

describe('isPublicApiPath', () => {
  it('allows health and ingest without session', () => {
    expect(isPublicApiPath('/api/health', 'GET')).toBe(true)
    expect(isPublicApiPath('/api/ingest/alerts', 'POST')).toBe(true)
  })

  it('allows login POST, session GET, logout POST only', () => {
    expect(isPublicApiPath('/api/auth/login', 'POST')).toBe(true)
    expect(isPublicApiPath('/api/auth/login', 'GET')).toBe(false)

    expect(isPublicApiPath('/api/auth/session', 'GET')).toBe(true)
    expect(isPublicApiPath('/api/auth/session', 'POST')).toBe(false)

    expect(isPublicApiPath('/api/auth/logout', 'POST')).toBe(true)
    expect(isPublicApiPath('/api/auth/logout', 'GET')).toBe(false)
  })

  it('requires session for typical write APIs', () => {
    expect(isPublicApiPath('/api/incidents', 'GET')).toBe(false)
    expect(isPublicApiPath('/api/users', 'GET')).toBe(false)
    expect(isPublicApiPath('/api/users/tm-1', 'PATCH')).toBe(false)
  })
})
