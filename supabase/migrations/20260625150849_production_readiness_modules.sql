-- Production-readiness modules missing from the applied migration chain.

create or replace function private.can_manage_organization()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() in ('admin', 'manager'), false)
$$;

revoke all on function private.can_manage_organization() from public, anon;
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

revoke all on function private.set_updated_at() from public, anon, authenticated;

alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists responsible_name text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'archived'));

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
  full_name_value text;
  organization_name_value text;
  organization_cnpj_value text;
begin
  full_name_value := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  organization_name_value := nullif(trim(new.raw_user_meta_data ->> 'organization_name'), '');
  organization_cnpj_value := regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'organization_cnpj', ''),
    '[^0-9]',
    '',
    'g'
  );

  if full_name_value is null
    or organization_name_value is null
    or length(organization_cnpj_value) <> 14 then
    raise exception 'Required organization data was not provided';
  end if;

  insert into public.organizations (
    name, legal_name, cnpj, responsible_name, email, status
  )
  values (
    organization_name_value,
    organization_name_value,
    organization_cnpj_value,
    full_name_value,
    new.email,
    'active'
  )
  returning id into new_tenant_id;

  insert into public.users (id, email, full_name, role, organization_id)
  values (new.id, new.email, full_name_value, 'admin', new_tenant_id);

  insert into public.portal_memberships (
    user_id, portal, role, organization_id, is_active
  )
  values (new.id, 'nexxohub', 'super_admin', new_tenant_id, true);

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create table public.psychosocial_index_snapshots (
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
  check (period_end >= period_start)
);

create table public.smart_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  alert_type text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  summary text not null,
  recommendation text,
  model text,
  source_period_start date,
  source_period_end date,
  status text not null default 'active'
    check (status in ('active', 'dismissed', 'archived')),
  generated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.action_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  alert_id uuid references public.smart_alerts(id) on delete set null,
  title text not null,
  description text,
  owner_id uuid references public.users(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  starts_on date,
  due_on date,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on is null or starts_on is null or due_on >= starts_on)
);

create table public.notifications (
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

create table public.nr1_risk_factors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  category text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  action_plan_id uuid references public.action_plans(id) on delete set null,
  title text not null,
  description text,
  intervention_type text not null,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  starts_on date,
  ends_on date,
  responsible_id uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.evidences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  action_plan_id uuid references public.action_plans(id) on delete set null,
  intervention_id uuid references public.interventions(id) on delete set null,
  title text not null,
  description text,
  evidence_date date,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  document_type text not null,
  title text not null,
  storage_bucket text,
  storage_path text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status text not null default 'registered'
    check (status in ('registered', 'processing', 'available', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  contract_number text not null,
  starts_on date not null,
  ends_on date,
  monthly_value numeric(14,2) not null check (monthly_value >= 0),
  platform_percentage numeric(5,4) not null default 0.15
    check (platform_percentage between 0 and 1),
  covered_employees integer not null default 0 check (covered_employees >= 0),
  employee_registration_unit_fee numeric(10,2) not null default 7.00
    check (employee_registration_unit_fee >= 0),
  platform_commission numeric(14,2)
    generated always as (round(monthly_value * platform_percentage, 2)) stored,
  employee_registration_fee numeric(14,2)
    generated always as (
      round(covered_employees * employee_registration_unit_fee, 2)
    ) stored,
  expected_platform_revenue numeric(14,2)
    generated always as (
      round(
        monthly_value * platform_percentage
        + covered_employees * employee_registration_unit_fee,
        2
      )
    ) stored,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'expired', 'cancelled')),
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, contract_number),
  check (ends_on is null or ends_on >= starts_on)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  reference_month date not null,
  due_date date not null,
  amount numeric(14,2) not null check (amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  external_provider text,
  external_id text,
  paid_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, reference_month)
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  is_sensitive boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key)
);

alter table public.psychosocial_index_snapshots enable row level security;
alter table public.smart_alerts enable row level security;
alter table public.ai_insights enable row level security;
alter table public.action_plans enable row level security;
alter table public.notifications enable row level security;
alter table public.nr1_risk_factors enable row level security;
alter table public.interventions enable row level security;
alter table public.evidences enable row level security;
alter table public.documents enable row level security;
alter table public.contracts enable row level security;
alter table public.invoices enable row level security;
alter table public.settings enable row level security;

revoke all on table
  public.psychosocial_index_snapshots,
  public.smart_alerts,
  public.ai_insights,
  public.action_plans,
  public.notifications,
  public.nr1_risk_factors,
  public.interventions,
  public.evidences,
  public.documents,
  public.contracts,
  public.invoices,
  public.settings
from anon;

grant select, insert, update, delete on table
  public.psychosocial_index_snapshots,
  public.smart_alerts,
  public.ai_insights,
  public.action_plans,
  public.notifications,
  public.nr1_risk_factors,
  public.interventions,
  public.evidences,
  public.documents,
  public.contracts,
  public.invoices,
  public.settings
to authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'psychosocial_index_snapshots',
    'smart_alerts',
    'ai_insights',
    'action_plans'
  ]
  loop
    execute format(
      'create policy "Tenant members read %1$I" on public.%1$I
       for select to authenticated
       using (organization_id = private.current_organization_id())',
      target_table
    );
    execute format(
      'create policy "Tenant managers manage %1$I" on public.%1$I
       for all to authenticated
       using (
         organization_id = private.current_organization_id()
         and private.can_manage_organization()
       )
       with check (
         organization_id = private.current_organization_id()
         and private.can_manage_organization()
       )',
      target_table
    );
  end loop;
end
$$;

create policy "Users read their notifications"
on public.notifications for select to authenticated
using (
  organization_id = private.current_organization_id()
  and user_id = (select auth.uid())
);

create policy "Users update their notifications"
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (
  organization_id = private.current_organization_id()
  and user_id = (select auth.uid())
);

create policy "Tenant managers create notifications"
on public.notifications for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.can_manage_organization()
);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'nr1_risk_factors',
    'interventions',
    'evidences',
    'documents',
    'contracts',
    'invoices',
    'settings'
  ]
  loop
    execute format(
      'create policy "Tenant members read %1$I" on public.%1$I
       for select to authenticated
       using (tenant_id = private.current_organization_id())',
      target_table
    );
    execute format(
      'create policy "Tenant managers insert %1$I" on public.%1$I
       for insert to authenticated
       with check (
         tenant_id = private.current_organization_id()
         and private.can_manage_organization()
       )',
      target_table
    );
    execute format(
      'create policy "Tenant managers update %1$I" on public.%1$I
       for update to authenticated
       using (
         tenant_id = private.current_organization_id()
         and private.can_manage_organization()
       )
       with check (
         tenant_id = private.current_organization_id()
         and private.can_manage_organization()
       )',
      target_table
    );
    execute format(
      'create policy "Tenant managers delete %1$I" on public.%1$I
       for delete to authenticated
       using (
         tenant_id = private.current_organization_id()
         and private.can_manage_organization()
       )',
      target_table
    );
  end loop;
end
$$;

create index index_snapshots_org_period_idx
  on public.psychosocial_index_snapshots(organization_id, period_end desc);
create index smart_alerts_org_status_idx
  on public.smart_alerts(organization_id, status, detected_at desc);
create index ai_insights_org_generated_idx
  on public.ai_insights(organization_id, generated_at desc);
create index action_plans_org_status_idx
  on public.action_plans(organization_id, status, due_on);
create index notifications_user_unread_idx
  on public.notifications(user_id, created_at desc) where read_at is null;
create index nr1_risk_factors_tenant_company_idx
  on public.nr1_risk_factors(tenant_id, company_id);
create index interventions_tenant_company_idx
  on public.interventions(tenant_id, company_id);
create index evidences_tenant_company_idx
  on public.evidences(tenant_id, company_id);
create index documents_tenant_company_idx
  on public.documents(tenant_id, company_id);
create index contracts_tenant_status_idx on public.contracts(tenant_id, status);
create index contracts_clinic_idx on public.contracts(clinic_id);
create index contracts_company_idx on public.contracts(company_id);
create index invoices_tenant_status_due_idx
  on public.invoices(tenant_id, status, due_date);
create index settings_tenant_idx on public.settings(tenant_id);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'smart_alerts',
    'action_plans',
    'nr1_risk_factors',
    'interventions',
    'evidences',
    'documents',
    'contracts',
    'invoices',
    'settings'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function private.set_updated_at()',
      target_table
    );
  end loop;
end
$$;
