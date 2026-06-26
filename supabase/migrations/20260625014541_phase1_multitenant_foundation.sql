-- Phase 1: clean multi-tenant hierarchy and four-portal authorization.

do $$
begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'portal_type'
  ) then
    create type public.portal_type
      as enum ('nexxohub', 'clinic', 'company', 'employee');
  end if;
end
$$;

alter table public.clinics
  add column if not exists responsible_name text,
  add column if not exists email text,
  add column if not exists specialties text[] not null default '{}',
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'archived'));

alter table public.companies
  add column if not exists clinic_id uuid
    references public.clinics(id) on delete restrict,
  add column if not exists legal_name text,
  add column if not exists hr_responsible text,
  add column if not exists email text,
  add column if not exists employee_count integer not null default 0
    check (employee_count >= 0),
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'archived'));

alter table public.employees
  add column if not exists organization_id uuid
    references public.organizations(id) on delete cascade,
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete set null,
  add column if not exists cpf text,
  add column if not exists registration text,
  add column if not exists admission_date date,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive', 'archived'));

update public.employees employee
set organization_id = company.organization_id
from public.companies company
where company.id = employee.company_id
  and employee.organization_id is null;

alter table public.employees
  alter column organization_id set not null;

create unique index if not exists clinics_id_organization_unique
  on public.clinics(id, organization_id);
create unique index if not exists companies_id_organization_unique
  on public.companies(id, organization_id);
create unique index if not exists companies_id_clinic_unique
  on public.companies(id, clinic_id);
create unique index if not exists employees_id_company_unique
  on public.employees(id, company_id);
create unique index if not exists employees_auth_user_unique
  on public.employees(auth_user_id)
  where auth_user_id is not null;
create unique index if not exists employees_org_cpf_unique
  on public.employees(organization_id, cpf)
  where cpf is not null;
create unique index if not exists employees_company_registration_unique
  on public.employees(company_id, registration)
  where registration is not null;
create index if not exists companies_clinic_id_idx
  on public.companies(clinic_id);
create index if not exists employees_organization_id_idx
  on public.employees(organization_id);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  cnpj text,
  city text,
  state text,
  address text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name),
  foreign key (clinic_id, organization_id)
    references public.clinics(id, organization_id),
  foreign key (company_id, clinic_id)
    references public.companies(id, clinic_id)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index departments_company_branch_name_unique
  on public.departments(
    company_id,
    coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
  );

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  cbo_code text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

alter table public.employees
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists position_id uuid references public.positions(id) on delete set null;

create index branches_company_status_idx on public.branches(company_id, status);
create index departments_company_status_idx on public.departments(company_id, status);
create index positions_company_status_idx on public.positions(company_id, status);
create index employees_branch_id_idx on public.employees(branch_id);
create index employees_department_id_idx on public.employees(department_id);
create index employees_position_id_idx on public.employees(position_id);

create table public.portal_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  portal public.portal_type not null,
  role text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_memberships_scope_check check (
    (portal = 'nexxohub' and clinic_id is null and company_id is null and employee_id is null)
    or (portal = 'clinic' and clinic_id is not null and company_id is null and employee_id is null)
    or (portal = 'company' and clinic_id is not null and company_id is not null and employee_id is null)
    or (
      portal = 'employee'
      and clinic_id is not null
      and company_id is not null
      and employee_id is not null
    )
  ),
  constraint portal_memberships_role_check check (
    role in (
      'super_admin', 'admin', 'financeiro', 'comercial', 'suporte', 'tecnologia',
      'clinic_admin', 'clinic_financial', 'clinic_professional', 'psychologist', 'analyst',
      'company_admin', 'hr', 'compliance', 'director', 'manager', 'employee'
    )
  ),
  foreign key (clinic_id, organization_id)
    references public.clinics(id, organization_id),
  foreign key (company_id, clinic_id)
    references public.companies(id, clinic_id),
  foreign key (employee_id, company_id)
    references public.employees(id, company_id)
);

create unique index portal_memberships_unique_scope
  on public.portal_memberships(
    user_id,
    portal,
    coalesce(clinic_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(employee_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index portal_memberships_user_active_idx
  on public.portal_memberships(user_id, portal) where is_active;
create index portal_memberships_organization_idx
  on public.portal_memberships(organization_id);
create index portal_memberships_clinic_idx
  on public.portal_memberships(clinic_id);
create index portal_memberships_company_idx
  on public.portal_memberships(company_id);
create index portal_memberships_employee_idx
  on public.portal_memberships(employee_id);

create table public.membership_scopes (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null
    references public.portal_memberships(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint membership_scopes_one_target check (
    (branch_id is not null)::integer + (department_id is not null)::integer = 1
  )
);

create unique index membership_scopes_branch_unique
  on public.membership_scopes(membership_id, branch_id)
  where branch_id is not null;
create unique index membership_scopes_department_unique
  on public.membership_scopes(membership_id, department_id)
  where department_id is not null;

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  title text not null,
  description text,
  occurred_at timestamptz not null default now()
);

create index activity_events_org_occurred_idx
  on public.activity_events(organization_id, occurred_at desc);

create or replace function private.has_portal_membership(
  target_portal public.portal_type,
  target_clinic_id uuid default null,
  target_company_id uuid default null,
  target_employee_id uuid default null
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
      and membership.is_active
      and (target_clinic_id is null or membership.clinic_id = target_clinic_id)
      and (target_company_id is null or membership.company_id = target_company_id)
      and (target_employee_id is null or membership.employee_id = target_employee_id)
  ), false)
$$;

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
      and membership.role = any(allowed_roles)
      and membership.is_active
      and (target_clinic_id is null or membership.clinic_id = target_clinic_id)
      and (target_company_id is null or membership.company_id = target_company_id)
  ), false)
$$;

create or replace function private.is_nexxohub_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_portal_membership('nexxohub'::public.portal_type)
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
    array['super_admin', 'admin']
  )
$$;

revoke all on function private.has_portal_membership(
  public.portal_type, uuid, uuid, uuid
) from public, anon;
revoke all on function private.has_portal_role(
  public.portal_type, text[], uuid, uuid
) from public, anon;
revoke all on function private.is_nexxohub_operator() from public, anon;
revoke all on function private.is_nexxohub_admin() from public, anon;
grant execute on function private.has_portal_membership(
  public.portal_type, uuid, uuid, uuid
) to authenticated;
grant execute on function private.has_portal_role(
  public.portal_type, text[], uuid, uuid
) to authenticated;
grant execute on function private.is_nexxohub_operator() to authenticated;
grant execute on function private.is_nexxohub_admin() to authenticated;

insert into public.users (id, email, full_name, role, organization_id)
select
  auth_user.id,
  auth_user.email,
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
    split_part(auth_user.email, '@', 1)
  ),
  case
    when auth_user.email = 'judeansilva046@gmail.com'
      then 'admin'::public.user_role
    else 'user'::public.user_role
  end,
  organization_row.id
from auth.users auth_user
cross join lateral (
  select id from public.organizations order by created_at, id limit 1
) organization_row
on conflict (id) do nothing;

insert into public.portal_memberships (
  user_id, portal, role, organization_id, is_active
)
select
  profile.id,
  'nexxohub'::public.portal_type,
  'super_admin',
  profile.organization_id,
  true
from public.users profile
where profile.email = 'judeansilva046@gmail.com'
on conflict do nothing;

alter table public.portal_memberships enable row level security;
alter table public.membership_scopes enable row level security;
alter table public.branches enable row level security;
alter table public.departments enable row level security;
alter table public.positions enable row level security;
alter table public.activity_events enable row level security;

revoke all on table public.portal_memberships from anon;
revoke all on table public.membership_scopes from anon;
revoke all on table public.branches from anon;
revoke all on table public.departments from anon;
revoke all on table public.positions from anon;
revoke all on table public.activity_events from anon;

grant select, insert, update, delete on table public.portal_memberships to authenticated;
grant select, insert, update, delete on table public.membership_scopes to authenticated;
grant select, insert, update, delete on table public.branches to authenticated;
grant select, insert, update, delete on table public.departments to authenticated;
grant select, insert, update, delete on table public.positions to authenticated;
grant select, insert on table public.activity_events to authenticated;

create policy "Users read permitted memberships"
on public.portal_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_nexxohub_admin()
  or (
    portal in ('company', 'employee')
    and private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin'],
      clinic_id
    )
  )
  or (
    portal = 'employee'
    and private.has_portal_role(
      'company'::public.portal_type,
      array['company_admin', 'hr'],
      clinic_id,
      company_id
    )
  )
);

create policy "Authorized admins create memberships"
on public.portal_memberships for insert to authenticated
with check (
  private.is_nexxohub_admin()
  or (
    portal in ('company', 'employee')
    and private.has_portal_role(
      'clinic'::public.portal_type,
      array['clinic_admin'],
      clinic_id
    )
  )
  or (
    portal = 'employee'
    and private.has_portal_role(
      'company'::public.portal_type,
      array['company_admin', 'hr'],
      clinic_id,
      company_id
    )
  )
);

create policy "Authorized admins update memberships"
on public.portal_memberships for update to authenticated
using (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin'], clinic_id
  )
  or private.has_portal_role(
    'company'::public.portal_type, array['company_admin', 'hr'], clinic_id, company_id
  )
)
with check (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin'], clinic_id
  )
  or private.has_portal_role(
    'company'::public.portal_type, array['company_admin', 'hr'], clinic_id, company_id
  )
);

create policy "NexxoHub admins delete memberships"
on public.portal_memberships for delete to authenticated
using (private.is_nexxohub_admin());

create policy "Users read permitted membership scopes"
on public.membership_scopes for select to authenticated
using (
  exists (
    select 1 from public.portal_memberships membership
    where membership.id = membership_scopes.membership_id
      and (
        membership.user_id = (select auth.uid())
        or private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type, array['clinic_admin'], membership.clinic_id
        )
        or private.has_portal_role(
          'company'::public.portal_type,
          array['company_admin', 'hr'],
          membership.clinic_id,
          membership.company_id
        )
      )
  )
);

create policy "Authorized admins manage membership scopes"
on public.membership_scopes for all to authenticated
using (
  exists (
    select 1 from public.portal_memberships membership
    where membership.id = membership_scopes.membership_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type, array['clinic_admin'], membership.clinic_id
        )
        or private.has_portal_role(
          'company'::public.portal_type,
          array['company_admin', 'hr'],
          membership.clinic_id,
          membership.company_id
        )
      )
  )
)
with check (
  exists (
    select 1 from public.portal_memberships membership
    where membership.id = membership_scopes.membership_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type, array['clinic_admin'], membership.clinic_id
        )
        or private.has_portal_role(
          'company'::public.portal_type,
          array['company_admin', 'hr'],
          membership.clinic_id,
          membership.company_id
        )
      )
  )
);

drop policy if exists "Clinics are visible to organization members" on public.clinics;
create policy "Portal users read permitted clinics"
on public.clinics for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, id)
  or exists (
    select 1 from public.portal_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.clinic_id = clinics.id
      and membership.is_active
  )
);
create policy "NexxoHub admins create clinics"
on public.clinics for insert to authenticated
with check (
  private.is_nexxohub_admin()
  and organization_id = private.current_organization_id()
);
create policy "NexxoHub admins update clinics"
on public.clinics for update to authenticated
using (private.is_nexxohub_admin())
with check (
  private.is_nexxohub_admin()
  and organization_id = private.current_organization_id()
);
create policy "NexxoHub admins delete clinics"
on public.clinics for delete to authenticated
using (private.is_nexxohub_admin());

drop policy if exists "Companies are visible to organization members" on public.companies;
create policy "Portal users read permitted companies"
on public.companies for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership('company'::public.portal_type, clinic_id, id)
  or exists (
    select 1 from public.portal_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.company_id = companies.id
      and membership.is_active
  )
);
create policy "Authorized admins create companies"
on public.companies for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type, array['clinic_admin'], clinic_id
    )
  )
);
create policy "Authorized admins update companies"
on public.companies for update to authenticated
using (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin'], clinic_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type, array['clinic_admin'], clinic_id
    )
  )
);
create policy "NexxoHub admins delete companies"
on public.companies for delete to authenticated
using (private.is_nexxohub_admin());

drop policy if exists "Employees are visible to organization members" on public.employees;
create policy "Portal users read permitted employees"
on public.employees for select to authenticated
using (
  private.is_nexxohub_operator()
  or exists (
    select 1 from public.companies company
    where company.id = employees.company_id
      and (
        private.has_portal_membership(
          'clinic'::public.portal_type, company.clinic_id
        )
        or private.has_portal_membership(
          'company'::public.portal_type, company.clinic_id, company.id
        )
      )
  )
  or private.has_portal_membership(
    'employee'::public.portal_type, null, company_id, id
  )
);
create policy "Authorized admins create employees"
on public.employees for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and exists (
    select 1 from public.companies company
    where company.id = employees.company_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type, array['clinic_admin'], company.clinic_id
        )
        or private.has_portal_role(
          'company'::public.portal_type,
          array['company_admin', 'hr'],
          company.clinic_id,
          company.id
        )
      )
  )
);
create policy "Authorized admins update employees"
on public.employees for update to authenticated
using (
  exists (
    select 1 from public.companies company
    where company.id = employees.company_id
      and (
        private.is_nexxohub_admin()
        or private.has_portal_role(
          'clinic'::public.portal_type, array['clinic_admin'], company.clinic_id
        )
        or private.has_portal_role(
          'company'::public.portal_type,
          array['company_admin', 'hr'],
          company.clinic_id,
          company.id
        )
      )
  )
)
with check (organization_id = private.current_organization_id());
create policy "NexxoHub admins delete employees"
on public.employees for delete to authenticated
using (private.is_nexxohub_admin());

create policy "Portal users read permitted branches"
on public.branches for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
);
create policy "Authorized admins manage branches"
on public.branches for all to authenticated
using (
  private.is_nexxohub_admin()
  or private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin'], clinic_id
  )
  or private.has_portal_role(
    'company'::public.portal_type,
    array['company_admin', 'hr'],
    clinic_id,
    company_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and (
    private.is_nexxohub_admin()
    or private.has_portal_role(
      'clinic'::public.portal_type, array['clinic_admin'], clinic_id
    )
    or private.has_portal_role(
      'company'::public.portal_type,
      array['company_admin', 'hr'],
      clinic_id,
      company_id
    )
  )
);

create policy "Portal users read permitted departments"
on public.departments for select to authenticated
using (
  private.is_nexxohub_operator()
  or exists (
    select 1 from public.companies company
    where company.id = departments.company_id
      and (
        private.has_portal_membership('clinic'::public.portal_type, company.clinic_id)
        or private.has_portal_membership(
          'company'::public.portal_type, company.clinic_id, company.id
        )
      )
  )
);
create policy "Authorized admins manage departments"
on public.departments for all to authenticated
using (
  private.is_nexxohub_admin()
  or exists (
    select 1 from public.companies company
    where company.id = departments.company_id
      and (
        private.has_portal_role(
          'clinic'::public.portal_type, array['clinic_admin'], company.clinic_id
        )
        or private.has_portal_role(
          'company'::public.portal_type,
          array['company_admin', 'hr'],
          company.clinic_id,
          company.id
        )
      )
  )
)
with check (organization_id = private.current_organization_id());

create policy "Portal users read permitted positions"
on public.positions for select to authenticated
using (
  private.is_nexxohub_operator()
  or exists (
    select 1 from public.companies company
    where company.id = positions.company_id
      and (
        private.has_portal_membership('clinic'::public.portal_type, company.clinic_id)
        or private.has_portal_membership(
          'company'::public.portal_type, company.clinic_id, company.id
        )
      )
  )
);
create policy "Authorized admins manage positions"
on public.positions for all to authenticated
using (
  private.is_nexxohub_admin()
  or exists (
    select 1 from public.companies company
    where company.id = positions.company_id
      and (
        private.has_portal_role(
          'clinic'::public.portal_type, array['clinic_admin'], company.clinic_id
        )
        or private.has_portal_role(
          'company'::public.portal_type,
          array['company_admin', 'hr'],
          company.clinic_id,
          company.id
        )
      )
  )
)
with check (organization_id = private.current_organization_id());

create policy "Organization members read activity events"
on public.activity_events for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.is_nexxohub_operator()
);
create policy "Authenticated users create scoped activity events"
on public.activity_events for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and actor_id = (select auth.uid())
);

drop policy if exists "Organizations are visible to their members"
  on public.organizations;
create policy "Membership users read their organization"
on public.organizations for select to authenticated
using (
  exists (
    select 1 from public.portal_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.organization_id = organizations.id
      and membership.is_active
  )
);

drop policy if exists "Users can see users in their organization" on public.users;
create policy "Users read permitted profiles"
on public.users for select to authenticated
using (
  id = (select auth.uid())
  or private.is_nexxohub_admin()
);
