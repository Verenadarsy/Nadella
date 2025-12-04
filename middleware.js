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
  const token = req.cookies.get('token')?.value;
  const pathname = req.nextUrl.pathname;

  // Allow public routes
  if (pathname.startsWith('/api/auth') || pathname === '/login') {
    return NextResponse.next();
  }

  if (!token) {
    console.log('MIDDLEWARE: No token found');
    return NextResponse.redirect(new URL('/login?auth=required', req.url));
  }

  const decoded = await verifyToken(token);

  if (!decoded) {
    console.log('MIDDLEWARE: Token failed verification');
    return NextResponse.redirect(new URL('/login?auth=invalid_token', req.url));
  }

  const userRole = decoded.role;

  if (!userRole) {
    console.log('MIDDLEWARE: No role inside token');
    return NextResponse.redirect(new URL('/login?auth=invalid_token', req.url));
  }

  // ROLE-BASED REDIRECTION
  if (userRole === 'client' && pathname.startsWith('/dashboard')) {
    console.log(`CLIENT not allowed → ${pathname}`);
    return NextResponse.redirect(new URL('/client', req.url));
  }

  if (['admin', 'superadmin'].includes(userRole) && pathname.startsWith('/client')) {
    console.log(`ADMIN/SUPERADMIN not allowed → ${pathname}`);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}
