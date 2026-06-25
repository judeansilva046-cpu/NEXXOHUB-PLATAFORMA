import { NextResponse } from 'next/server';

export async function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return NextResponse.json(
    {
      status: configured ? 'ok' : 'degraded',
      service: 'nexxohub-platform',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
    },
    {
      status: configured ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
