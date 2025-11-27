import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

function getRedirectPathByRole(role) {
  if (role === 'client') return '/client';
  if (['admin', 'superadmin'].includes(role)) return '/dashboard';
  return '/login?error=unknown_role';
}

export function middleware(req) {
  const token = req.cookies.get('token')?.value;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/api/auth') || pathname === '/login') {
    return NextResponse.next();
  }

  if (!token) {
    console.log('MIDDLEWARE: No token found, redirect to login');
    return NextResponse.redirect(new URL('/login?auth=required', req.url));
  }

  let decoded;
  try {
    decoded = jwt.decode(token);
  } catch (error) {
    console.error('MIDDLEWARE: Failed to decode token', error.message);
    return NextResponse.redirect(new URL('/login?auth=invalid_token', req.url));
  }

  const userRole = decoded?.role;
  if (!userRole) {
    console.error('MIDDLEWARE: No role found in token');
    return NextResponse.redirect(new URL('/login?auth=invalid_token', req.url));
  }

  if (userRole === 'client' && pathname.startsWith('/dashboard')) {
    console.log(`MIDDLEWARE: Access denied for client -> ${pathname}`);
    return NextResponse.redirect(new URL('/client', req.url));
  }

  if (['admin', 'superadmin'].includes(userRole) && pathname.startsWith('/client')) {
    console.log(`MIDDLEWARE: Access denied for ${userRole} -> ${pathname}`);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}
