-- Phase 2: versioned methodology, diagnosis campaigns and private vault.

create schema if not exists sensitive;
revoke all on schema sensitive from public, anon, authenticated;
grant usage on schema sensitive to service_role;

create table public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'retired')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, tenant_id)
    references public.clinics(id, organization_id),
  unique (clinic_id, name)
);

create table public.questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null
    references public.questionnaires(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'retired')),
  item_count integer not null default 50 check (item_count > 0),
  factor_count integer not null default 13 check (factor_count > 0),
  scale_min smallint not null default 0,
  scale_max smallint not null default 4,
  content_hash text,
  change_notes text,
  published_at timestamptz,
  published_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (questionnaire_id, version_number),
  check (scale_min = 0 and scale_max = 4),
  check (
    (status = 'published' and published_at is not null and content_hash is not null)
    or status <> 'published'
  )
);

create table public.psychosocial_factors (
  id uuid primary key default gen_random_uuid(),
  questionnaire_version_id uuid not null
    references public.questionnaire_versions(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  display_order integer not null check (display_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (questionnaire_version_id, code),
  unique (questionnaire_version_id, display_order)
);

create table public.psychosocial_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_version_id uuid not null
    references public.questionnaire_versions(id) on delete cascade,
  code text not null,
  prompt text not null,
  display_order integer not null check (display_order > 0),
  polarity text not null check (polarity in ('direct', 'inverse')),
  is_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (questionnaire_version_id, code),
  unique (questionnaire_version_id, display_order)
);

create table public.question_factor_map (
  question_id uuid not null
    references public.psychosocial_questions(id) on delete cascade,
  factor_id uuid not null
    references public.psychosocial_factors(id) on delete cascade,
  weight numeric(8,4) not null default 1 check (weight > 0),
  created_at timestamptz not null default now(),
  primary key (question_id, factor_id)
);

create table public.diagnosis_cycles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  baseline_cycle_id uuid references public.diagnosis_cycles(id) on delete set null,
  timepoint text not null check (timepoint in ('T0', 'T90', 'T180', 'T365', 'custom')),
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'cancelled', 'archived')),
  scheduled_for date,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, tenant_id)
    references public.clinics(id, organization_id),
  foreign key (company_id, clinic_id)
    references public.companies(id, clinic_id)
);

create table public.diagnosis_campaigns (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.diagnosis_cycles(id) on delete cascade,
  questionnaire_version_id uuid not null
    references public.questionnaire_versions(id) on delete restrict,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'open', 'closed', 'processing', 'completed', 'cancelled')),
  opens_at timestamptz,
  closes_at timestamptz,
  minimum_cohort_size integer not null default 5
    check (minimum_cohort_size >= 5),
  small_company_threshold integer not null default 10
    check (small_company_threshold >= 10),
  eligible_count integer not null default 0 check (eligible_count >= 0),
  invitation_policy jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create table public.campaign_segments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.diagnosis_campaigns(id) on delete cascade,
  dimension text not null
    check (dimension in ('company', 'branch', 'department', 'age_group', 'sex')),
  branch_id uuid references public.branches(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  label text not null,
  minimum_cohort_size integer not null default 5
    check (minimum_cohort_size >= 5),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (dimension = 'branch' and branch_id is not null and department_id is null)
    or (dimension = 'department' and department_id is not null and branch_id is null)
    or (dimension in ('company', 'age_group', 'sex')
      and branch_id is null and department_id is null)
  )
);

create table sensitive.participant_registry (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.diagnosis_campaigns(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  pseudonym uuid not null default gen_random_uuid(),
  eligibility_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'eligible'
    check (status in ('eligible', 'invited', 'started', 'completed', 'invalidated', 'withdrawn')),
  invited_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, employee_id),
  unique (campaign_id, pseudonym)
);

create table sensitive.participant_tokens (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null
    references sensitive.participant_registry(id) on delete cascade,
  token_hash bytea not null,
  purpose text not null check (purpose in ('invite', 'resume', 'consent')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (token_hash),
  check (expires_at > created_at)
);

create table sensitive.response_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null
    references sensitive.participant_registry(id) on delete cascade,
  questionnaire_version_id uuid not null
    references public.questionnaire_versions(id) on delete restrict,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'invalidated', 'withdrawn')),
  consent_version text not null,
  consented_at timestamptz not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  invalidated_at timestamptz,
  input_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id),
  check (
    (status = 'submitted' and submitted_at is not null and input_hash is not null)
    or status <> 'submitted'
  )
);

create table sensitive.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null
    references sensitive.response_sessions(id) on delete cascade,
  question_id uuid not null
    references public.psychosocial_questions(id) on delete restrict,
  answer_value smallint not null check (answer_value between 0 and 4),
  answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_id)
);

create table sensitive.consent_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null
    references sensitive.participant_registry(id) on delete cascade,
  consent_version text not null,
  event_type text not null check (event_type in ('granted', 'withdrawn')),
  occurred_at timestamptz not null default now(),
  evidence_hash text not null
);

create index questionnaires_tenant_clinic_idx
  on public.questionnaires(tenant_id, clinic_id);
create index questionnaire_versions_status_idx
  on public.questionnaire_versions(questionnaire_id, status);
create index factors_version_idx
  on public.psychosocial_factors(questionnaire_version_id);
create index questions_version_idx
  on public.psychosocial_questions(questionnaire_version_id);
create index question_factor_factor_idx
  on public.question_factor_map(factor_id);
create index diagnosis_cycles_company_timepoint_idx
  on public.diagnosis_cycles(company_id, timepoint, created_at desc);
create index diagnosis_campaigns_cycle_status_idx
  on public.diagnosis_campaigns(cycle_id, status);
create index diagnosis_campaigns_version_idx
  on public.diagnosis_campaigns(questionnaire_version_id);
create index campaign_segments_campaign_idx
  on public.campaign_segments(campaign_id);
create index participant_registry_campaign_status_idx
  on sensitive.participant_registry(campaign_id, status);
create index participant_registry_employee_idx
  on sensitive.participant_registry(employee_id);
create index participant_tokens_participant_idx
  on sensitive.participant_tokens(participant_id);
create index participant_tokens_expiry_idx
  on sensitive.participant_tokens(expires_at)
  where consumed_at is null and revoked_at is null;
create index response_sessions_version_status_idx
  on sensitive.response_sessions(questionnaire_version_id, status);
create index answers_session_idx on sensitive.answers(session_id);
create index answers_question_idx on sensitive.answers(question_id);
create index consent_events_participant_idx
  on sensitive.consent_events(participant_id, occurred_at desc);

create or replace function private.psychosocial_clinic_id_for_questionnaire(
  target_questionnaire_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select clinic_id
  from public.questionnaires
  where id = target_questionnaire_id
$$;

create or replace function private.psychosocial_clinic_id_for_version(
  target_version_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select questionnaire.clinic_id
  from public.questionnaire_versions version_row
  join public.questionnaires questionnaire
    on questionnaire.id = version_row.questionnaire_id
  where version_row.id = target_version_id
$$;

create or replace function private.psychosocial_clinic_id_for_cycle(
  target_cycle_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select clinic_id
  from public.diagnosis_cycles
  where id = target_cycle_id
$$;

create or replace function private.psychosocial_company_id_for_cycle(
  target_cycle_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id
  from public.diagnosis_cycles
  where id = target_cycle_id
$$;

create or replace function private.is_campaign_participant(
  target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
    from sensitive.participant_registry participant
    join public.employees employee on employee.id = participant.employee_id
    where participant.campaign_id = target_campaign_id
      and employee.auth_user_id = (select auth.uid())
      and participant.status not in ('invalidated', 'withdrawn')
  ), false)
$$;

revoke all on function private.psychosocial_clinic_id_for_questionnaire(uuid)
  from public, anon;
revoke all on function private.psychosocial_clinic_id_for_version(uuid)
  from public, anon;
revoke all on function private.psychosocial_clinic_id_for_cycle(uuid)
  from public, anon;
revoke all on function private.psychosocial_company_id_for_cycle(uuid)
  from public, anon;
revoke all on function private.is_campaign_participant(uuid)
  from public, anon;
grant execute on function private.psychosocial_clinic_id_for_questionnaire(uuid)
  to authenticated;
grant execute on function private.psychosocial_clinic_id_for_version(uuid)
  to authenticated;
grant execute on function private.psychosocial_clinic_id_for_cycle(uuid)
  to authenticated;
grant execute on function private.psychosocial_company_id_for_cycle(uuid)
  to authenticated;
grant execute on function private.is_campaign_participant(uuid)
  to authenticated;

create or replace function private.prevent_published_methodology_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  protected_status text;
begin
  if tg_table_name = 'questionnaire_versions' then
    if old.status in ('published', 'retired') then
      raise exception 'Published questionnaire versions are immutable';
    end if;
    return new;
  end if;

  if tg_table_name = 'psychosocial_factors'
    or tg_table_name = 'psychosocial_questions' then
    select status into protected_status
    from public.questionnaire_versions
    where id = old.questionnaire_version_id;
  elsif tg_table_name = 'question_factor_map' then
    select version_row.status into protected_status
    from public.psychosocial_questions question_row
    join public.questionnaire_versions version_row
      on version_row.id = question_row.questionnaire_version_id
    where question_row.id = old.question_id;
  end if;

  if protected_status in ('published', 'retired') then
    raise exception 'Published methodology content is immutable';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_published_methodology_changes()
  from public, anon, authenticated;

create trigger protect_questionnaire_versions
  before update or delete on public.questionnaire_versions
  for each row execute function private.prevent_published_methodology_changes();
create trigger protect_psychosocial_factors
  before update or delete on public.psychosocial_factors
  for each row execute function private.prevent_published_methodology_changes();
create trigger protect_psychosocial_questions
  before update or delete on public.psychosocial_questions
  for each row execute function private.prevent_published_methodology_changes();
create trigger protect_question_factor_map
  before update or delete on public.question_factor_map
  for each row execute function private.prevent_published_methodology_changes();

create or replace function private.validate_psychosocial_workflow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual_items integer;
  actual_factors integer;
  unmapped_items integer;
  version_status text;
begin
  if tg_table_name = 'questionnaire_versions'
    and new.status = 'published'
    and old.status = 'draft' then
    select count(*) into actual_items
    from public.psychosocial_questions
    where questionnaire_version_id = new.id and is_active;

    select count(*) into actual_factors
    from public.psychosocial_factors
    where questionnaire_version_id = new.id and is_active;

    select count(*) into unmapped_items
    from public.psychosocial_questions question_row
    where question_row.questionnaire_version_id = new.id
      and question_row.is_active
      and not exists (
        select 1 from public.question_factor_map map_row
        where map_row.question_id = question_row.id
      );

    if actual_items <> new.item_count
      or actual_factors <> new.factor_count
      or unmapped_items <> 0 then
      raise exception 'Questionnaire publication validation failed';
    end if;
  end if;

  if tg_table_name = 'diagnosis_campaigns'
    and new.status in ('scheduled', 'open') then
    select status into version_status
    from public.questionnaire_versions
    where id = new.questionnaire_version_id;

    if version_status <> 'published' then
      raise exception 'Campaigns require a published questionnaire version';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_psychosocial_workflow()
  from public, anon, authenticated;

create trigger validate_questionnaire_publication
  before update on public.questionnaire_versions
  for each row execute function private.validate_psychosocial_workflow();
create trigger validate_campaign_activation
  before insert or update on public.diagnosis_campaigns
  for each row execute function private.validate_psychosocial_workflow();

alter table public.questionnaires enable row level security;
alter table public.questionnaire_versions enable row level security;
alter table public.psychosocial_factors enable row level security;
alter table public.psychosocial_questions enable row level security;
alter table public.question_factor_map enable row level security;
alter table public.diagnosis_cycles enable row level security;
alter table public.diagnosis_campaigns enable row level security;
alter table public.campaign_segments enable row level security;

alter table sensitive.participant_registry enable row level security;
alter table sensitive.participant_tokens enable row level security;
alter table sensitive.response_sessions enable row level security;
alter table sensitive.answers enable row level security;
alter table sensitive.consent_events enable row level security;

revoke all on table
  public.questionnaires,
  public.questionnaire_versions,
  public.psychosocial_factors,
  public.psychosocial_questions,
  public.question_factor_map,
  public.diagnosis_cycles,
  public.diagnosis_campaigns,
  public.campaign_segments
from anon;

grant select, insert, update, delete on table
  public.questionnaires,
  public.questionnaire_versions,
  public.psychosocial_factors,
  public.psychosocial_questions,
  public.question_factor_map,
  public.diagnosis_cycles,
  public.diagnosis_campaigns,
  public.campaign_segments
to authenticated;

revoke all on all tables in schema sensitive from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema sensitive
  to service_role;

create policy "Authorized users read questionnaires"
on public.questionnaires for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
);
create policy "Technical users create questionnaires"
on public.questionnaires for insert to authenticated
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
create policy "Technical users update questionnaires"
on public.questionnaires for update to authenticated
using (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_professional', 'psychologist'],
    clinic_id
  )
)
with check (tenant_id = private.current_organization_id());

create policy "Authorized users read questionnaire versions"
on public.questionnaire_versions for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership(
    'clinic'::public.portal_type,
    private.psychosocial_clinic_id_for_questionnaire(questionnaire_id)
  )
);
create policy "Technical users manage draft questionnaire versions"
on public.questionnaire_versions for all to authenticated
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

create policy "Authorized users read factors"
on public.psychosocial_factors for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership(
    'clinic'::public.portal_type,
    private.psychosocial_clinic_id_for_version(questionnaire_version_id)
  )
);
create policy "Technical users manage draft factors"
on public.psychosocial_factors for all to authenticated
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

create policy "Authorized users read questions"
on public.psychosocial_questions for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership(
    'clinic'::public.portal_type,
    private.psychosocial_clinic_id_for_version(questionnaire_version_id)
  )
);
create policy "Technical users manage draft questions"
on public.psychosocial_questions for all to authenticated
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

create policy "Authorized users read question factor mappings"
on public.question_factor_map for select to authenticated
using (
  exists (
    select 1
    from public.psychosocial_questions question_row
    where question_row.id = question_factor_map.question_id
      and (
        private.is_nexxohub_operator()
        or private.has_portal_membership(
          'clinic'::public.portal_type,
          private.psychosocial_clinic_id_for_version(
            question_row.questionnaire_version_id
          )
        )
      )
  )
);
create policy "Technical users manage draft question factor mappings"
on public.question_factor_map for all to authenticated
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

create policy "Authorized users read diagnosis cycles"
on public.diagnosis_cycles for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership(
    'company'::public.portal_type, clinic_id, company_id
  )
);
create policy "Technical users manage diagnosis cycles"
on public.diagnosis_cycles for all to authenticated
using (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_professional', 'psychologist'],
    clinic_id
  )
)
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

create policy "Authorized users read campaigns"
on public.diagnosis_campaigns for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership(
    'clinic'::public.portal_type,
    private.psychosocial_clinic_id_for_cycle(cycle_id)
  )
  or private.has_portal_membership(
    'company'::public.portal_type,
    private.psychosocial_clinic_id_for_cycle(cycle_id),
    private.psychosocial_company_id_for_cycle(cycle_id)
  )
  or private.is_campaign_participant(id)
);
create policy "Technical users manage campaigns"
on public.diagnosis_campaigns for all to authenticated
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

create policy "Authorized users read campaign segments"
on public.campaign_segments for select to authenticated
using (
  exists (
    select 1
    from public.diagnosis_campaigns campaign
    where campaign.id = campaign_segments.campaign_id
      and (
        private.is_nexxohub_operator()
        or private.has_portal_membership(
          'clinic'::public.portal_type,
          private.psychosocial_clinic_id_for_cycle(campaign.cycle_id)
        )
        or private.has_portal_membership(
          'company'::public.portal_type,
          private.psychosocial_clinic_id_for_cycle(campaign.cycle_id),
          private.psychosocial_company_id_for_cycle(campaign.cycle_id)
        )
      )
  )
);
create policy "Technical users manage campaign segments"
on public.campaign_segments for all to authenticated
using (
  exists (
    select 1
    from public.diagnosis_campaigns campaign
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
    select 1
    from public.diagnosis_campaigns campaign
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
