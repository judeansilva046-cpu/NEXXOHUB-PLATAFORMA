import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthErrorMessage } from '../../../../lib/auth-errors';
import { createClient } from '../../../../lib/supabase/server';
import { loginSchema } from '../../../../lib/validations/auth';

function jsonResponse(body: object, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.email,
      password: validation.password,
    });

    if (error) {
      return jsonResponse({ success: false, error: getAuthErrorMessage(error) }, 401);
    }

    if (!data.session) {
      return jsonResponse(
        { success: false, error: 'Login realizado, mas nenhuma sessao foi criada.' },
        401
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse(
        { success: false, error: error.issues[0]?.message || 'Dados invalidos.' },
        400
      );
    }

    console.error('[SIGNIN_ERROR]', error);
    return jsonResponse({ success: false, error: 'Nao foi possivel fazer login.' }, 500);
  }
}
