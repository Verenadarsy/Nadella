// middleware.js - UPDATE INI
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (error) {
    console.error("MIDDLEWARE: Invalid token", error);
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  console.log(`🔍 MIDDLEWARE: ${req.method} ${pathname}, Token: ${token ? 'YES' : 'NO'}`);

  // ======================================================
  // ✅ SKIP MIDDLEWARE UNTUK ROUTE-ROUTE TERTENTU
  // ======================================================
  const skipAuthRoutes = [
    // Static files
    '/_next',
    '/static',
    '/favicon.ico',
    '/api/health',
    '/api/public',

    // Chat & AI routes (biarkan handle auth di masing-masing endpoint)
    '/api/chat',
    '/api/ai/ask',
    '/api/pdf-generate',

    // Auth routes
    '/api/auth',
    '/login',
    '/register'
  ];

  // Cek apakah route termasuk yang boleh skip auth
  const shouldSkipAuth = skipAuthRoutes.some(route => pathname.startsWith(route));

  if (shouldSkipAuth) {
    console.log(`✅ Skipping auth for: ${pathname}`);
    return NextResponse.next();
  }

  // ======================================================
  // 🔐 PUBLIC ROUTES (No token needed but allowed)
  // ======================================================
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/api/docs'
  ];

  const isPublicRoute = publicRoutes.some(route => pathname === route);

  if (isPublicRoute) {
    console.log(`🌐 Public route: ${pathname}`);
    return NextResponse.next();
  }

  // ======================================================
  // 🚫 NO TOKEN = REDIRECT TO LOGIN
  // ======================================================
  if (!token) {
    console.log('❌ No token found, redirecting to login');

    // Untuk API routes, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
          redirect: '/login'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Location': '/login'
          }
        }
      );
    }

    // Untuk pages, redirect
    return NextResponse.redirect(new URL('/login?auth=required', req.url));
  }

  // ======================================================
  // ✅ VERIFY TOKEN
  // ======================================================
  const decoded = await verifyToken(token);

  if (!decoded) {
    console.log('❌ Token verification failed');

    // Untuk API routes
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid token',
          redirect: '/login'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Location': '/login?auth=invalid_token'
          }
        }
      );
    }

    return NextResponse.redirect(new URL('/login?auth=invalid_token', req.url));
  }

  const userRole = decoded.role;

  if (!userRole) {
    console.log('❌ No role in token');

    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.redirect(new URL('/login?auth=invalid_token', req.url));
  }

  // ======================================================
  // 👥 ROLE-BASED ACCESS CONTROL
  // ======================================================
  console.log(`👤 User: ${decoded.email} (${userRole})`);

  // Client tidak boleh akses dashboard
  if (userRole === 'client' && pathname.startsWith('/dashboard')) {
    console.log(`🚫 Client not allowed → ${pathname}`);

    if (pathname.startsWith('/api/dashboard')) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden', message: 'Client role cannot access dashboard' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.redirect(new URL('/client', req.url));
  }

  // Admin/Superadmin tidak boleh akses client pages
  if (['admin', 'superadmin'].includes(userRole) && pathname.startsWith('/client')) {
    console.log(`🚫 Admin not allowed → ${pathname}`);

    if (pathname.startsWith('/api/client')) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden', message: 'Admin role cannot access client pages' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (pathname.startsWith('/dashboard/manage-admins') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ======================================================
  // ✅ ALLOWED REQUEST
  // ======================================================
  console.log(`✅ Allowed: ${pathname}`);

  // Add user info to headers untuk digunakan di API routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', decoded.id || '');
  requestHeaders.set('x-user-email', decoded.email || '');
  requestHeaders.set('x-user-role', userRole);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/client/:path*',
    '/login',
    '/register',
    '/api/:path*',
  ],
};