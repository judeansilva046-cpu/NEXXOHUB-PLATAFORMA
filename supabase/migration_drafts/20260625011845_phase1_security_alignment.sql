-- DRAFT - depends on superseded feature migrations.
-- Phase 1: final security alignment after the legacy foundation migrations.
-- Raw psychosocial responses must never be exposed through the Data API.

-- Keep the self-service tenant owner role compatible with the portal role
-- constraint created by the identity hierarchy migration.
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
  organization_name_value := nullif(
    trim(new.raw_user_meta_data ->> 'organization_name'),
    ''
  );
  organization_cnpj_value := regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'organization_cnpj', ''),
    '[^0-9]',
    '',
    'g'
  );

  if full_name_value is null
    or organization_name_value is null
    or length(organization_cnpj_value) <> 14 then
    raise exception 'Dados obrigatorios da organizacao nao foram informados.';
  end if;

  insert into public.organizations (
    name,
    legal_name,
    cnpj,
    responsible_name,
    email,
    status
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

  insert into public.users (
    id,
    email,
    full_name,
    role,
    organization_id
  )
  values (
    new.id,
    new.email,
    full_name_value,
    'admin',
    new_tenant_id
  );

  insert into public.portal_memberships (
    user_id,
    portal,
    role,
    organization_id,
    is_active
  )
  values (
    new.id,
    'nexxohub',
    'super_admin',
    new_tenant_id,
    true
  );

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user()
  from public, anon, authenticated;

-- Remove every legacy portal policy from the raw response table.
drop policy if exists "Assessment responses are visible to organization members"
  on public.assessment_responses;
drop policy if exists "Managers can read assessment responses"
  on public.assessment_responses;
drop policy if exists "Managers can create assessment responses"
  on public.assessment_responses;
drop policy if exists "Managers can update assessment responses"
  on public.assessment_responses;

revoke all on table public.assessment_responses from anon, authenticated;
alter table public.assessment_responses enable row level security;

comment on table public.assessment_responses is
  'LEGACY RESTRICTED: raw psychosocial responses are service-only until the Phase 2 sensitive vault replaces this structure.';

-- Authorization tables are never available to anonymous clients.
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

revoke all on table public.permissions from anon;
revoke all on table public.roles from anon;
revoke all on table public.role_permissions from anon;
revoke all on table public.user_roles from anon;

-- Avoid per-row auth function re-evaluation on the remaining baseline profile
-- policy and prevent users from changing authorization fields in their profile.
drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
on public.users
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and organization_id = private.current_organization_id()
);

-- Cover foreign keys reported by the database advisor.
create index if not exists assessments_created_by_idx
  on public.assessments(created_by);
create index if not exists reports_generated_by_idx
  on public.reports(generated_by);
create index if not exists role_permissions_permission_id_idx
  on public.role_permissions(permission_id);
create index if not exists user_roles_role_id_idx
  on public.user_roles(role_id);
