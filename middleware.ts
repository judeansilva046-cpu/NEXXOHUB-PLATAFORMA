import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
      data: { session },
      error,
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
    // LÓGICA DE REDIRECIONAMENTO
    // ============================================================================

    // 1. Usuário NÃO autenticado tentando acessar /dashboard
    if (!session && isDashboardPage) {
      console.log('🔴 MIDDLEWARE: Redirecting unauthenticated user to /auth/login');
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 2. Usuário autenticado tentando acessar /auth/*
    //    Redirecionar para /dashboard para evitar permanecer em página de login
    if (session && isAuthPage) {
      console.log('🟢 MIDDLEWARE: Redirecting authenticated user to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 3. Adicionar security headers a TODAS as respostas
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';");

    console.log('✅ MIDDLEWARE: Request allowed', {
      pathname,
      hasSession: !!session,
      isAuthPage,
      isDashboardPage,
    });

    return res;
  } catch (err) {
    console.error('❌ MIDDLEWARE ERROR:', err);
    // Em caso de erro, deixar passar (melhor que bloquear)
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
