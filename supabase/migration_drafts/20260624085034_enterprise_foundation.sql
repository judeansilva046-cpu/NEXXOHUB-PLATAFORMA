-- DRAFT - not applied to the official project; retained for reference only.
-- NexxoHub enterprise foundation
-- Additive migration: completes the operational model, tenant scopes and RLS.

-- ============================================================================
-- SHARED TYPES AND HELPERS
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'record_status') then
    create type public.record_status as enum ('active', 'inactive', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'alert_severity') then
    create type public.alert_severity as enum ('low', 'medium', 'high', 'critical');
  end if;
  if not exists (select 1 from pg_type where typname = 'workflow_status') then
    create type public.workflow_status as enum (
      'draft', 'scheduled', 'in_progress', 'completed', 'cancelled'
    );
  end if;
end
$$;

create or replace function private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid()
$$;

create or replace function private.can_manage_organization()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select u.role in ('admin', 'manager')
      from public.users u
      where u.id = auth.uid()
    ),
    false
  )
$$;

revoke all on function private.current_user_id() from public, anon;
revoke all on function private.can_manage_organization() from public, anon;
grant execute on function private.current_user_id() to authenticated;
grant execute on function private.can_manage_organization() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- ============================================================================
-- COMPLETE CORE BUSINESS FIELDS
-- ============================================================================

alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists responsible_name text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists status public.record_status not null default 'active';

alter table public.clinics
  add column if not exists responsible_name text,
  add column if not exists email text,
  add column if not exists specialties text[] not null default '{}',
  add column if not exists status public.record_status not null default 'active';

alter table public.companies
  add column if not exists legal_name text,
  add column if not exists hr_responsible text,
  add column if not exists email text,
  add column if not exists employee_count integer not null default 0,
  add column if not exists status public.record_status not null default 'active',
  add constraint companies_employee_count_nonnegative check (employee_count >= 0);

alter table public.employees
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists cpf text,
  add column if not exists registration text,
  add column if not exists admission_date date,
  add column if not exists status public.record_status not null default 'active';

update public.employees employee
set organization_id = company.organization_id
from public.companies company
where employee.company_id = company.id
  and employee.organization_id is null;

alter table public.employees
  alter column organization_id set not null;

create unique index if not exists employees_org_cpf_unique
  on public.employees(organization_id, cpf)
  where cpf is not null;
create unique index if not exists employees_company_registration_unique
  on public.employees(company_id, registration)
  where registration is not null;

alter table public.assessments
  add column if not exists responsible_id uuid references public.users(id) on delete set null,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists published_at timestamptz;

alter table public.assessments
  drop constraint if exists assessments_status_check;
alter table public.assessments
  add constraint assessments_status_check
  check (status in ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled'));

alter table public.assessment_responses
  add column if not exists status public.workflow_status not null default 'draft',
  add column if not exists started_at timestamptz,
  add column if not exists current_step integer not null default 0,
  add column if not exists submitted_by uuid references public.users(id) on delete set null,
  add constraint assessment_responses_current_step_nonnegative check (current_step >= 0);

create unique index if not exists assessment_response_unique_participant
  on public.assessment_responses(assessment_id, employee_id);

alter table public.reports
  add column if not exists report_type text not null default 'consolidated',
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists clinic_id uuid references public.clinics(id) on delete set null,
  add column if not exists employee_id uuid references public.employees(id) on delete set null,
  add column if not exists status public.workflow_status not null default 'draft',
  add column if not exists generated_at timestamptz;

-- ============================================================================
-- SUB-TENANT ACCESS SCOPES
-- ============================================================================

create table if not exists public.user_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_scopes_target_check check (
    (company_id is not null and clinic_id is null)
    or (company_id is null and clinic_id is not null)
  )
);

create unique index if not exists user_scopes_company_unique
  on public.user_scopes(user_id, company_id)
  where company_id is not null;
create unique index if not exists user_scopes_clinic_unique
  on public.user_scopes(user_id, clinic_id)
  where clinic_id is not null;
create index if not exists user_scopes_organization_user_idx
  on public.user_scopes(organization_id, user_id);

create or replace function private.can_access_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.companies company
      join public.users current_user_profile
        on current_user_profile.organization_id = company.organization_id
       and current_user_profile.id = auth.uid()
      where company.id = target_company_id
        and (
          current_user_profile.role in ('admin', 'manager')
          or exists (
            select 1
            from public.user_scopes scope
            where scope.user_id = current_user_profile.id
              and scope.company_id = company.id
          )
        )
    ),
    false
  )
$$;

create or replace function private.can_access_clinic(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.clinics clinic
      join public.users current_user_profile
        on current_user_profile.organization_id = clinic.organization_id
       and current_user_profile.id = auth.uid()
      where clinic.id = target_clinic_id
        and (
          current_user_profile.role in ('admin', 'manager')
          or exists (
            select 1
            from public.user_scopes scope
            where scope.user_id = current_user_profile.id
              and scope.clinic_id = clinic.id
          )
        )
    ),
    false
  )
$$;

revoke all on function private.can_access_company(uuid) from public, anon;
revoke all on function private.can_access_clinic(uuid) from public, anon;
grant execute on function private.can_access_company(uuid) to authenticated;
grant execute on function private.can_access_clinic(uuid) to authenticated;

create or replace function private.valid_assessment_participant(
  target_assessment_id uuid,
  target_employee_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.assessments assessment
      join public.employees employee
        on employee.id = target_employee_id
       and employee.organization_id = assessment.organization_id
      where assessment.id = target_assessment_id
        and assessment.organization_id = private.current_organization_id()
        and private.can_access_company(employee.company_id)
    ),
    false
  )
$$;

revoke all on function private.valid_assessment_participant(uuid, uuid) from public, anon;
grant execute on function private.valid_assessment_participant(uuid, uuid) to authenticated;

-- ============================================================================
-- OPERATIONAL ENTERPRISE MODULES
-- ============================================================================

create table if not exists public.psychosocial_index_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  metric_key text not null default 'overall',
  score numeric(5,2) not null check (score between 0 and 100),
  sample_size integer not null default 0 check (sample_size >= 0),
  period_start date not null,
  period_end date not null,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint psychosocial_period_valid check (period_end >= period_start)
);

create table if not exists public.smart_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  alert_type text not null,
  severity public.alert_severity not null default 'medium',
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  summary text not null,
  recommendation text,
  model text,
  source_period_start date,
  source_period_end date,
  status text not null default 'active' check (status in ('active', 'dismissed', 'archived')),
  generated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  alert_id uuid references public.smart_alerts(id) on delete set null,
  title text not null,
  description text,
  owner_id uuid references public.users(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'cancelled')),
  priority public.alert_severity not null default 'medium',
  starts_on date,
  due_on date,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_plan_dates_valid check (
    due_on is null or starts_on is null or due_on >= starts_on
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'info',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  body text not null,
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email', 'sms')),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  format text not null check (format in ('pdf', 'xlsx')),
  storage_path text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  requested_by uuid references public.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

create index if not exists clinics_org_status_idx
  on public.clinics(organization_id, status);
create index if not exists companies_org_status_idx
  on public.companies(organization_id, status);
create index if not exists employees_org_status_idx
  on public.employees(organization_id, status);
create index if not exists employees_company_department_idx
  on public.employees(company_id, department);
create index if not exists assessments_org_status_created_idx
  on public.assessments(organization_id, status, created_at desc);
create index if not exists responses_assessment_status_idx
  on public.assessment_responses(assessment_id, status);
create index if not exists reports_org_created_idx
  on public.reports(organization_id, created_at desc);
create index if not exists index_snapshots_org_period_idx
  on public.psychosocial_index_snapshots(organization_id, period_end desc);
create index if not exists smart_alerts_org_status_idx
  on public.smart_alerts(organization_id, status, detected_at desc);
create index if not exists ai_insights_org_generated_idx
  on public.ai_insights(organization_id, generated_at desc);
create index if not exists action_plans_org_status_idx
  on public.action_plans(organization_id, status, due_on);
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, created_at desc)
  where read_at is null;
create index if not exists activity_events_org_occurred_idx
  on public.activity_events(organization_id, occurred_at desc);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'users', 'clinics', 'companies', 'employees',
    'roles', 'assessments', 'assessment_responses', 'reports',
    'smart_alerts', 'action_plans', 'communications'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function private.set_updated_at()',
      table_name
    );
  end loop;
end
$$;

create or replace function private.protect_user_authorization_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() = old.id
    and (
      new.organization_id is distinct from old.organization_id
      or new.role is distinct from old.role
    )
  then
    raise exception 'Authorization fields cannot be changed by the profile owner';
  end if;
  return new;
end
$$;

drop trigger if exists protect_user_authorization_fields on public.users;
create trigger protect_user_authorization_fields
before update on public.users
for each row execute function private.protect_user_authorization_fields();

-- ============================================================================
-- GRANTS AND RLS FOR CORE CRUD
-- ============================================================================

grant select, insert, update, delete on table
  public.organizations,
  public.clinics,
  public.companies,
  public.employees,
  public.assessments,
  public.assessment_responses,
  public.reports
to authenticated;

drop policy if exists "Organization admins can update organization" on public.organizations;
create policy "Organization admins can update organization"
on public.organizations for update to authenticated
using (id = private.current_organization_id() and private.current_user_role() = 'admin')
with check (id = private.current_organization_id());

drop policy if exists "Organization managers can create clinics" on public.clinics;
create policy "Organization managers can create clinics"
on public.clinics for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);
create policy "Organization managers can update clinics"
on public.clinics for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (organization_id = private.current_organization_id());
create policy "Organization admins can delete clinics"
on public.clinics for delete to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

drop policy if exists "Companies are visible to organization members" on public.companies;
create policy "Users can read permitted companies"
on public.companies for select to authenticated
using (private.can_access_company(id));
create policy "Organization managers can create companies"
on public.companies for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);
create policy "Organization managers can update companies"
on public.companies for update to authenticated
using (private.can_access_company(id) and private.can_manage_organization())
with check (organization_id = private.current_organization_id());
create policy "Organization admins can delete companies"
on public.companies for delete to authenticated
using (private.can_access_company(id) and private.current_user_role() = 'admin');

drop policy if exists "Employees are visible to company members" on public.employees;
create policy "Users can read permitted employees"
on public.employees for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_access_company(company_id)
);
create policy "Organization managers can create employees"
on public.employees for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_access_company(company_id)
  and private.can_manage_organization()
);
create policy "Organization managers can update employees"
on public.employees for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_access_company(company_id)
  and private.can_manage_organization()
)
with check (
  organization_id = private.current_organization_id()
  and private.can_access_company(company_id)
);
create policy "Organization admins can delete employees"
on public.employees for delete to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_access_company(company_id)
  and private.current_user_role() = 'admin'
);

create policy "Organization managers can create assessments"
on public.assessments for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);
create policy "Organization managers can update assessments"
on public.assessments for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (organization_id = private.current_organization_id());
create policy "Organization admins can delete assessments"
on public.assessments for delete to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

drop policy if exists "Assessment responses are visible to organization members"
  on public.assessment_responses;
create policy "Managers can read assessment responses"
on public.assessment_responses for select to authenticated
using (
  private.can_manage_organization()
  and private.valid_assessment_participant(assessment_id, employee_id)
);
create policy "Managers can create assessment responses"
on public.assessment_responses for insert to authenticated
with check (
  private.can_manage_organization()
  and private.valid_assessment_participant(assessment_id, employee_id)
);
create policy "Managers can update assessment responses"
on public.assessment_responses for update to authenticated
using (
  private.can_manage_organization()
  and private.valid_assessment_participant(assessment_id, employee_id)
)
with check (
  private.can_manage_organization()
  and private.valid_assessment_participant(assessment_id, employee_id)
);

create policy "Organization managers can create reports"
on public.reports for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);
create policy "Organization managers can update reports"
on public.reports for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (organization_id = private.current_organization_id());
create policy "Organization admins can delete reports"
on public.reports for delete to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

-- ============================================================================
-- RLS FOR NEW TABLES
-- ============================================================================

alter table public.user_scopes enable row level security;
alter table public.psychosocial_index_snapshots enable row level security;
alter table public.smart_alerts enable row level security;
alter table public.ai_insights enable row level security;
alter table public.action_plans enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_events enable row level security;
alter table public.communications enable row level security;
alter table public.report_exports enable row level security;

revoke all on table
  public.user_scopes,
  public.psychosocial_index_snapshots,
  public.smart_alerts,
  public.ai_insights,
  public.action_plans,
  public.notifications,
  public.activity_events,
  public.communications,
  public.report_exports
from anon;

grant select, insert, update, delete on table
  public.user_scopes,
  public.psychosocial_index_snapshots,
  public.smart_alerts,
  public.ai_insights,
  public.action_plans,
  public.notifications,
  public.activity_events,
  public.communications,
  public.report_exports
to authenticated;

create policy "Admins manage user scopes"
on public.user_scopes for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
)
with check (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

create policy "Members read organization index snapshots"
on public.psychosocial_index_snapshots for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (company_id is null or private.can_access_company(company_id))
);
create policy "Managers manage organization index snapshots"
on public.psychosocial_index_snapshots for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);

create policy "Members read permitted alerts"
on public.smart_alerts for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (company_id is null or private.can_access_company(company_id))
);
create policy "Managers manage alerts"
on public.smart_alerts for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);

create policy "Members read permitted AI insights"
on public.ai_insights for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (company_id is null or private.can_access_company(company_id))
);
create policy "Managers manage AI insights"
on public.ai_insights for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);

create policy "Members read permitted action plans"
on public.action_plans for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (company_id is null or private.can_access_company(company_id))
);
create policy "Managers manage action plans"
on public.action_plans for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);

create policy "Users read their notifications"
on public.notifications for select to authenticated
using (
  organization_id = private.current_organization_id()
  and user_id = auth.uid()
);
create policy "Users update their notifications"
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "Managers create notifications"
on public.notifications for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);

create policy "Members read organization activities"
on public.activity_events for select to authenticated
using (organization_id = private.current_organization_id());
create policy "Authenticated users create organization activities"
on public.activity_events for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and actor_id = auth.uid()
);

create policy "Members read permitted communications"
on public.communications for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (company_id is null or private.can_access_company(company_id))
);
create policy "Managers manage communications"
on public.communications for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);

create policy "Members read organization report exports"
on public.report_exports for select to authenticated
using (organization_id = private.current_organization_id());
create policy "Managers manage report exports"
on public.report_exports for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
)
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);
