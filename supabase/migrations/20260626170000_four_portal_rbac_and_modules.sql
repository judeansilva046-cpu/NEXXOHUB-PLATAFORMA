-- Four-portal RBAC hardening and production module foundation.

create or replace function private.normalize_portal_role(role_name text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case role_name
    when 'super_admin' then 'nexxohub_admin'
    when 'admin' then 'nexxohub_admin'
    when 'financeiro' then 'nexxohub_operator'
    when 'comercial' then 'nexxohub_operator'
    when 'suporte' then 'nexxohub_operator'
    when 'tecnologia' then 'nexxohub_operator'
    when 'clinic_financial' then 'clinic_staff'
    when 'clinic_professional' then 'clinic_staff'
    when 'psychologist' then 'clinic_staff'
    when 'analyst' then 'clinic_staff'
    when 'hr' then 'company_hr'
    when 'compliance' then 'company_compliance'
    when 'director' then 'company_director'
    when 'manager' then 'company_manager'
    else role_name
  end
$$;

revoke all on function private.normalize_portal_role(text) from public, anon;
grant execute on function private.normalize_portal_role(text) to authenticated;

alter table public.roles
  add column if not exists role_key text,
  add column if not exists portal public.portal_type,
  add column if not exists permissions jsonb not null default '{}'::jsonb;

update public.roles
set role_key = coalesce(role_key, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g')));

alter table public.roles
  alter column role_key set not null;

create unique index if not exists roles_organization_role_key_unique
  on public.roles(organization_id, role_key);

update public.portal_memberships
set role = private.normalize_portal_role(role);

alter table public.portal_memberships
  drop constraint if exists portal_memberships_role_check,
  add constraint portal_memberships_role_check check (
    role in (
      'nexxohub_admin',
      'nexxohub_operator',
      'clinic_admin',
      'clinic_staff',
      'company_admin',
      'company_director',
      'company_hr',
      'company_compliance',
      'company_governance',
      'company_manager',
      'employee'
    )
  );

create or replace function private.has_portal_role(
  target_portal public.portal_type,
  allowed_roles text[],
  target_clinic_id uuid default null,
  target_company_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
    from public.portal_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.portal = target_portal
      and private.normalize_portal_role(membership.role) in (
        select private.normalize_portal_role(allowed_role)
        from unnest(allowed_roles) allowed_role
      )
      and membership.is_active
      and (target_clinic_id is null or membership.clinic_id = target_clinic_id)
      and (target_company_id is null or membership.company_id = target_company_id)
  ), false)
$$;

create or replace function private.is_nexxohub_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_portal_role(
    'nexxohub'::public.portal_type,
    array['nexxohub_admin']
  )
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles (id, organization_id, email, full_name, created_at, updated_at)
select id, organization_id, email, full_name, created_at, updated_at
from public.users
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = now();

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid references public.companies(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid references public.companies(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid references public.companies(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  video_provider text check (video_provider is null or video_provider in ('vimeo')),
  video_external_id text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid references public.companies(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  resource_type text not null check (resource_type in ('pdf', 'audio', 'image', 'file', 'link')),
  storage_bucket text,
  storage_path text,
  external_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid references public.companies(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  issued_at timestamptz not null default now(),
  certificate_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  week_start date not null,
  mood_score integer not null check (mood_score between 1 and 5),
  stress_score integer not null check (stress_score between 1 and 5),
  sleep_score integer check (sleep_score is null or sleep_score between 1 and 5),
  comments text,
  created_at timestamptz not null default now(),
  unique (employee_id, week_start)
);

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  subject text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_treatment', 'closed')),
  assigned_to uuid references public.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  is_anonymous boolean not null default true,
  category text not null,
  description text not null,
  status text not null default 'received' check (status in ('received', 'reviewing', 'closed')),
  assigned_to uuid references public.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_anonymous and employee_id is null) or (not is_anonymous and employee_id is not null))
);

create table if not exists public.nr1_dossiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'generated', 'archived')),
  storage_bucket text,
  storage_path text,
  generated_by uuid references public.users(id) on delete set null,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  monthly_price numeric(12,2) not null default 0 check (monthly_price >= 0),
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  billing_plan_id uuid not null references public.billing_plans(id) on delete restrict,
  status text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  starts_on date not null default current_date,
  ends_on date,
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  provider text not null check (provider in ('asaas', 'vimeo', 'claude', 'email', 'webhook')),
  scope text not null default 'global' check (scope in ('global', 'clinic')),
  is_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  secret_ref text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (scope = 'global' and clinic_id is null)
    or (scope = 'clinic' and clinic_id is not null)
  )
);

create unique index if not exists integration_settings_unique_scope
  on public.integration_settings(
    provider,
    scope,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(clinic_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'programs',
    'tracks',
    'modules',
    'lessons',
    'lesson_resources',
    'quizzes',
    'certificates',
    'weekly_checkins',
    'help_requests',
    'complaints',
    'nr1_dossiers',
    'billing_plans',
    'subscriptions',
    'integration_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
  end loop;
end
$$;

create policy "Profiles are visible to the owner and authorized tenant admins"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or private.is_nexxohub_admin()
  or exists (
    select 1 from public.portal_memberships membership
    where membership.user_id = profiles.id
      and (
        private.has_portal_role('clinic'::public.portal_type, array['clinic_admin'], membership.clinic_id)
        or private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_hr'], membership.clinic_id, membership.company_id)
      )
  )
);

create policy "Users update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "NexxoHub manages billing plans"
on public.billing_plans for all to authenticated
using (private.is_nexxohub_admin())
with check (private.is_nexxohub_admin());

create policy "NexxoHub manages global integration settings"
on public.integration_settings for all to authenticated
using (
  private.is_nexxohub_admin()
  or (
    clinic_id is not null
    and private.has_portal_role('clinic'::public.portal_type, array['clinic_admin'], clinic_id)
  )
)
with check (
  private.is_nexxohub_admin()
  or (
    clinic_id is not null
    and private.has_portal_role('clinic'::public.portal_type, array['clinic_admin'], clinic_id)
  )
);

create policy "Tenant users read scoped learning content"
on public.programs for select to authenticated
using (
  status = 'active'
  and (
    private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id)
    or private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
    or exists (
      select 1 from public.portal_memberships membership
      where membership.user_id = (select auth.uid())
        and membership.portal = 'employee'
        and membership.company_id = programs.company_id
        and membership.is_active
    )
  )
);

create policy "Clinics manage learning programs"
on public.programs for all to authenticated
using (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id))
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Tenant users read scoped tracks"
on public.tracks for select to authenticated
using (exists (select 1 from public.programs p where p.id = tracks.program_id));

create policy "Clinics manage tracks"
on public.tracks for all to authenticated
using (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id))
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Tenant users read scoped modules"
on public.modules for select to authenticated
using (private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
  or private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id));

create policy "Clinics manage modules"
on public.modules for all to authenticated
using (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id))
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Tenant users read scoped lessons"
on public.lessons for select to authenticated
using (private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
  or private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id));

create policy "Clinics manage lessons"
on public.lessons for all to authenticated
using (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id))
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Tenant users read scoped resources"
on public.lesson_resources for select to authenticated
using (private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
  or private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id));

create policy "Clinics manage lesson resources"
on public.lesson_resources for all to authenticated
using (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id))
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Tenant users read scoped quizzes"
on public.quizzes for select to authenticated
using (private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
  or private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id));

create policy "Clinics manage quizzes"
on public.quizzes for all to authenticated
using (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id))
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Certificates are visible by scoped tenant"
on public.certificates for select to authenticated
using (
  private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id)
  or private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_hr', 'company_compliance', 'company_governance'], clinic_id, company_id)
  or private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id, employee_id)
);

create policy "Clinics issue certificates"
on public.certificates for insert to authenticated
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Employees manage their own weekly checkins"
on public.weekly_checkins for all to authenticated
using (private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id, employee_id))
with check (private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id, employee_id));

create policy "Employees create help requests"
on public.help_requests for insert to authenticated
with check (private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id, employee_id));

create policy "Help requests visible to owner and company HR"
on public.help_requests for select to authenticated
using (
  private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id, employee_id)
  or private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_hr'], clinic_id, company_id)
);

create policy "Company HR treats help requests"
on public.help_requests for update to authenticated
using (private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_hr'], clinic_id, company_id))
with check (private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_hr'], clinic_id, company_id));

create policy "Employees create complaints"
on public.complaints for insert to authenticated
with check (
  (
    is_anonymous
    and employee_id is null
    and private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id)
  )
  or (
    not is_anonymous
    and employee_id is not null
    and private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id, employee_id)
  )
);

create policy "Complaints visible to governance roles"
on public.complaints for select to authenticated
using (
  private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_compliance', 'company_governance'], clinic_id, company_id)
  or (employee_id is not null and private.has_portal_membership('employee'::public.portal_type, clinic_id, company_id, employee_id))
);

create policy "Governance treats complaints"
on public.complaints for update to authenticated
using (private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_compliance', 'company_governance'], clinic_id, company_id))
with check (private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_compliance', 'company_governance'], clinic_id, company_id));

create policy "Scoped users read NR1 dossiers"
on public.nr1_dossiers for select to authenticated
using (
  private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id)
  or private.has_portal_role('company'::public.portal_type, array['company_admin', 'company_compliance', 'company_governance'], clinic_id, company_id)
);

create policy "Clinics manage NR1 dossiers"
on public.nr1_dossiers for all to authenticated
using (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id))
with check (private.has_portal_role('clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id));

create policy "Scoped users read subscriptions"
on public.subscriptions for select to authenticated
using (
  private.is_nexxohub_admin()
  or (clinic_id is not null and private.has_portal_role('clinic'::public.portal_type, array['clinic_admin'], clinic_id))
  or (company_id is not null and private.has_portal_role('company'::public.portal_type, array['company_admin'], clinic_id, company_id))
);

create policy "NexxoHub manages subscriptions"
on public.subscriptions for all to authenticated
using (private.is_nexxohub_admin())
with check (private.is_nexxohub_admin());

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

  insert into public.profiles (id, email, full_name, organization_id)
  values (new.id, new.email, full_name_value, new_tenant_id)
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      organization_id = excluded.organization_id,
      updated_at = now();

  insert into public.portal_memberships (
    user_id, portal, role, organization_id, is_active
  )
  values (new.id, 'nexxohub', 'nexxohub_admin', new_tenant_id, true);

  return new;
end;
$$;

insert into public.roles (organization_id, name, role_key, portal, description)
select organization_row.id, role_data.name, role_data.role_key, role_data.portal::public.portal_type, role_data.description
from public.organizations organization_row
cross join (
  values
    ('NexxoHub Admin', 'nexxohub_admin', 'nexxohub', 'Administrador master SaaS'),
    ('NexxoHub Operator', 'nexxohub_operator', 'nexxohub', 'Operador interno NexxoHub'),
    ('Clinic Admin', 'clinic_admin', 'clinic', 'Administrador técnico da clínica'),
    ('Clinic Staff', 'clinic_staff', 'clinic', 'Equipe técnica da clínica'),
    ('Company Admin', 'company_admin', 'company', 'Administrador da empresa'),
    ('Company Director', 'company_director', 'company', 'Diretoria'),
    ('Company HR', 'company_hr', 'company', 'Recursos humanos'),
    ('Company Compliance', 'company_compliance', 'company', 'Compliance'),
    ('Company Governance', 'company_governance', 'company', 'Governança'),
    ('Company Manager', 'company_manager', 'company', 'Gestor'),
    ('Employee', 'employee', 'employee', 'Colaborador')
) as role_data(name, role_key, portal, description)
on conflict (organization_id, role_key) do update
set name = excluded.name,
    portal = excluded.portal,
    description = excluded.description,
    updated_at = now();
