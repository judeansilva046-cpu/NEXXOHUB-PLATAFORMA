import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getPublicEnvironment } from '../../../../lib/env';
import { portalConfig, type PortalType } from '../../../../lib/portal';
import { normalizeRole } from '../../../../lib/rbac';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle error from Supabase
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin
      )
    );
  }

  // If we got a code, exchange it for a session
  if (code) {
    const cookieStore = await cookies();
    const { supabaseUrl, supabaseAnonKey } = getPublicEnvironment();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll: ((cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle cookie setting errors silently
          }
        }) satisfies SetAllCookies,
      },
    });

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        return NextResponse.redirect(
          new URL(
            `/auth/login?error=${encodeURIComponent(exchangeError.message)}`,
            requestUrl.origin
          )
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
      }

      const { data: memberships } = await supabase
        .from('portal_memberships')
        .select('portal, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      const preferredMembership = (memberships || [])[0] as
        | { portal: PortalType; role: string }
        | undefined;

      if (normalizeRole(preferredMembership?.role || '') === 'nexxohub_finance') {
        return NextResponse.redirect(new URL('/finance', requestUrl.origin));
      }

      const destination = preferredMembership?.portal
        ? portalConfig[preferredMembership.portal].home
        : '/auth/login';

      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    } catch (err) {
      console.error('Error exchanging code for session:', err);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent('Erro ao verificar email')}`,
          requestUrl.origin
        )
      );
    }
  }

  // No code or error provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
