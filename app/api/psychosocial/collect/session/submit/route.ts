import { NextRequest } from 'next/server';
import {
  bearerToken,
  collectionError,
  collectionResponse,
  createCorrelationId,
  hashToken,
  rateLimitKey,
  requestFingerprint,
} from '../../../../../../lib/psychosocial/collection';
import { createAdminClient } from '../../../../../../lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const resumeHash = hashToken(bearerToken(request));
    const fingerprint = requestFingerprint(request);
    const admin = createAdminClient();
    const { data: allowed, error: rateError } = await admin.rpc('collection_check_rate_limit', {
      p_key_hash: rateLimitKey(resumeHash, fingerprint, 'submit'),
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

    const { data, error } = await admin.rpc('collection_submit', {
      p_resume_hash: resumeHash,
      p_correlation_id: createCorrelationId(),
      p_request_fingerprint: fingerprint,
    });
    if (error) throw error;
    const submission = data?.[0];

    return collectionResponse({
      success: true,
      data: {
        protocol: submission?.session_id,
        submittedAt: submission?.submitted_at,
      },
    });
  } catch (error) {
    return collectionError(error);
  }
}
