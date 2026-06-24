import { createClient } from '../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifica se a sessão foi criada com sucesso
 * Use após login para garantir que os cookies foram setados
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { success: false, hasSession: false },
        { status: 401 }
      );
    }

    console.log('✅ Session verified:', {
      userId: session.user?.id,
      email: session.user?.email,
    });

    return NextResponse.json({
      success: true,
      hasSession: true,
      user: {
        id: session.user?.id,
        email: session.user?.email,
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
