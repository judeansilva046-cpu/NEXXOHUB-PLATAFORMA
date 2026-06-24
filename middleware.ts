import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('🔐 MIDDLEWARE DEBUG:', {
    pathname: req.nextUrl.pathname,
    hasSession: !!session,
    sessionUser: session?.user?.email,
  });

  // Redirect unauthenticated users to login
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('🔴 MIDDLEWARE: Unauthenticated → /auth/login');
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Redirect authenticated users away from auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    console.log('🟢 MIDDLEWARE: Authenticated → /dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
