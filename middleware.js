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
    '/api/products',
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
      loginUrl.searchParams.set('alert', 'login_required');
      return NextResponse.redirect(loginUrl);
    }

    // ✅ VERIFY TOKEN
    const decoded = await verifyToken(token);

    if (!decoded) {
      console.log('❌ Token verification failed');
      
      // Clear invalid token and redirect with alert
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('alert', 'session_expired');
      
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('token');
      
      return response;
    }

    const userRole = decoded.role;
    const userEmail = decoded.email;
    console.log(`👤 User: ${userEmail} (${userRole})`);

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
      
      // Redirect client to client dashboard with alert
      const clientDashboardUrl = new URL('/client/dashboard', req.url);
      clientDashboardUrl.searchParams.set('alert', 'client_redirect');
      clientDashboardUrl.searchParams.set('message', 'Anda telah dialihkan ke dashboard client');
      return NextResponse.redirect(clientDashboardUrl);
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
      
      // Redirect admin to dashboard with alert
      const dashboardUrl = new URL('/dashboard', req.url);
      dashboardUrl.searchParams.set('alert', 'admin_client_redirect');
      dashboardUrl.searchParams.set('message', 'Admin tidak dapat mengakses halaman client');
      return NextResponse.redirect(dashboardUrl);
    }

    // ======================================================
    // 🛡️ SUPERADMIN-ONLY ROUTES (WITH ALERT)
    // ======================================================
    
    // Hanya route ini yang khusus untuk superadmin
    const superadminOnlyRoutes = [
      '/dashboard/manage-admins',      // Halaman manage admins
      '/api/dashboard/manage-admins',   // API untuk manage admins
    ];

    // Cek apakah route ini khusus superadmin
    const isSuperadminRoute = superadminOnlyRoutes.some(route => 
      pathname.startsWith(route)
    );

    // Jika route khusus superadmin, tapi user bukan superadmin
    if (isSuperadminRoute && userRole !== 'superadmin') {
      console.log(`🚫 SUPERADMIN ONLY: ${userRole} trying to access ${pathname}`);
      
      // Untuk API routes, return 403
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: 'Hanya Super Admin yang dapat mengakses halaman ini',
            code: 'SUPERADMIN_REQUIRED',
            userRole: userRole
          }),
          { 
            status: 403, 
            headers: { 
              'Content-Type': 'application/json',
            } 
          }
        );
      }
      
      // Untuk halaman, redirect ke dashboard dengan alert
      const dashboardUrl = new URL('/dashboard', req.url);
      dashboardUrl.searchParams.set('alert', 'superadmin_required');
      dashboardUrl.searchParams.set('message', 'Hanya Super Admin yang dapat mengakses halaman Manage Admins');
      dashboardUrl.searchParams.set('userRole', userRole);
      dashboardUrl.searchParams.set('attemptedPage', 'manage-admins');
      
      return NextResponse.redirect(dashboardUrl);
    }

    // ✅ ALLOWED - Add user info to headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', decoded.id || '');
    requestHeaders.set('x-user-email', userEmail || '');
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