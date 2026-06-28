-- Company portal organization CRUD history visibility.
-- Lets company and clinic users read activity events only for records in their own scope.

create index if not exists activity_events_entity_lookup_idx
  on public.activity_events(entity_type, entity_id, occurred_at desc);

drop policy if exists "Portal users read scoped organization activity events"
  on public.activity_events;

create policy "Portal users read scoped organization activity events"
on public.activity_events for select to authenticated
using (
  organization_id = private.current_organization_id()
  and (
    private.is_nexxohub_operator()
    or (
      entity_type = 'branch'
      and exists (
        select 1
        from public.branches branch
        where branch.id = activity_events.entity_id
          and (
            private.has_portal_membership('clinic'::public.portal_type, branch.clinic_id)
            or private.has_portal_membership(
              'company'::public.portal_type,
              branch.clinic_id,
              branch.company_id
            )
          )
      )
    )
    or (
      entity_type = 'department'
      and exists (
        select 1
        from public.departments department
        join public.companies company on company.id = department.company_id
        where department.id = activity_events.entity_id
          and (
            private.has_portal_membership('clinic'::public.portal_type, company.clinic_id)
            or private.has_portal_membership(
              'company'::public.portal_type,
              company.clinic_id,
              company.id
            )
          )
      )
    )
    or (
      entity_type = 'position'
      and exists (
        select 1
        from public.positions position
        join public.companies company on company.id = position.company_id
        where position.id = activity_events.entity_id
          and (
            private.has_portal_membership('clinic'::public.portal_type, company.clinic_id)
            or private.has_portal_membership(
              'company'::public.portal_type,
              company.clinic_id,
              company.id
            )
          )
      )
    )
    or (
      entity_type = 'employee'
      and exists (
        select 1
        from public.employees employee
        join public.companies company on company.id = employee.company_id
        where employee.id = activity_events.entity_id
          and (
            private.has_portal_membership('clinic'::public.portal_type, company.clinic_id)
            or private.has_portal_membership(
              'company'::public.portal_type,
              company.clinic_id,
              company.id
            )
            or private.has_portal_membership(
              'employee'::public.portal_type,
              company.clinic_id,
              company.id,
              employee.id
            )
          )
      )
    )
  )
);
