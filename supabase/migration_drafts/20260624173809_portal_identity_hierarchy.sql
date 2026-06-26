-- DRAFT - not applied to the official project; retained for reference only.
-- Four-portal identity and NexxoHub -> Clinic -> Company -> Employee hierarchy.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'portal_type') then
    create type public.portal_type as enum ('nexxohub', 'clinic', 'company', 'employee');
  end if;
end
$$;

alter table public.companies
  add column if not exists clinic_id uuid references public.clinics(id) on delete restrict;

alter table public.employees
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists employees_auth_user_unique
  on public.employees(auth_user_id)
  where auth_user_id is not null;
create index if not exists companies_clinic_id_idx on public.companies(clinic_id);

create table if not exists public.portal_memberships (
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
      'company_admin', 'hr', 'compliance', 'director', 'manager',
      'employee'
    )
  )
);

create unique index if not exists portal_memberships_unique_scope
  on public.portal_memberships(
    user_id,
    portal,
    coalesce(clinic_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(employee_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index if not exists portal_memberships_user_active_idx
  on public.portal_memberships(user_id, portal)
  where is_active;
create index if not exists portal_memberships_clinic_idx on public.portal_memberships(clinic_id);
create index if not exists portal_memberships_company_idx on public.portal_memberships(company_id);
create index if not exists portal_memberships_employee_idx on public.portal_memberships(employee_id);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  cnpj text,
  city text,
  state text,
  address text,
  status public.record_status not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, name)
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  name text not null,
  status public.record_status not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, branch_id, name)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  cbo_code text,
  status public.record_status not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, name)
);

alter table public.employees
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists position_id uuid references public.positions(id) on delete set null;

create index if not exists branches_company_status_idx on public.branches(company_id, status);
create index if not exists departments_company_status_idx on public.departments(company_id, status);
create index if not exists positions_company_status_idx on public.positions(company_id, status);
create index if not exists employees_branch_id_idx on public.employees(branch_id);
create index if not exists employees_department_id_idx on public.employees(department_id);
create index if not exists employees_position_id_idx on public.employees(position_id);

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
  select coalesce(
    exists (
      select 1
      from public.portal_memberships membership
      where membership.user_id = auth.uid()
        and membership.portal = target_portal
        and membership.is_active
        and (target_clinic_id is null or membership.clinic_id = target_clinic_id)
        and (target_company_id is null or membership.company_id = target_company_id)
        and (target_employee_id is null or membership.employee_id = target_employee_id)
    ),
    false
  )
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

revoke all on function private.has_portal_membership(
  public.portal_type, uuid, uuid, uuid
) from public, anon;
revoke all on function private.is_nexxohub_operator() from public, anon;
grant execute on function private.has_portal_membership(
  public.portal_type, uuid, uuid, uuid
) to authenticated;
grant execute on function private.is_nexxohub_operator() to authenticated;

alter table public.portal_memberships enable row level security;
alter table public.branches enable row level security;
alter table public.departments enable row level security;
alter table public.positions enable row level security;

revoke all on table
  public.portal_memberships,
  public.branches,
  public.departments,
  public.positions
from anon;
grant select, insert, update, delete on table
  public.portal_memberships,
  public.branches,
  public.departments,
  public.positions
to authenticated;

create policy "Users read their portal memberships"
on public.portal_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_nexxohub_operator()
  or (
    portal = 'clinic'
    and private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  )
  or (
    portal in ('company', 'employee')
    and private.has_portal_membership(
      'company'::public.portal_type, clinic_id, company_id
    )
  )
);

create policy "NexxoHub admins manage portal memberships"
on public.portal_memberships for all to authenticated
using (private.is_nexxohub_operator())
with check (private.is_nexxohub_operator());

create policy "Clinic admins manage downstream memberships"
on public.portal_memberships for all to authenticated
using (
  portal in ('company', 'employee')
  and private.has_portal_membership('clinic'::public.portal_type, clinic_id)
)
with check (
  portal in ('company', 'employee')
  and private.has_portal_membership('clinic'::public.portal_type, clinic_id)
);

create policy "Company admins manage employee memberships"
on public.portal_memberships for all to authenticated
using (
  portal = 'employee'
  and private.has_portal_membership(
    'company'::public.portal_type, clinic_id, company_id
  )
)
with check (
  portal = 'employee'
  and private.has_portal_membership(
    'company'::public.portal_type, clinic_id, company_id
  )
);

create policy "Permitted users read branches"
on public.branches for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership(
    'company'::public.portal_type, clinic_id, company_id
  )
);
create policy "Company portal manages branches"
on public.branches for all to authenticated
using (
  private.has_portal_membership(
    'company'::public.portal_type, clinic_id, company_id
  )
)
with check (
  private.has_portal_membership(
    'company'::public.portal_type, clinic_id, company_id
  )
);

create policy "Permitted users read departments"
on public.departments for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership(
    'company'::public.portal_type, null, company_id
  )
  or exists (
    select 1 from public.companies company
    where company.id = departments.company_id
      and private.has_portal_membership(
        'clinic'::public.portal_type, company.clinic_id
      )
  )
);
create policy "Company portal manages departments"
on public.departments for all to authenticated
using (
  private.has_portal_membership(
    'company'::public.portal_type, null, company_id
  )
)
with check (
  private.has_portal_membership(
    'company'::public.portal_type, null, company_id
  )
);

create policy "Permitted users read positions"
on public.positions for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership(
    'company'::public.portal_type, null, company_id
  )
  or exists (
    select 1 from public.companies company
    where company.id = positions.company_id
      and private.has_portal_membership(
        'clinic'::public.portal_type, company.clinic_id
      )
  )
);
create policy "Company portal manages positions"
on public.positions for all to authenticated
using (
  private.has_portal_membership(
    'company'::public.portal_type, null, company_id
  )
)
with check (
  private.has_portal_membership(
    'company'::public.portal_type, null, company_id
  )
);

-- Preserve current administrator access while the existing account is migrated
-- to portal_memberships. This is data-derived and does not hardcode user IDs.
insert into public.portal_memberships (
  user_id, portal, role, organization_id, is_active
)
select
  users.id,
  'nexxohub'::public.portal_type,
  case when users.role = 'admin' then 'super_admin' else 'admin' end,
  users.organization_id,
  true
from public.users
where users.role in ('admin', 'manager')
on conflict do nothing;
