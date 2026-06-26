import { NextResponse } from 'next/server';
import { getPublicEnvironment } from '../../../lib/env';

export async function GET() {
  const startedAt = Date.now();

  try {
    const { supabaseUrl, supabaseAnonKey } = getPublicEnvironment();
    const healthResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: supabaseAnonKey,
      },
      cache: 'no-store',
    });

    if (!healthResponse.ok) {
      throw new Error(`Supabase health check failed: ${healthResponse.status}`);
    }

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
