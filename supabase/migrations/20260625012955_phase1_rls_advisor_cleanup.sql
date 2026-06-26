-- Make the service-only response policy explicit and avoid overlapping
-- permissive SELECT policies on authorization join tables.

create policy "Portal users cannot access raw assessment responses"
on public.assessment_responses
for all
to authenticated
using (false)
with check (false);

drop policy if exists "Organization admins can manage role permissions"
  on public.role_permissions;

create policy "Organization admins can create role permissions"
on public.role_permissions for insert to authenticated
with check (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.roles role_row
    where role_row.id = role_permissions.role_id
      and role_row.organization_id = private.current_organization_id()
  )
);

create policy "Organization admins can update role permissions"
on public.role_permissions for update to authenticated
using (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.roles role_row
    where role_row.id = role_permissions.role_id
      and role_row.organization_id = private.current_organization_id()
  )
)
with check (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.roles role_row
    where role_row.id = role_permissions.role_id
      and role_row.organization_id = private.current_organization_id()
  )
);

create policy "Organization admins can delete role permissions"
on public.role_permissions for delete to authenticated
using (
  private.current_user_role() = 'admin'
  and exists (
    select 1
    from public.roles role_row
    where role_row.id = role_permissions.role_id
      and role_row.organization_id = private.current_organization_id()
  )
);

drop policy if exists "Organization admins can manage role assignments"
  on public.user_roles;

create policy "Organization admins can create role assignments"
on public.user_roles for insert to authenticated
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
on public.user_roles for update to authenticated
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
on public.user_roles for delete to authenticated
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
