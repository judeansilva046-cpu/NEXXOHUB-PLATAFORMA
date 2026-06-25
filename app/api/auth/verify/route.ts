import { createClient } from '../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Verifica se a sessão foi criada com sucesso
 * Use após login para garantir que os cookies foram setados
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, hasSession: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      hasSession: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Verify session error:', message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
