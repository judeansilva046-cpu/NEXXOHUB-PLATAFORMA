begin;

create table if not exists public.technical_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  title text not null,
  summary text,
  case_type text not null default 'monitoring'
    check (case_type in ('monitoring', 'help_request', 'complaint', 'intervention', 'other')),
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'referred', 'closed', 'archived')),
  assigned_to uuid references public.users(id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technical_case_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  case_id uuid not null references public.technical_cases(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  event_type text not null default 'technical_note'
    check (
      event_type in (
        'attendance',
        'technical_note',
        'referral',
        'evidence',
        'intervention',
        'status_change'
      )
    ),
  title text not null,
  description text,
  event_date timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists technical_cases_clinic_company_status_idx
  on public.technical_cases(clinic_id, company_id, status);
create index if not exists technical_cases_employee_idx
  on public.technical_cases(employee_id);
create index if not exists technical_case_events_case_date_idx
  on public.technical_case_events(case_id, event_date desc);

drop trigger if exists set_updated_at on public.technical_cases;
create trigger set_updated_at before update on public.technical_cases
for each row execute function private.set_updated_at();

drop trigger if exists set_updated_at on public.technical_case_events;
create trigger set_updated_at before update on public.technical_case_events
for each row execute function private.set_updated_at();

alter table public.technical_cases enable row level security;
alter table public.technical_case_events enable row level security;

revoke all on table public.technical_cases from anon;
revoke all on table public.technical_case_events from anon;
grant select, insert, update, delete on table public.technical_cases to authenticated;
grant select, insert, update, delete on table public.technical_case_events to authenticated;

drop policy if exists "Clinics manage technical cases" on public.technical_cases;
create policy "Clinics manage technical cases"
on public.technical_cases for all to authenticated
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

drop policy if exists "Clinics manage technical case events" on public.technical_case_events;
create policy "Clinics manage technical case events"
on public.technical_case_events for all to authenticated
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

commit;
