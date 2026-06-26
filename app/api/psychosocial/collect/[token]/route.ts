import { NextRequest } from 'next/server';
import {
  collectionError,
  collectionResponse,
  hashToken,
  rateLimitKey,
  requestFingerprint,
} from '../../../../../lib/psychosocial/collection';
import { createAdminClient } from '../../../../../lib/supabase/admin';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const tokenHash = hashToken(token);
    const fingerprint = requestFingerprint(request);
    const admin = createAdminClient();
    const { data: allowed, error: rateError } = await admin.rpc('collection_check_rate_limit', {
      p_key_hash: rateLimitKey(tokenHash, fingerprint, 'context'),
      p_limit: 30,
      p_window_seconds: 300,
    });
    if (rateError) throw rateError;
    if (!allowed) {
      return collectionResponse(
        { statusCode: 429, code: 'RATE_LIMITED', message: 'Tente novamente mais tarde' },
        { status: 429 }
      );
    }

    const { data: tokenData, error: tokenError } = await admin
      .schema('sensitive')
      .from('participant_tokens')
      .select('participant_id, purpose, expires_at, consumed_at, revoked_at')
      .eq('token_hash', tokenHash)
      .single();
    if (
      tokenError ||
      !tokenData ||
      tokenData.revoked_at ||
      tokenData.consumed_at ||
      new Date(tokenData.expires_at).getTime() <= Date.now()
    ) {
      throw new Error('Invalid or expired invitation token');
    }

    const { data: participant, error: participantError } = await admin
      .schema('sensitive')
      .from('participant_registry')
      .select('campaign_id, status')
      .eq('id', tokenData.participant_id)
      .single();
    if (participantError || !participant) throw new Error('Invalid participant');

    const { data: campaign, error: campaignError } = await admin
      .from('diagnosis_campaigns')
      .select('id, title, status, opens_at, closes_at, questionnaire_version_id')
      .eq('id', participant.campaign_id)
      .single();
    if (campaignError || !campaign) throw new Error('Invalid campaign');

    const { data: version, error: versionError } = await admin
      .from('questionnaire_versions')
      .select('version_number, item_count, scale_min, scale_max')
      .eq('id', campaign.questionnaire_version_id)
      .eq('status', 'published')
      .single();
    if (versionError || !version) throw new Error('Invalid questionnaire');

    const { data: questions, error: questionsError } = await admin
      .from('psychosocial_questions')
      .select('id, code, prompt, display_order, is_required')
      .eq('questionnaire_version_id', campaign.questionnaire_version_id)
      .eq('is_active', true)
      .order('display_order');
    if (questionsError) throw questionsError;

    return collectionResponse({
      success: true,
      data: {
        campaign: {
          title: campaign.title,
          status: campaign.status,
          opensAt: campaign.opens_at,
          closesAt: campaign.closes_at,
        },
        questionnaire: {
          version: version.version_number,
          itemCount: version.item_count,
          scale: { min: version.scale_min, max: version.scale_max },
          questions: questions || [],
        },
        participantStatus: participant.status,
        tokenPurpose: tokenData.purpose,
      },
    });
  } catch (error) {
    return collectionError(error);
  }
}
