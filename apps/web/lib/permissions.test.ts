import { describe, expect, it } from 'vitest'

import { roleHasPermission } from '@/lib/permissions'

describe('roleHasPermission', () => {
  it('reserves team:roles for admins only', () => {
    expect(roleHasPermission('admin', 'team:roles')).toBe(true)
    expect(roleHasPermission('manager', 'team:roles')).toBe(false)
    expect(roleHasPermission('responder', 'team:roles')).toBe(false)
    expect(roleHasPermission('viewer', 'team:roles')).toBe(false)
  })

  it('allows managers and admins to edit team notification prefs, not responders', () => {
    expect(roleHasPermission('admin', 'team:prefs')).toBe(true)
    expect(roleHasPermission('manager', 'team:prefs')).toBe(true)
    expect(roleHasPermission('responder', 'team:prefs')).toBe(false)
    expect(roleHasPermission('viewer', 'team:prefs')).toBe(false)
  })

  it('allows operational roles to write incidents and execute runbooks', () => {
    for (const role of ['admin', 'manager', 'responder'] as const) {
      expect(roleHasPermission(role, 'incidents:write')).toBe(true)
      expect(roleHasPermission(role, 'runbooks:execute')).toBe(true)
    }
    expect(roleHasPermission('viewer', 'incidents:write')).toBe(false)
    expect(roleHasPermission('viewer', 'runbooks:execute')).toBe(false)
  })
})
