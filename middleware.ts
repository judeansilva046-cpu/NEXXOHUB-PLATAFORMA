import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    let res = NextResponse.next();

    // ============================================================================
    // CREATE SUPABASE CLIENT WITH PROPER COOKIE HANDLING
    // ============================================================================
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            res = NextResponse.next();
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            res = NextResponse.next();
            res.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const pathname = req.nextUrl.pathname;
    const isAuthPage = pathname.startsWith('/auth');
    const isDashboardPage = pathname.startsWith('/dashboard');
    const isApiRoute = pathname.startsWith('/api');

    // Skip middleware for API routes
    if (isApiRoute) {
      return res;
    }

    // ============================================================================
    // ROUTE PROTECTION LOGIC - NO LOOPS
    // ============================================================================

    // Case 1: User NOT authenticated trying to access /dashboard
    if (!session && isDashboardPage) {
      console.log('[MIDDLEWARE_REDIRECT_LOGIN] Unauthenticated user → /auth/login', {
        pathname,
      });
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Case 2: User authenticated trying to access /auth/* (only redirect once)
    if (session && isAuthPage) {
      console.log('[MIDDLEWARE_REDIRECT_DASHBOARD] Authenticated user → /dashboard', {
        pathname,
        userId: session.user?.id,
      });
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Case 3: User authenticated accessing /dashboard or user not authenticated accessing /auth/*
    if (session) {
      console.log('[MIDDLEWARE_AUTHENTICATED] User has valid session', {
        userId: session.user?.id,
        email: session.user?.email,
        pathname,
      });
    }

    // ============================================================================
    // SECURITY HEADERS
    // ============================================================================
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return res;
  } catch (err) {
    console.error('[MIDDLEWARE_ERROR]', err);
    return NextResponse.next();
  }
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
