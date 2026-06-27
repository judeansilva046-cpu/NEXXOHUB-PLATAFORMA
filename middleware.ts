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
import { roleBelongsToPortal } from './lib/rbac';

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
      return redirectWithCookies(new URL(portalConfig[preferredPortal].home, request.url));
    }

    response.headers.set('X-Nexxohub-Portal', requestedPortal);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
