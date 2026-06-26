import { NextRequest } from 'next/server';
import {
  collectionError,
  collectionResponse,
  consentEvidence,
  consentSchema,
  createCorrelationId,
  createOpaqueToken,
  hashToken,
  rateLimitKey,
  requestFingerprint,
} from '../../../../../../lib/psychosocial/collection';
import { createAdminClient } from '../../../../../../lib/supabase/admin';

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const input = consentSchema.parse(await request.json());
    const inviteHash = hashToken(token);
    const fingerprint = requestFingerprint(request);
    const correlationId = createCorrelationId();
    const admin = createAdminClient();

    const { data: allowed, error: rateError } = await admin.rpc('collection_check_rate_limit', {
      p_key_hash: rateLimitKey(inviteHash, fingerprint, 'start'),
      p_limit: 10,
      p_window_seconds: 300,
    });
    if (rateError) throw rateError;
    if (!allowed) {
      return collectionResponse(
        { statusCode: 429, code: 'RATE_LIMITED', message: 'Tente novamente mais tarde' },
        { status: 429 }
      );
    }

    const resumeToken = createOpaqueToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin.rpc('collection_start_session', {
      p_invite_hash: inviteHash,
      p_resume_hash: hashToken(resumeToken),
      p_resume_expires_at: expiresAt,
      p_consent_version: input.consentVersion,
      p_consent_evidence_hash: consentEvidence(inviteHash, input.consentVersion, correlationId),
      p_correlation_id: correlationId,
      p_request_fingerprint: fingerprint,
    });
    if (error) throw error;

    return collectionResponse(
      {
        success: true,
        data: {
          resumeToken,
          expiresAt,
          sessionId: data?.[0]?.session_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return collectionError(error);
  }
}
