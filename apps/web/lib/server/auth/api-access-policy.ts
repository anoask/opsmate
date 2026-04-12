/**
 * Pure policy for which `/api/*` routes skip session checks.
 * Kept separate from `middleware.ts` so behavior can be unit-tested without Next.js.
 */
export function isPublicApiPath(pathname: string, method: string): boolean {
  if (pathname === '/api/health') {
    return true
  }
  if (pathname.startsWith('/api/ingest/')) {
    return true
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    return true
  }
  if (pathname === '/api/auth/session' && method === 'GET') {
    return true
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return true
  }
  return false
}
