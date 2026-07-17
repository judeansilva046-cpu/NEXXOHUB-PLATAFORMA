import { NextResponse } from 'next/server';
import { getErrorResponse, NotFoundError } from '../../../../../../lib/errors';
import { requirePortalContext } from '../../../../../../lib/portal-context';
import { createAdminClient } from '../../../../../../lib/supabase/admin';

type HelpRequestSource = {
  id: string;
  organization_id: string;
  clinic_id: string;
  company_id: string;
  employee_id: string;
  subject: string;
  description: string;
};

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, membership } = await requirePortalContext('clinic');
    if (!membership.clinic_id) throw new NotFoundError('Clinica');

    const admin = createAdminClient();
    const { data: source, error: sourceError } = await admin
      .from('help_requests')
      .select('id, organization_id, clinic_id, company_id, employee_id, subject, description')
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .maybeSingle();

    if (sourceError) throw sourceError;
    if (!source) throw new NotFoundError('Pedido de ajuda');

    const request = source as HelpRequestSource;

    const { data: existingEvent, error: existingError } = await admin
      .from('technical_case_events')
      .select('case_id')
      .eq('clinic_id', request.clinic_id)
      .contains('metadata', { sourceType: 'help_request', sourceId: request.id })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingEvent?.case_id) {
      return NextResponse.json(
        { success: true, data: { id: existingEvent.case_id, alreadyExists: true } },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const { data: technicalCase, error: caseError } = await admin
      .from('technical_cases')
      .insert({
        organization_id: request.organization_id,
        clinic_id: request.clinic_id,
        company_id: request.company_id,
        employee_id: request.employee_id,
        title: `Pedido de ajuda: ${request.subject}`,
        summary: request.description,
        case_type: 'help_request',
        risk_level: 'medium',
        status: 'open',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (caseError) throw caseError;

    await admin.from('technical_case_events').insert({
      organization_id: request.organization_id,
      clinic_id: request.clinic_id,
      company_id: request.company_id,
      case_id: technicalCase.id,
      employee_id: request.employee_id,
      event_type: 'technical_note',
      title: 'Caso criado a partir de pedido de ajuda',
      description: request.description,
      metadata: { sourceType: 'help_request', sourceId: request.id },
      created_by: user.id,
    });

    await admin.from('activity_events').insert([
      {
        organization_id: request.organization_id,
        actor_id: user.id,
        event_type: 'technical_case.created_from_help_request',
        entity_type: 'technical_case',
        entity_id: technicalCase.id,
        title: 'Caso tecnico criado',
        description: `Criado a partir do pedido de ajuda: ${request.subject}.`,
      },
      {
        organization_id: request.organization_id,
        actor_id: user.id,
        event_type: 'help_request.technical_case_created',
        entity_type: 'help_request',
        entity_id: request.id,
        title: 'Caso tecnico vinculado',
        description: `Caso tecnico criado para o pedido: ${request.subject}.`,
      },
    ]);

    await admin
      .from('help_requests')
      .update({ status: 'in_treatment', closed_at: null })
      .eq('id', request.id);

    return NextResponse.json(
      { success: true, data: technicalCase },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(
      { success: false, error: response.message, code: response.code },
      { status: response.statusCode }
    );
  }
}
