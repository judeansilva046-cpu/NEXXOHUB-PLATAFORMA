import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DEBUG: Testa autenticação direta
 * GET /api/auth/debug?email=...&password=...
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    const password = req.nextUrl.searchParams.get('password');

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing email or password in query params',
          example: '/api/auth/debug?email=test@example.com&password=your_password',
        },
        { status: 400 }
      );
    }

    console.log('🔍 DEBUG AUTH:', {
      email,
      passwordLength: password.length,
      emailLength: email.length,
      timestamp: new Date().toISOString(),
    });

    const supabase = await createClient();

    // Test 1: Check if Supabase client is connected
    console.log('✓ Supabase client created');

    // Test 2: Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('📊 Login Response:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorStatus: error?.status,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            status: error.status,
            code: error.code,
          },
          debug: {
            emailSent: email,
            emailLength: email.length,
            passwordLength: password.length,
            timestamp: new Date().toISOString(),
          },
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: data?.user?.id,
        email: data?.user?.email,
        emailConfirmed: data?.user?.email_confirmed_at,
        lastSignInAt: data?.user?.last_sign_in_at,
        sessionToken: data?.session?.access_token?.substring(0, 20) + '...',
      },
      debug: {
        emailSent: email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('🔴 DEBUG ERROR:', message, err);

    return NextResponse.json(
      {
        success: false,
        error: message,
        type: err instanceof Error ? err.constructor.name : typeof err,
      },
      { status: 500 }
    );
  }
}
