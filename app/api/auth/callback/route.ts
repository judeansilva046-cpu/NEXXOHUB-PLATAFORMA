import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors silently
            }
          },
        },
      }
    );

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

      // Successfully verified, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
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
