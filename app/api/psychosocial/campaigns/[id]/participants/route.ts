import { NextRequest } from 'next/server';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../../../../../../lib/errors';
import {
  collectionError,
  collectionResponse,
  createCorrelationId,
  createOpaqueToken,
  hashToken,
  inviteParticipantsSchema,
} from '../../../../../../lib/psychosocial/collection';
import { createAdminClient } from '../../../../../../lib/supabase/admin';
import { createClient } from '../../../../../../lib/supabase/server';
import { normalizeRole } from '../../../../../../lib/rbac';

type RouteContext = { params: Promise<{ id: string }> };
type CampaignScope = {
  id: string;
  cycle_id: string;
  status: string;
};
type CycleScope = {
  tenant_id: string;
  clinic_id: string;
  company_id: string;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params;
    const sessionClient = await createClient();
    const { data: auth } = await sessionClient.auth.getUser();
    if (!auth.user) throw new AuthenticationError();

    const input = inviteParticipantsSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: campaignData, error: campaignError } = await admin
      .from('diagnosis_campaigns')
      .select('id, cycle_id, status')
      .eq('id', campaignId)
      .single();
    if (campaignError || !campaignData) throw new NotFoundError('Campanha');
    const campaign = campaignData as CampaignScope;

    const { data: cycleData, error: cycleError } = await admin
      .from('diagnosis_cycles')
      .select('tenant_id, clinic_id, company_id')
      .eq('id', campaign.cycle_id)
      .single();
    if (cycleError || !cycleData) throw new NotFoundError('Ciclo');
    const cycle = cycleData as CycleScope;

    const { data: memberships } = await admin
      .from('portal_memberships')
      .select('portal, role, organization_id, clinic_id, company_id')
      .eq('user_id', auth.user.id)
      .eq('is_active', true);

    const authorized = (memberships || []).some((membership) => {
      const role = normalizeRole(membership.role);
      if (membership.organization_id !== cycle.tenant_id) return false;
      if (membership.portal === 'nexxohub' && role === 'nexxohub_admin') {
        return true;
      }
      if (
        membership.portal === 'clinic' &&
        membership.clinic_id === cycle.clinic_id &&
        ['clinic_admin', 'clinic_staff'].includes(role)
      ) {
        return true;
      }
      return (
        membership.portal === 'company' &&
        membership.company_id === cycle.company_id &&
        ['company_admin', 'company_hr', 'company_compliance'].includes(role)
      );
    });
    if (!authorized) throw new AuthorizationError();
    if (!['scheduled', 'open'].includes(campaign.status)) {
      throw new AuthorizationError('A campanha não aceita novos convites');
    }

    const { data: employees, error: employeeError } = await admin
      .from('employees')
      .select('id, company_id, organization_id, branch_id, department_id, position_id, status')
      .in('id', input.employeeIds)
      .eq('company_id', cycle.company_id)
      .eq('organization_id', cycle.tenant_id)
      .eq('status', 'active');
    if (employeeError) throw employeeError;
    if ((employees || []).length !== input.employeeIds.length) {
      throw new AuthorizationError('Há colaboradores inválidos, inativos ou fora da empresa');
    }

    const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000).toISOString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || request.nextUrl.origin;
    const invitations = [];

    for (const employee of employees || []) {
      const { data: existingParticipant } = await admin
        .schema('sensitive')
        .from('participant_registry')
        .select('id, status')
        .eq('campaign_id', campaignId)
        .eq('employee_id', employee.id)
        .maybeSingle();
      if (
        existingParticipant &&
        ['started', 'completed', 'invalidated', 'withdrawn'].includes(existingParticipant.status)
      ) {
        throw new AuthorizationError('Um dos colaboradores já iniciou ou encerrou esta avaliação');
      }

      const { data: participant, error: participantError } = await admin
        .schema('sensitive')
        .from('participant_registry')
        .upsert(
          {
            campaign_id: campaignId,
            employee_id: employee.id,
            eligibility_snapshot: {
              companyId: employee.company_id,
              branchId: employee.branch_id,
              departmentId: employee.department_id,
              positionId: employee.position_id,
            },
            status: 'invited',
            invited_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'campaign_id,employee_id' }
        )
        .select('id')
        .single();
      if (participantError || !participant) throw participantError;

      await admin
        .schema('sensitive')
        .from('participant_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('participant_id', participant.id)
        .eq('purpose', 'invite')
        .is('consumed_at', null)
        .is('revoked_at', null);

      const rawToken = createOpaqueToken();
      const correlationId = createCorrelationId();
      const { error: tokenError } = await admin
        .schema('sensitive')
        .from('participant_tokens')
        .insert({
          participant_id: participant.id,
          token_hash: hashToken(rawToken),
          purpose: 'invite',
          expires_at: expiresAt,
        });
      if (tokenError) throw tokenError;

      await admin.schema('sensitive').from('collection_events').insert({
        participant_id: participant.id,
        event_type: 'invited',
        correlation_id: correlationId,
        metadata: { expiresAt },
      });

      invitations.push({
        employeeId: employee.id,
        inviteUrl: `${appUrl}/avaliacao/${rawToken}`,
        expiresAt,
      });
    }

    return collectionResponse(
      { success: true, data: { campaignId, invitations } },
      { status: 201 }
    );
  } catch (error) {
    return collectionError(error);
  }
}
