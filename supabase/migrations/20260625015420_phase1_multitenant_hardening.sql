-- Enforce the clinic -> company hierarchy and remove overlapping policies.

alter table public.companies
  alter column clinic_id set not null;

create index activity_events_actor_id_idx
  on public.activity_events(actor_id);
create index branches_clinic_organization_idx
  on public.branches(clinic_id, organization_id);
create index branches_company_clinic_idx
  on public.branches(company_id, clinic_id);
create index branches_created_by_idx
  on public.branches(created_by);
create index branches_organization_idx
  on public.branches(organization_id);
create index departments_branch_id_idx
  on public.departments(branch_id);
create index departments_created_by_idx
  on public.departments(created_by);
create index departments_organization_idx
  on public.departments(organization_id);
create index membership_scopes_branch_id_idx
  on public.membership_scopes(branch_id);
create index membership_scopes_department_id_idx
  on public.membership_scopes(department_id);
create index portal_memberships_clinic_organization_idx
  on public.portal_memberships(clinic_id, organization_id);
create index portal_memberships_company_clinic_idx
  on public.portal_memberships(company_id, clinic_id);
create index portal_memberships_employee_company_idx
  on public.portal_memberships(employee_id, company_id);
create index portal_memberships_created_by_idx
  on public.portal_memberships(created_by);
create index positions_created_by_idx
  on public.positions(created_by);
create index positions_organization_idx
  on public.positions(organization_id);

drop policy if exists "Authorized admins manage membership scopes"
  on public.membership_scopes;
create policy "Authorized admins create membership scopes"
on public.membership_scopes for insert to authenticated
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
create policy "Authorized admins update membership scopes"
on public.membership_scopes for update to authenticated
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
create policy "Authorized admins delete membership scopes"
on public.membership_scopes for delete to authenticated
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
);

drop policy if exists "Authorized admins manage branches" on public.branches;
create policy "Authorized admins create branches"
on public.branches for insert to authenticated
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
create policy "Authorized admins update branches"
on public.branches for update to authenticated
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
with check (organization_id = private.current_organization_id());
create policy "Authorized admins delete branches"
on public.branches for delete to authenticated
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
);

drop policy if exists "Authorized admins manage departments" on public.departments;
create policy "Authorized admins create departments"
on public.departments for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and exists (
    select 1 from public.companies company
    where company.id = departments.company_id
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
create policy "Authorized admins update departments"
on public.departments for update to authenticated
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
create policy "Authorized admins delete departments"
on public.departments for delete to authenticated
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
);

drop policy if exists "Authorized admins manage positions" on public.positions;
create policy "Authorized admins create positions"
on public.positions for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and exists (
    select 1 from public.companies company
    where company.id = positions.company_id
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
create policy "Authorized admins update positions"
on public.positions for update to authenticated
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
create policy "Authorized admins delete positions"
on public.positions for delete to authenticated
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
);
