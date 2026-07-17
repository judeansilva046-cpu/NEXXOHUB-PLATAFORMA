import { NextResponse } from 'next/server';
import { getErrorResponse, NotFoundError } from '../../../../../../lib/errors';
import { requirePortalContext } from '../../../../../../lib/portal-context';
import { createAdminClient } from '../../../../../../lib/supabase/admin';

type ComplaintSource = {
  id: string;
  organization_id: string;
  clinic_id: string;
  company_id: string;
  employee_id: string | null;
  category: string;
  description: string;
};

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, membership } = await requirePortalContext('clinic');
    if (!membership.clinic_id) throw new NotFoundError('Clinica');

    const admin = createAdminClient();
    const { data: source, error: sourceError } = await admin
      .from('complaints')
      .select('id, organization_id, clinic_id, company_id, employee_id, category, description')
      .eq('id', params.id)
      .eq('clinic_id', membership.clinic_id)
      .maybeSingle();

    if (sourceError) throw sourceError;
    if (!source) throw new NotFoundError('Denuncia');

    const complaint = source as ComplaintSource;

    const { data: existingEvent, error: existingError } = await admin
      .from('technical_case_events')
      .select('case_id')
      .eq('clinic_id', complaint.clinic_id)
      .contains('metadata', { sourceType: 'complaint', sourceId: complaint.id })
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
        organization_id: complaint.organization_id,
        clinic_id: complaint.clinic_id,
        company_id: complaint.company_id,
        employee_id: complaint.employee_id,
        title: `Denuncia: ${complaint.category}`,
        summary: complaint.description,
        case_type: 'complaint',
        risk_level: 'high',
        status: 'open',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (caseError) throw caseError;

    await admin.from('technical_case_events').insert({
      organization_id: complaint.organization_id,
      clinic_id: complaint.clinic_id,
      company_id: complaint.company_id,
      case_id: technicalCase.id,
      employee_id: complaint.employee_id,
      event_type: 'technical_note',
      title: 'Caso criado a partir de denuncia',
      description: complaint.description,
      metadata: { sourceType: 'complaint', sourceId: complaint.id },
      created_by: user.id,
    });

    await admin.from('activity_events').insert([
      {
        organization_id: complaint.organization_id,
        actor_id: user.id,
        event_type: 'technical_case.created_from_complaint',
        entity_type: 'technical_case',
        entity_id: technicalCase.id,
        title: 'Caso tecnico criado',
        description: `Criado a partir da denuncia: ${complaint.category}.`,
      },
      {
        organization_id: complaint.organization_id,
        actor_id: user.id,
        event_type: 'complaint.technical_case_created',
        entity_type: 'complaint',
        entity_id: complaint.id,
        title: 'Caso tecnico vinculado',
        description: `Caso tecnico criado para a denuncia: ${complaint.category}.`,
      },
    ]);

    await admin
      .from('complaints')
      .update({ status: 'reviewing', closed_at: null })
      .eq('id', complaint.id);

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
