// middleware.js
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
  // 🟢 PUBLICLY ACCESSIBLE ROUTES (NO AUTH NEEDED)
  // ======================================================
  const publicRoutes = [
    // Static assets
    '/_next/',
    '/static/',
    '/favicon.ico',
    '/manifest.json',

    // Auth pages
    '/login',
    '/register',
    '/api/auth/',

    // Health check & monitoring
    '/api/health',
    '/api/public/',
  ];

  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  if (isPublicRoute) {
    console.log(`✅ Public route (no auth): ${pathname}`);
    return NextResponse.next();
  }

  // ======================================================
  // 🔵 PROTECTED BUT INTERNAL ROUTES (NEED SPECIAL HANDLING)
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
  // 🔴 STRICTLY PROTECTED ROUTES (MUST HAVE VALID USER TOKEN)
  // ======================================================
  const protectedRoutes = [
    '/dashboard',
    '/client',
    '/api/dashboard',
    '/api/client',
    '/api/leads',
    '/api/customers',
    '/api/deals',
    '/api/invoices',
    '/api/tickets',
    '/api/activities',
  ];

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
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    console.log(`🔴 Protected route: ${pathname}`);

    // 🚫 NO TOKEN = REDIRECT TO LOGIN
    if (!token) {
      console.log('❌ No token for protected route');

      // For API routes, return 401 JSON
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'NO_TOKEN'
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // For pages, redirect
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ✅ VERIFY TOKEN
    const decoded = await verifyToken(token);

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
    if (!decoded) {
      console.log('❌ Token verification failed');

      // Clear invalid token
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('token');

      return response;
    }

    const userRole = decoded.role;
    console.log(`👤 User: ${decoded.email} (${userRole})`);

  // Client tidak boleh akses dashboard
  if (userRole === 'client' && pathname.startsWith('/dashboard')) {
    console.log(`🚫 Client not allowed → ${pathname}`);

    if (pathname.startsWith('/api/dashboard')) {
    // ======================================================
    // 👥 ROLE-BASED ACCESS CONTROL (RBAC)
    // ======================================================

    // Client cannot access dashboard
    if (userRole === 'client' && pathname.startsWith('/dashboard')) {
      console.log(`🚫 Client cannot access dashboard`);

      if (pathname.startsWith('/api/dashboard')) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Client role cannot access dashboard resources'
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }

    // Admin/Superadmin cannot access client pages
    if (['admin', 'superadmin'].includes(userRole) && pathname.startsWith('/client')) {
      console.log(`🚫 Admin cannot access client pages`);

      if (pathname.startsWith('/api/client')) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Admin role cannot access client resources'
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Superadmin-only routes
    const superadminRoutes = ['/api/system/', '/api/admin/settings'];
    if (superadminRoutes.some(route => pathname.startsWith(route)) && userRole !== 'superadmin') {
      console.log(`🚫 Superadmin route accessed by ${userRole}`);
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden', message: 'Superadmin access required' }),
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

    // ✅ ALLOWED - Add user info to headers
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

  if (pathname.startsWith('/dashboard/manage-admins') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ======================================================
  // 🟡 DEFAULT: ALLOW WITH TOKEN, OPTIONAL WITHOUT
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
  console.log(`🟡 Default handling for: ${pathname}`);

  // If token exists, verify and add headers
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', decoded.id || '');
      requestHeaders.set('x-user-email', decoded.email || '');
      requestHeaders.set('x-user-role', decoded.role || 'user');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // If no token, allow anyway (for landing pages, etc.)
  return NextResponse.next();
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