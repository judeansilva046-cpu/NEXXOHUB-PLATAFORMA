import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) {
    return NextResponse.json({ success: false, message: 'Token ausente.' }, { status: 401 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const payload = await request.json().catch(() => ({}));
  const operation = typeof payload.operation === 'string' ? payload.operation : 'intake';
  const supabase = createAdminClient();

  const { data: tokenRow, error } = await supabase
    .from('integration_tokens')
    .select('organization_id, clinic_id, company_id, connection_id, status, expires_at')
    .eq('token_hash', tokenHash)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !tokenRow) {
    return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 401 });
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, message: 'Token expirado.' }, { status: 401 });
  }

  const { data: syncLog, error: logError } = await supabase
    .from('integration_sync_logs')
    .insert({
      organization_id: tokenRow.organization_id,
      clinic_id: tokenRow.clinic_id,
      company_id: tokenRow.company_id,
      connection_id: tokenRow.connection_id,
      direction: 'inbound',
      operation,
      status: 'queued',
      payload,
    })
    .select('id, status')
    .single();

  if (logError) {
    return NextResponse.json(
      { success: false, message: 'Falha ao registrar payload de integração.' },
      { status: 500 }
    );
  }

  await supabase
    .from('integration_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  return NextResponse.json(
    {
      success: true,
      data: {
        syncLogId: syncLog.id,
        status: syncLog.status,
      },
    },
    { status: 202 }
  );
}
