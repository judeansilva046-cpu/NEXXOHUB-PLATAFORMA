import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

function jsonResponse(body: object, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[LOGOUT_ERROR]', error);
      return jsonResponse({ success: false, error: 'Não foi possível encerrar a sessão.' }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return jsonResponse({ success: false, error: 'Não foi possível encerrar a sessão.' }, 500);
  }
}
