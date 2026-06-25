-- Secure RBAC tables exposed through the Supabase Data API.
-- This migration is intentionally limited to RBAC and advisor findings.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from public.users
  where id = (select auth.uid())
$$;

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.users
  where id = (select auth.uid())
$$;

revoke all on function private.current_organization_id() from public, anon;
revoke all on function private.current_user_role() from public, anon;
grant execute on function private.current_organization_id() to authenticated;
grant execute on function private.current_user_role() to authenticated;

revoke all on table public.organizations from anon;
revoke all on table public.users from anon;
revoke all on table public.clinics from anon;
revoke all on table public.companies from anon;
revoke all on table public.employees from anon;
revoke all on table public.assessments from anon;
revoke all on table public.assessment_responses from anon;
revoke all on table public.reports from anon;
revoke all on table public.audit_logs from anon;

grant select on table public.organizations to authenticated;
grant select on table public.users to authenticated;
grant select on table public.clinics to authenticated;
grant select on table public.companies to authenticated;
grant select on table public.employees to authenticated;
grant select on table public.assessments to authenticated;
grant select on table public.assessment_responses to authenticated;
grant select on table public.reports to authenticated;
grant select on table public.audit_logs to authenticated;

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.roles enable row level security;

revoke all on table public.permissions from anon;
revoke all on table public.role_permissions from anon;
revoke all on table public.user_roles from anon;
revoke all on table public.roles from anon;

grant select on table public.permissions to authenticated;
grant select, insert, update, delete on table public.role_permissions to authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;
grant select, insert, update, delete on table public.roles to authenticated;

drop policy if exists "Authenticated users can read permissions" on public.permissions;
create policy "Authenticated users can read permissions"
on public.permissions
for select
to authenticated
using (true);

drop policy if exists "Organization members can read roles" on public.roles;
create policy "Organization members can read roles"
on public.roles
for select
to authenticated
using (
  organization_id = private.current_organization_id()
);

drop policy if exists "Organization admins can manage roles" on public.roles;
create policy "Organization admins can create roles"
on public.roles
for insert
to authenticated
with check (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

create policy "Organization admins can update roles"
on public.roles
for update
to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
)
with check (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

create policy "Organization admins can delete roles"
on public.roles
for delete
to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

drop policy if exists "Organization members can read role permissions" on public.role_permissions;
create policy "Organization members can read role permissions"
on public.role_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id = private.current_organization_id()
  )
);

drop policy if exists "Organization admins can manage role permissions" on public.role_permissions;
create policy "Organization admins can create role permissions"
on public.role_permissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id = private.current_organization_id()
      and private.current_user_role() = 'admin'
  )
);

create policy "Organization admins can update role permissions"
on public.role_permissions
for update
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id = private.current_organization_id()
      and private.current_user_role() = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id = private.current_organization_id()
      and private.current_user_role() = 'admin'
  )
);

create policy "Organization admins can delete role permissions"
on public.role_permissions
for delete
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id = private.current_organization_id()
      and private.current_user_role() = 'admin'
  )
);

drop policy if exists "Users can read their own role assignments" on public.user_roles;
drop policy if exists "Organization admins can read role assignments" on public.user_roles;
create policy "Users can read permitted role assignments"
on public.user_roles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (
    private.current_user_role() = 'admin'
    and exists (
      select 1 from public.users target_user
      where target_user.id = user_roles.user_id
        and target_user.organization_id = private.current_organization_id()
    )
  )
);

drop policy if exists "Organization admins can manage role assignments" on public.user_roles;
create policy "Organization admins can create role assignments"
on public.user_roles
for insert
to authenticated
with check (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.users target_user
    join public.roles assigned_role
      on assigned_role.id = user_roles.role_id
     and assigned_role.organization_id = target_user.organization_id
    where target_user.id = user_roles.user_id
      and target_user.organization_id = private.current_organization_id()
  )
);

create policy "Organization admins can update role assignments"
on public.user_roles
for update
to authenticated
using (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.users target_user
    join public.roles assigned_role
      on assigned_role.id = user_roles.role_id
     and assigned_role.organization_id = target_user.organization_id
    where target_user.id = user_roles.user_id
      and target_user.organization_id = private.current_organization_id()
  )
)
with check (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.users target_user
    join public.roles assigned_role
      on assigned_role.id = user_roles.role_id
     and assigned_role.organization_id = target_user.organization_id
    where target_user.id = user_roles.user_id
      and target_user.organization_id = private.current_organization_id()
  )
);

create policy "Organization admins can delete role assignments"
on public.user_roles
for delete
to authenticated
using (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.users target_user
    join public.roles assigned_role
      on assigned_role.id = user_roles.role_id
     and assigned_role.organization_id = target_user.organization_id
    where target_user.id = user_roles.user_id
      and target_user.organization_id = private.current_organization_id()
  )
);

-- Replace recursive and unscoped policies from the baseline migration.
drop policy if exists "Organizations are visible to their members" on public.organizations;
create policy "Organizations are visible to their members"
on public.organizations
for select
to authenticated
using (id = private.current_organization_id());

drop policy if exists "Users can see users in their organization" on public.users;
drop policy if exists "Users can update their own profile" on public.users;

create policy "Users can see users in their organization"
on public.users
for select
to authenticated
using (
  id = (select auth.uid())
  or organization_id = private.current_organization_id()
);

create policy "Users can update their own profile"
on public.users
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Clinics are visible to organization members" on public.clinics;
create policy "Clinics are visible to organization members"
on public.clinics
for select
to authenticated
using (organization_id = private.current_organization_id());

drop policy if exists "Companies are visible to organization members" on public.companies;
create policy "Companies are visible to organization members"
on public.companies
for select
to authenticated
using (organization_id = private.current_organization_id());

drop policy if exists "Employees are visible to company members" on public.employees;
create policy "Employees are visible to company members"
on public.employees
for select
to authenticated
using (
  exists (
    select 1
    from public.companies company
    where company.id = employees.company_id
      and company.organization_id = private.current_organization_id()
  )
);

drop policy if exists "Assessments are visible to organization members" on public.assessments;
create policy "Assessments are visible to organization members"
on public.assessments
for select
to authenticated
using (organization_id = private.current_organization_id());

drop policy if exists "Assessment responses are visible to organization members" on public.assessment_responses;
create policy "Assessment responses are visible to organization members"
on public.assessment_responses
for select
to authenticated
using (
  exists (
    select 1
    from public.assessments assessment
    where assessment.id = assessment_responses.assessment_id
      and assessment.organization_id = private.current_organization_id()
  )
);

drop policy if exists "Reports are visible to organization members" on public.reports;
create policy "Reports are visible to organization members"
on public.reports
for select
to authenticated
using (organization_id = private.current_organization_id());

drop policy if exists "Audit logs are visible to organization admins" on public.audit_logs;
create policy "Audit logs are visible to organization admins"
on public.audit_logs
for select
to authenticated
using (
  organization_id = private.current_organization_id()
  and private.current_user_role() = 'admin'
);

create index if not exists idx_assessments_created_by
  on public.assessments(created_by);
create index if not exists idx_reports_generated_by
  on public.reports(generated_by);
create index if not exists idx_role_permissions_permission_id
  on public.role_permissions(permission_id);
create index if not exists idx_user_roles_role_id
  on public.user_roles(role_id);
