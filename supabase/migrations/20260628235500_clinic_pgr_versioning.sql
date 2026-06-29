begin;

create table if not exists public.pgr_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  period_start date,
  period_end date,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  current_version integer not null default 1 check (current_version > 0),
  published_at timestamptz,
  published_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pgr_period_valid check (
    period_end is null or period_start is null or period_end >= period_start
  )
);

create table if not exists public.pgr_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  pgr_id uuid not null references public.pgr_programs(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  change_summary text,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'superseded')),
  document_bucket text,
  document_path text,
  created_by uuid references public.users(id) on delete set null,
  published_by uuid references public.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pgr_id, version_number)
);

create index if not exists pgr_programs_clinic_company_idx
  on public.pgr_programs(clinic_id, company_id, status);
create index if not exists pgr_versions_pgr_version_idx
  on public.pgr_versions(pgr_id, version_number desc);

drop trigger if exists set_updated_at on public.pgr_programs;
create trigger set_updated_at before update on public.pgr_programs
for each row execute function private.set_updated_at();

drop trigger if exists set_updated_at on public.pgr_versions;
create trigger set_updated_at before update on public.pgr_versions
for each row execute function private.set_updated_at();

alter table public.pgr_programs enable row level security;
alter table public.pgr_versions enable row level security;

revoke all on table public.pgr_programs from anon;
revoke all on table public.pgr_versions from anon;
grant select, insert, update, delete on table public.pgr_programs to authenticated;
grant select, insert, update, delete on table public.pgr_versions to authenticated;

drop policy if exists "Clinics manage PGR programs" on public.pgr_programs;
create policy "Clinics manage PGR programs"
on public.pgr_programs for all to authenticated
using (
  private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_staff'],
    clinic_id
  )
)
with check (
  private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_staff'],
    clinic_id
  )
);

drop policy if exists "Companies read published PGR programs" on public.pgr_programs;
create policy "Companies read published PGR programs"
on public.pgr_programs for select to authenticated
using (
  status = 'published'
  and private.has_portal_membership(
    'company'::public.portal_type,
    clinic_id,
    company_id
  )
);

drop policy if exists "Clinics manage PGR versions" on public.pgr_versions;
create policy "Clinics manage PGR versions"
on public.pgr_versions for all to authenticated
using (
  private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_staff'],
    clinic_id
  )
)
with check (
  private.has_portal_role(
    'clinic'::public.portal_type,
    array['clinic_admin', 'clinic_staff'],
    clinic_id
  )
);

drop policy if exists "Companies read published PGR versions" on public.pgr_versions;
create policy "Companies read published PGR versions"
on public.pgr_versions for select to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.pgr_programs pgr
    where pgr.id = pgr_versions.pgr_id
      and pgr.status = 'published'
      and private.has_portal_membership(
        'company'::public.portal_type,
        pgr.clinic_id,
        pgr.company_id
      )
  )
);

commit;
