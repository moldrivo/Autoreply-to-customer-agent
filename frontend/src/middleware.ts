import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('autoreply_access_token')?.value
  const { pathname } = request.nextUrl

  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isRoot = pathname === '/'

  if (isRoot) {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url))
  }

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
