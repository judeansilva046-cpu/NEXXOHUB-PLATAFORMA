import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET() {
  const startedAt = Date.now();

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json(
      {
        status: 'ok',
        service: 'nexxohub-platform',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        database: 'reachable',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'nexxohub-platform',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
