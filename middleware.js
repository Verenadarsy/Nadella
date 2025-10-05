import { NextResponse } from 'next/server'

export function middleware(req) {
  const { pathname } = req.nextUrl

  // Daftar route yang butuh login
  const protectedRoutes = ['/dashboard/admin', '/dashboard/superadmin']

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const userRole = req.cookies.get('userRole')?.value || ''
    if (!userRole) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('auth', 'required')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
