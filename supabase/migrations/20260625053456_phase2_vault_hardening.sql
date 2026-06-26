-- Explicit deny policies for the private vault and FK indexes.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'participant_registry',
    'participant_tokens',
    'response_sessions',
    'answers',
    'consent_events'
  ]
  loop
    execute format(
      'create policy %I on sensitive.%I for all to authenticated using (false) with check (false)',
      'Portal users cannot access ' || table_name,
      table_name
    );
  end loop;
end
$$;

create index campaign_segments_branch_id_idx
  on public.campaign_segments(branch_id);
create index campaign_segments_department_id_idx
  on public.campaign_segments(department_id);
create index diagnosis_campaigns_created_by_idx
  on public.diagnosis_campaigns(created_by);
create index diagnosis_cycles_baseline_idx
  on public.diagnosis_cycles(baseline_cycle_id);
create index diagnosis_cycles_clinic_tenant_idx
  on public.diagnosis_cycles(clinic_id, tenant_id);
create index diagnosis_cycles_company_clinic_idx
  on public.diagnosis_cycles(company_id, clinic_id);
create index diagnosis_cycles_created_by_idx
  on public.diagnosis_cycles(created_by);
create index diagnosis_cycles_tenant_idx
  on public.diagnosis_cycles(tenant_id);
create index questionnaire_versions_created_by_idx
  on public.questionnaire_versions(created_by);
create index questionnaire_versions_published_by_idx
  on public.questionnaire_versions(published_by);
create index questionnaires_clinic_tenant_idx
  on public.questionnaires(clinic_id, tenant_id);
create index questionnaires_created_by_idx
  on public.questionnaires(created_by);

-- FOR ALL policies overlap read policies. Keep read and write decisions separate.
drop policy if exists "Technical users manage draft questionnaire versions"
  on public.questionnaire_versions;
create policy "Technical users create questionnaire versions"
on public.questionnaire_versions for insert to authenticated
with check (
  status in ('draft', 'published')
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_questionnaire(questionnaire_id)
    )
  )
);
create policy "Technical users update draft questionnaire versions"
on public.questionnaire_versions for update to authenticated
using (
  status = 'draft'
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_questionnaire(questionnaire_id)
    )
  )
)
with check (
  status in ('draft', 'published')
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_questionnaire(questionnaire_id)
    )
  )
);
create policy "Technical users delete draft questionnaire versions"
on public.questionnaire_versions for delete to authenticated
using (
  status = 'draft'
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_questionnaire(questionnaire_id)
    )
  )
);

drop policy if exists "Technical users manage draft factors"
  on public.psychosocial_factors;
create policy "Technical users create draft factors"
on public.psychosocial_factors for insert to authenticated
with check (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_factors.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
);
create policy "Technical users update draft factors"
on public.psychosocial_factors for update to authenticated
using (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_factors.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
)
with check (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_factors.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
);
create policy "Technical users delete draft factors"
on public.psychosocial_factors for delete to authenticated
using (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_factors.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
);

drop policy if exists "Technical users manage draft questions"
  on public.psychosocial_questions;
create policy "Technical users create draft questions"
on public.psychosocial_questions for insert to authenticated
with check (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_questions.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
);
create policy "Technical users update draft questions"
on public.psychosocial_questions for update to authenticated
using (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_questions.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
)
with check (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_questions.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
);
create policy "Technical users delete draft questions"
on public.psychosocial_questions for delete to authenticated
using (
  exists (
    select 1 from public.questionnaire_versions version_row
    where version_row.id = psychosocial_questions.questionnaire_version_id
      and version_row.status = 'draft'
  )
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_version(questionnaire_version_id)
    )
  )
);

drop policy if exists "Technical users manage draft question factor mappings"
  on public.question_factor_map;
create policy "Technical users create draft question factor mappings"
on public.question_factor_map for insert to authenticated
with check (
  exists (
    select 1
    from public.psychosocial_questions question_row
    join public.questionnaire_versions version_row
      on version_row.id = question_row.questionnaire_version_id
    where question_row.id = question_factor_map.question_id
      and version_row.status = 'draft'
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type,
          array['clinic_admin', 'clinic_professional', 'psychologist'],
          private.psychosocial_clinic_id_for_version(version_row.id)
        )
      )
  )
);
create policy "Technical users update draft question factor mappings"
on public.question_factor_map for update to authenticated
using (
  exists (
    select 1
    from public.psychosocial_questions question_row
    join public.questionnaire_versions version_row
      on version_row.id = question_row.questionnaire_version_id
    where question_row.id = question_factor_map.question_id
      and version_row.status = 'draft'
  )
)
with check (
  exists (
    select 1
    from public.psychosocial_questions question_row
    join public.questionnaire_versions version_row
      on version_row.id = question_row.questionnaire_version_id
    where question_row.id = question_factor_map.question_id
      and version_row.status = 'draft'
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type,
          array['clinic_admin', 'clinic_professional', 'psychologist'],
          private.psychosocial_clinic_id_for_version(version_row.id)
        )
      )
  )
);
create policy "Technical users delete draft question factor mappings"
on public.question_factor_map for delete to authenticated
using (
  exists (
    select 1
    from public.psychosocial_questions question_row
    join public.questionnaire_versions version_row
      on version_row.id = question_row.questionnaire_version_id
    where question_row.id = question_factor_map.question_id
      and version_row.status = 'draft'
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type,
          array['clinic_admin', 'clinic_professional', 'psychologist'],
          private.psychosocial_clinic_id_for_version(version_row.id)
        )
      )
  )
);

drop policy if exists "Technical users manage diagnosis cycles"
  on public.diagnosis_cycles;
create policy "Technical users create diagnosis cycles"
on public.diagnosis_cycles for insert to authenticated
with check (
  tenant_id = private.current_organization_id()
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      clinic_id
    )
  )
);
create policy "Technical users update diagnosis cycles"
on public.diagnosis_cycles for update to authenticated
using (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_professional', 'psychologist'],
    clinic_id
  )
)
with check (tenant_id = private.current_organization_id());
create policy "Technical users delete draft diagnosis cycles"
on public.diagnosis_cycles for delete to authenticated
using (
  status = 'draft'
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      clinic_id
    )
  )
);

drop policy if exists "Technical users manage campaigns"
  on public.diagnosis_campaigns;
create policy "Technical users create campaigns"
on public.diagnosis_campaigns for insert to authenticated
with check (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_professional', 'psychologist'],
    private.psychosocial_clinic_id_for_cycle(cycle_id)
  )
);
create policy "Technical users update campaigns"
on public.diagnosis_campaigns for update to authenticated
using (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_professional', 'psychologist'],
    private.psychosocial_clinic_id_for_cycle(cycle_id)
  )
)
with check (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_professional', 'psychologist'],
    private.psychosocial_clinic_id_for_cycle(cycle_id)
  )
);
create policy "Technical users delete draft campaigns"
on public.diagnosis_campaigns for delete to authenticated
using (
  status = 'draft'
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin', 'clinic_professional', 'psychologist'],
      private.psychosocial_clinic_id_for_cycle(cycle_id)
    )
  )
);

drop policy if exists "Technical users manage campaign segments"
  on public.campaign_segments;
create policy "Technical users create campaign segments"
on public.campaign_segments for insert to authenticated
with check (
  exists (
    select 1 from public.diagnosis_campaigns campaign
    where campaign.id = campaign_segments.campaign_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type,
          array['clinic_admin', 'clinic_professional', 'psychologist'],
          private.psychosocial_clinic_id_for_cycle(campaign.cycle_id)
        )
      )
  )
);
create policy "Technical users update campaign segments"
on public.campaign_segments for update to authenticated
using (
  exists (
    select 1 from public.diagnosis_campaigns campaign
    where campaign.id = campaign_segments.campaign_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type,
          array['clinic_admin', 'clinic_professional', 'psychologist'],
          private.psychosocial_clinic_id_for_cycle(campaign.cycle_id)
        )
      )
  )
)
with check (
  exists (
    select 1 from public.diagnosis_campaigns campaign
    where campaign.id = campaign_segments.campaign_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type,
          array['clinic_admin', 'clinic_professional', 'psychologist'],
          private.psychosocial_clinic_id_for_cycle(campaign.cycle_id)
        )
      )
  )
);
create policy "Technical users delete campaign segments"
on public.campaign_segments for delete to authenticated
using (
  exists (
    select 1 from public.diagnosis_campaigns campaign
    where campaign.id = campaign_segments.campaign_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type,
          array['clinic_admin', 'clinic_professional', 'psychologist'],
          private.psychosocial_clinic_id_for_cycle(campaign.cycle_id)
        )
      )
  )
);
