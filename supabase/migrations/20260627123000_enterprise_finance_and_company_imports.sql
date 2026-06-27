-- Enterprise phase: NexxoHub Finance role, billing foundation and company-owned imports.

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
    when 'financeiro' then 'nexxohub_finance'
    when 'finance' then 'nexxohub_finance'
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

update public.portal_memberships
set role = private.normalize_portal_role(role);

alter table public.portal_memberships
  drop constraint if exists portal_memberships_role_check,
  add constraint portal_memberships_role_check check (
    role in (
      'nexxohub_admin',
      'nexxohub_finance',
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

create or replace function private.is_nexxohub_finance()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_portal_role(
    'nexxohub'::public.portal_type,
    array['nexxohub_admin', 'nexxohub_finance']
  )
$$;

revoke all on function private.is_nexxohub_finance() from public, anon;
grant execute on function private.is_nexxohub_finance() to authenticated;

alter table public.billing_plans
  add column if not exists setup_fee numeric(12,2) not null default 0 check (setup_fee >= 0),
  add column if not exists max_companies integer,
  add column if not exists max_employees integer,
  add column if not exists created_by uuid references public.users(id) on delete set null,
  add column if not exists updated_by uuid references public.users(id) on delete set null;

alter table public.subscriptions
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists created_by uuid references public.users(id) on delete set null,
  add column if not exists updated_by uuid references public.users(id) on delete set null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  payment_method text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'failed', 'refunded', 'cancelled')),
  external_provider text,
  external_id text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  starts_on date,
  ends_on date,
  max_redemptions integer check (max_redemptions is null or max_redemptions >= 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'expired')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists payments_org_status_idx
  on public.payments(organization_id, status, paid_at desc);
create index if not exists payments_invoice_idx on public.payments(invoice_id);
create index if not exists payments_subscription_idx on public.payments(subscription_id);
create index if not exists coupons_status_idx on public.coupons(status);

alter table public.payments enable row level security;
alter table public.coupons enable row level security;

revoke all on table public.payments from anon;
revoke all on table public.coupons from anon;
grant select, insert, update, delete on table public.payments to authenticated;
grant select, insert, update, delete on table public.coupons to authenticated;

drop policy if exists "NexxoHub finance manages billing plans" on public.billing_plans;
create policy "NexxoHub finance manages billing plans"
on public.billing_plans for all to authenticated
using (private.is_nexxohub_finance())
with check (private.is_nexxohub_finance());

drop policy if exists "NexxoHub finance manages subscriptions" on public.subscriptions;
create policy "NexxoHub finance manages subscriptions"
on public.subscriptions for all to authenticated
using (private.is_nexxohub_finance())
with check (private.is_nexxohub_finance());

drop policy if exists "NexxoHub finance reads contracts" on public.contracts;
create policy "NexxoHub finance reads contracts"
on public.contracts for select to authenticated
using (private.is_nexxohub_finance());

drop policy if exists "NexxoHub finance reads invoices" on public.invoices;
create policy "NexxoHub finance reads invoices"
on public.invoices for select to authenticated
using (private.is_nexxohub_finance());

drop policy if exists "NexxoHub finance manages payments" on public.payments;
create policy "NexxoHub finance manages payments"
on public.payments for all to authenticated
using (private.is_nexxohub_finance())
with check (private.is_nexxohub_finance());

drop policy if exists "NexxoHub finance manages coupons" on public.coupons;
create policy "NexxoHub finance manages coupons"
on public.coupons for all to authenticated
using (private.is_nexxohub_finance())
with check (private.is_nexxohub_finance());

drop policy if exists "Clinics read own subscriptions" on public.subscriptions;
create policy "Clinics read own subscriptions"
on public.subscriptions for select to authenticated
using (
  clinic_id is not null
  and private.has_portal_role('clinic'::public.portal_type, array['clinic_admin'], clinic_id)
);

drop policy if exists "Company HR read own quick onboarding imports" on public.quick_onboarding_imports;
drop policy if exists "Clinic staff create quick onboarding imports" on public.quick_onboarding_imports;
create policy "Clinic staff create quick onboarding imports"
on public.quick_onboarding_imports for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and created_by = (select auth.uid())
  and import_type = 'companies'
  and company_id is null
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
);

drop policy if exists "Clinic staff update quick onboarding imports" on public.quick_onboarding_imports;
create policy "Clinic staff update quick onboarding imports"
on public.quick_onboarding_imports for update to authenticated
using (
  import_type = 'companies'
  and company_id is null
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and import_type = 'companies'
  and company_id is null
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
);

create policy "Company HR read own quick onboarding imports"
on public.quick_onboarding_imports for select to authenticated
using (
  company_id is not null
  and private.has_portal_role(
    'company'::public.portal_type,
    array['company_admin', 'company_hr'],
    clinic_id,
    company_id
  )
);

drop policy if exists "Company HR create own quick onboarding imports" on public.quick_onboarding_imports;
create policy "Company HR create own quick onboarding imports"
on public.quick_onboarding_imports for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and created_by = (select auth.uid())
  and company_id is not null
  and import_type in ('branches', 'departments', 'positions', 'employees')
  and private.has_portal_role(
    'company'::public.portal_type,
    array['company_admin', 'company_hr'],
    clinic_id,
    company_id
  )
);

drop policy if exists "Company HR update own quick onboarding imports" on public.quick_onboarding_imports;
create policy "Company HR update own quick onboarding imports"
on public.quick_onboarding_imports for update to authenticated
using (
  company_id is not null
  and private.has_portal_role(
    'company'::public.portal_type,
    array['company_admin', 'company_hr'],
    clinic_id,
    company_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and company_id is not null
  and import_type in ('branches', 'departments', 'positions', 'employees')
  and private.has_portal_role(
    'company'::public.portal_type,
    array['company_admin', 'company_hr'],
    clinic_id,
    company_id
  )
);

drop policy if exists "Company HR manage own quick onboarding import errors" on public.quick_onboarding_import_errors;
create policy "Company HR manage own quick onboarding import errors"
on public.quick_onboarding_import_errors for all to authenticated
using (
  exists (
    select 1 from public.quick_onboarding_imports import
    where import.id = quick_onboarding_import_errors.import_id
      and import.company_id is not null
      and private.has_portal_role(
        'company'::public.portal_type,
        array['company_admin', 'company_hr'],
        import.clinic_id,
        import.company_id
      )
  )
)
with check (
  exists (
    select 1 from public.quick_onboarding_imports import
    where import.id = quick_onboarding_import_errors.import_id
      and import.company_id is not null
      and private.has_portal_role(
        'company'::public.portal_type,
        array['company_admin', 'company_hr'],
        import.clinic_id,
        import.company_id
      )
  )
);

do $$
declare
  target_table text;
begin
  foreach target_table in array array['payments', 'coupons']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I',
      target_table
    );
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function private.set_updated_at()',
      target_table
    );
  end loop;
end
$$;
