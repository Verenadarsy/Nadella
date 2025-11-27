import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(req) {
  const token = req.cookies.get('token')?.value
  const url = req.nextUrl.pathname

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?auth=required', req.url)
    )
  }

  let user
  try {
    user = jwt.verify(token, process.env.JWT_SECRET)
  } catch (e) {
    return NextResponse.redirect(new URL('/login?auth=expired', req.url))
  }

  if (url.startsWith('/dashboard/superadmin')) {
    if (user.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url))
    }
  }

  if (url.startsWith('/dashboard/admin')) {
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.redirect(new URL('/login?auth=forbidden', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
