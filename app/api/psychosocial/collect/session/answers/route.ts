import { NextRequest } from 'next/server';
import {
  answersSchema,
  bearerToken,
  collectionError,
  collectionResponse,
  createCorrelationId,
  hashToken,
  rateLimitKey,
  requestFingerprint,
} from '../../../../../../lib/psychosocial/collection';
import { createAdminClient } from '../../../../../../lib/supabase/admin';

export async function PUT(request: NextRequest) {
  try {
    const input = answersSchema.parse(await request.json());
    const resumeHash = hashToken(bearerToken(request));
    const fingerprint = requestFingerprint(request);
    const admin = createAdminClient();
    const { data: allowed, error: rateError } = await admin.rpc('collection_check_rate_limit', {
      p_key_hash: rateLimitKey(resumeHash, fingerprint, 'answers'),
      p_limit: 120,
      p_window_seconds: 300,
    });
    if (rateError) throw rateError;
    if (!allowed) {
      return collectionResponse(
        { statusCode: 429, code: 'RATE_LIMITED', message: 'Tente novamente mais tarde' },
        { status: 429 }
      );
    }

    const { data, error } = await admin.rpc('collection_save_answers', {
      p_resume_hash: resumeHash,
      p_answers: input.answers,
      p_correlation_id: createCorrelationId(),
      p_request_fingerprint: fingerprint,
    });
    if (error) throw error;

    return collectionResponse({ success: true, data: data?.[0] || null });
  } catch (error) {
    return collectionError(error);
  }
}
