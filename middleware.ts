import {
  createServerClient,
  type CookieOptions,
  type SetAllCookies,
} from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    let res = NextResponse.next({ request: req });
    let cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

    // ============================================================================
    // CREATE SUPABASE CLIENT WITH PROPER COOKIE HANDLING
    // ============================================================================
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll: ((updatedCookies) => {
            cookiesToSet = updatedCookies;
            updatedCookies.forEach(({ name, value }) => req.cookies.set(name, value));
            res = NextResponse.next({ request: req });
            updatedCookies.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          }) satisfies SetAllCookies,
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    if (!user && isDashboardPage) {
      const redirect = NextResponse.redirect(new URL('/auth/login', req.url));
      cookiesToSet.forEach(({ name, value, options }) =>
        redirect.cookies.set(name, value, options)
      );
      return redirect;
    }

    // Case 2: User authenticated trying to access /auth/* (only redirect once)
    if (user && isAuthPage) {
      const redirect = NextResponse.redirect(new URL('/dashboard', req.url));
      cookiesToSet.forEach(({ name, value, options }) =>
        redirect.cookies.set(name, value, options)
      );
      return redirect;
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
