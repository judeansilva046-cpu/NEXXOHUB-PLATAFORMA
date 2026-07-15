import { createServerClient, type CookieOptions, type SetAllCookies } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isProtectedPortalPath,
  portalConfig,
  portalFromRequest,
  type PortalType,
} from './lib/portal';
import { getPublicEnvironment } from './lib/env';
import { normalizeRole, roleBelongsToPortal } from './lib/rbac';

const isProduction = process.env.NODE_ENV === 'production';

function contentSecurityPolicy(frameAncestors: "'self'" | "'none'" = "'self'") {
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com";
  const connectSrc = isProduction
    ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.ingest.sentry.io"
    : "connect-src 'self' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:* https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.ingest.sentry.io";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    "object-src 'none'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
    "font-src 'self' data:",
    connectSrc,
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || request.nextUrl.hostname;
  const requestedPortal = portalFromRequest(hostname, pathname);
  const isAuthPage = pathname.startsWith('/auth');
  const isProtected = isProtectedPortalPath(pathname);

  try {
    const { supabaseUrl, supabaseAnonKey } = getPublicEnvironment();
    let response = NextResponse.next({ request });
    let cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: ((updatedCookies) => {
          cookiesToSet = updatedCookies;
          updatedCookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          updatedCookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }) satisfies SetAllCookies,
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const redirectWithCookies = (url: URL) => {
      const redirect = NextResponse.redirect(url);
      cookiesToSet.forEach(({ name, value, options }) =>
        redirect.cookies.set(name, value, options)
      );
      return redirect;
    };

    if (!user && isProtected) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('portal', requestedPortal);
      return redirectWithCookies(loginUrl);
    }

    let memberships: Array<{ portal: PortalType; role: string }> = [];
    if (user) {
      const { data } = await supabase
        .from('portal_memberships')
        .select('portal, role')
        .eq('user_id', user.id)
        .eq('is_active', true);
      memberships = (data || []) as Array<{ portal: PortalType; role: string }>;
    }

    if (user && isProtected) {
      const hasPortalAccess = memberships.some(
        (membership) =>
          membership.portal === requestedPortal &&
          roleBelongsToPortal(membership.role, requestedPortal)
      );
      if (!hasPortalAccess) {
        const deniedUrl = new URL('/access-denied', request.url);
        deniedUrl.searchParams.set('portal', requestedPortal);
        return redirectWithCookies(deniedUrl);
      }
    }

    if (user && isAuthPage) {
      const preferredPortal =
        memberships.find((item) => item.portal === requestedPortal)?.portal ||
        memberships[0]?.portal ||
        'nexxohub';
      const preferredRole = normalizeRole(
        memberships.find((item) => item.portal === preferredPortal)?.role ||
          memberships[0]?.role ||
          ''
      );
      if (preferredRole === 'nexxohub_finance') {
        return redirectWithCookies(new URL('/finance', request.url));
      }
      return redirectWithCookies(new URL(portalConfig[preferredPortal].home, request.url));
    }

    response.headers.set('X-Nexxohub-Portal', requestedPortal);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProduction) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    response.headers.set('Content-Security-Policy', contentSecurityPolicy());
    return response;
  } catch (error) {
    console.error('[MIDDLEWARE_ERROR]', error);
    if (isProtected) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('portal', requestedPortal);
      loginUrl.searchParams.set('error', 'Serviço de autenticação indisponível.');
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    response.headers.set('X-Nexxohub-Portal', requestedPortal);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', contentSecurityPolicy("'none'"));
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
