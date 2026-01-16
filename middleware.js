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

  // ✅ DAPATKAN ENVIRONMENT DENGAN BENAR
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`🔍 ${isProduction ? '🏭 PRODUCTION' : '🧪 DEVELOPMENT'} - ${req.method} ${pathname}, Token: ${token ? 'YES' : 'NO'}`);

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
  const internalRoutes = [
    '/api/chat',
    '/api/ai/',
    '/api/pdf-generate',
  ];

  const isInternalRoute = internalRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isInternalRoute) {
    console.log(`🔵 Internal route: ${pathname}`);
    
    // OPTION 1: Check for Service Token (for server-to-server calls)
    const serviceToken = req.headers.get('x-service-token');
    if (serviceToken === process.env.INTERNAL_SERVICE_TOKEN) {
      console.log('✅ Internal service call authenticated');
      return NextResponse.next();
    }
    
    // OPTION 2: Check JWT token (for user calls)
    if (token) {
      const decoded = await verifyToken(token);
      if (decoded) {
        console.log(`✅ User authenticated: ${decoded.email}`);
        
        // Add user info to headers
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
    
    // ✅ OPTION 3: Allow in DEVELOPMENT mode only (FIXED)
    if (isDevelopment) {
      console.log('🛠️ DEV MODE: Allowing internal route without auth');
      return NextResponse.next();
    }
    
    // If none of the above, require auth (PRODUCTION mode)
    console.log('❌ Internal route requires authentication');
    return new NextResponse(
      JSON.stringify({ 
        error: 'Authentication required', 
        message: 'Please login or provide service token',
        code: 'AUTH_REQUIRED'
      }),
      { 
        status: 401, 
        headers: { 
          'Content-Type': 'application/json',
        } 
      }
    );
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

    if (!decoded) {
      console.log('❌ Token verification failed');
      
      // Clear invalid token
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('token');
      
      return response;
    }

    const userRole = decoded.role;
    console.log(`👤 User: ${decoded.email} (${userRole})`);

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

  // ======================================================
  // 🟡 DEFAULT: ALLOW WITH TOKEN, OPTIONAL WITHOUT
  // ======================================================
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