import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { isPublicApiPath } from '@/lib/server/auth/api-access-policy'
import { SESSION_COOKIE_NAME } from '@/lib/server/auth/constants'
import { isValidSessionToken } from '@/lib/server/auth/session-verify'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icon') ||
    pathname === '/apple-icon.png'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const sessionOk = await isValidSessionToken(token)

  if (pathname === '/login') {
    if (sessionOk) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname, method)) {
      return NextResponse.next()
    }

    if (!sessionOk) {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Sign in required.' },
        { status: 401 },
      )
    }
    return NextResponse.next()
  }

  if (!sessionOk) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
