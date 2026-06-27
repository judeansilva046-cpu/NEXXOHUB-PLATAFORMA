-- Quick Onboarding: real clinic-led mass implantation and HR/ERP integration foundation.

alter table public.companies
  add column if not exists responsible_name text,
  add column if not exists segment text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists address_number text;

alter table public.branches
  add column if not exists responsible_name text,
  add column if not exists phone text,
  add column if not exists email text;

alter table public.departments
  add column if not exists responsible_name text;

alter table public.positions
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists description text;

alter table public.employees
  add column if not exists city text,
  add column if not exists state text;

create index if not exists companies_clinic_cnpj_idx
  on public.companies(clinic_id, cnpj);
create index if not exists companies_clinic_status_idx
  on public.companies(clinic_id, status);
create index if not exists branches_company_name_idx
  on public.branches(company_id, name);
create index if not exists departments_company_name_idx
  on public.departments(company_id, name);
create index if not exists positions_company_department_idx
  on public.positions(company_id, department_id);
create index if not exists employees_company_email_idx
  on public.employees(company_id, email);

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'quick-onboarding-imports',
      'quick-onboarding-imports',
      false,
      20971520,
      array[
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    )
    on conflict (id) do update
    set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$$;

create table if not exists public.quick_onboarding_imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  import_type text not null check (
    import_type in ('companies', 'branches', 'departments', 'positions', 'employees')
  ),
  status text not null default 'previewed' check (
    status in (
      'uploaded',
      'previewed',
      'ready',
      'processing',
      'completed',
      'completed_with_errors',
      'failed',
      'cancelled'
    )
  ),
  original_filename text not null,
  storage_bucket text not null default 'quick-onboarding-imports',
  storage_path text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  created_count integer not null default 0 check (created_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  create_missing_structure boolean not null default false,
  options jsonb not null default '{}'::jsonb,
  preview_rows jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, organization_id)
    references public.clinics(id, organization_id),
  foreign key (company_id, clinic_id)
    references public.companies(id, clinic_id)
);

create table if not exists public.quick_onboarding_import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.quick_onboarding_imports(id) on delete cascade,
  row_number integer not null check (row_number >= 1),
  field text,
  code text not null,
  message text not null,
  severity text not null default 'error' check (severity in ('warning', 'error')),
  row_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quick_onboarding_imports_clinic_created_idx
  on public.quick_onboarding_imports(clinic_id, created_at desc);
create index if not exists quick_onboarding_imports_company_type_idx
  on public.quick_onboarding_imports(company_id, import_type, created_at desc);
create index if not exists quick_onboarding_imports_status_idx
  on public.quick_onboarding_imports(status);
create index if not exists quick_onboarding_import_errors_import_idx
  on public.quick_onboarding_import_errors(import_id, row_number);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  provider text not null,
  connection_type text not null default 'rest_api'
    check (connection_type in ('rest_api', 'webhook', 'sftp', 'manual')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'error', 'archived')),
  config jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, organization_id)
    references public.clinics(id, organization_id),
  foreign key (company_id, clinic_id)
    references public.companies(id, clinic_id)
);

create table if not exists public.integration_field_mappings (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  source_field text not null,
  target_field text not null,
  transform_rule jsonb not null default '{}'::jsonb,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, source_field, target_field)
);

create table if not exists public.integration_webhooks (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  event_type text not null,
  target_url text not null,
  secret_hint text,
  headers jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.integration_connections(id) on delete cascade,
  label text not null,
  token_hash text not null unique,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (clinic_id, organization_id)
    references public.clinics(id, organization_id),
  foreign key (company_id, clinic_id)
    references public.companies(id, clinic_id)
);

create table if not exists public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  connection_id uuid references public.integration_connections(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  operation text not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'success', 'failed', 'retrying', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_retry_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  processed_rows integer not null default 0 check (processed_rows >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key (clinic_id, organization_id)
    references public.clinics(id, organization_id),
  foreign key (company_id, clinic_id)
    references public.companies(id, clinic_id)
);

create index if not exists integration_connections_clinic_idx
  on public.integration_connections(clinic_id, status);
create index if not exists integration_connections_company_idx
  on public.integration_connections(company_id);
create index if not exists integration_field_mappings_connection_idx
  on public.integration_field_mappings(connection_id);
create index if not exists integration_webhooks_connection_idx
  on public.integration_webhooks(connection_id);
create index if not exists integration_tokens_company_idx
  on public.integration_tokens(company_id, status);
create index if not exists integration_sync_logs_connection_created_idx
  on public.integration_sync_logs(connection_id, created_at desc);
create index if not exists integration_sync_logs_status_retry_idx
  on public.integration_sync_logs(status, next_retry_at);

alter table public.quick_onboarding_imports enable row level security;
alter table public.quick_onboarding_import_errors enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_field_mappings enable row level security;
alter table public.integration_webhooks enable row level security;
alter table public.integration_tokens enable row level security;
alter table public.integration_sync_logs enable row level security;

revoke all on table public.quick_onboarding_imports from anon;
revoke all on table public.quick_onboarding_import_errors from anon;
revoke all on table public.integration_connections from anon;
revoke all on table public.integration_field_mappings from anon;
revoke all on table public.integration_webhooks from anon;
revoke all on table public.integration_tokens from anon;
revoke all on table public.integration_sync_logs from anon;

grant select, insert, update, delete on table public.quick_onboarding_imports to authenticated;
grant select, insert, update, delete on table public.quick_onboarding_import_errors to authenticated;
grant select, insert, update, delete on table public.integration_connections to authenticated;
grant select, insert, update, delete on table public.integration_field_mappings to authenticated;
grant select, insert, update, delete on table public.integration_webhooks to authenticated;
grant select, insert, update, delete on table public.integration_tokens to authenticated;
grant select, insert, update, delete on table public.integration_sync_logs to authenticated;
grant insert on table public.audit_logs to authenticated;

drop policy if exists "Authenticated users create scoped audit logs" on public.audit_logs;
create policy "Authenticated users create scoped audit logs"
on public.audit_logs for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and user_id = (select auth.uid())
);

create policy "Clinic users read quick onboarding imports"
on public.quick_onboarding_imports for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or (
    company_id is not null
    and private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
  )
);

create policy "Clinic staff create quick onboarding imports"
on public.quick_onboarding_imports for insert to authenticated
with check (
  organization_id = private.current_organization_id()
  and created_by = (select auth.uid())
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
);

create policy "Clinic staff update quick onboarding imports"
on public.quick_onboarding_imports for update to authenticated
using (
  private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
);

create policy "NexxoHub admins delete quick onboarding imports"
on public.quick_onboarding_imports for delete to authenticated
using (private.is_nexxohub_admin());

create policy "Clinic users read quick onboarding import errors"
on public.quick_onboarding_import_errors for select to authenticated
using (
  exists (
    select 1 from public.quick_onboarding_imports import
    where import.id = quick_onboarding_import_errors.import_id
      and (
        private.is_nexxohub_operator()
        or private.has_portal_membership('clinic'::public.portal_type, import.clinic_id)
        or (
          import.company_id is not null
          and private.has_portal_membership(
            'company'::public.portal_type,
            import.clinic_id,
            import.company_id
          )
        )
      )
  )
);

create policy "Clinic staff manage quick onboarding import errors"
on public.quick_onboarding_import_errors for all to authenticated
using (
  exists (
    select 1 from public.quick_onboarding_imports import
    where import.id = quick_onboarding_import_errors.import_id
      and private.has_portal_role(
        'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], import.clinic_id
      )
  )
)
with check (
  exists (
    select 1 from public.quick_onboarding_imports import
    where import.id = quick_onboarding_import_errors.import_id
      and private.has_portal_role(
        'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], import.clinic_id
      )
  )
);

create policy "Clinic users read integration connections"
on public.integration_connections for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or (
    company_id is not null
    and private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
  )
);

create policy "Clinic staff manage integration connections"
on public.integration_connections for all to authenticated
using (
  private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
);

create policy "Clinic users read integration sync logs"
on public.integration_sync_logs for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or (
    company_id is not null
    and private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
  )
);

create policy "Clinic staff manage integration sync logs"
on public.integration_sync_logs for all to authenticated
using (
  private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
);

create policy "Clinic users read integration tokens"
on public.integration_tokens for select to authenticated
using (
  private.is_nexxohub_operator()
  or private.has_portal_membership('clinic'::public.portal_type, clinic_id)
  or private.has_portal_membership('company'::public.portal_type, clinic_id, company_id)
);

create policy "Clinic staff manage integration tokens"
on public.integration_tokens for all to authenticated
using (
  private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
)
with check (
  organization_id = private.current_organization_id()
  and private.has_portal_role(
    'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], clinic_id
  )
);

create policy "Clinic users read integration field mappings"
on public.integration_field_mappings for select to authenticated
using (
  exists (
    select 1 from public.integration_connections connection
    where connection.id = integration_field_mappings.connection_id
      and (
        private.is_nexxohub_operator()
        or private.has_portal_membership('clinic'::public.portal_type, connection.clinic_id)
        or (
          connection.company_id is not null
          and private.has_portal_membership(
            'company'::public.portal_type,
            connection.clinic_id,
            connection.company_id
          )
        )
      )
  )
);

create policy "Clinic staff manage integration field mappings"
on public.integration_field_mappings for all to authenticated
using (
  exists (
    select 1 from public.integration_connections connection
    where connection.id = integration_field_mappings.connection_id
      and private.has_portal_role(
        'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], connection.clinic_id
      )
  )
)
with check (
  exists (
    select 1 from public.integration_connections connection
    where connection.id = integration_field_mappings.connection_id
      and private.has_portal_role(
        'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], connection.clinic_id
      )
  )
);

create policy "Clinic users read integration webhooks"
on public.integration_webhooks for select to authenticated
using (
  exists (
    select 1 from public.integration_connections connection
    where connection.id = integration_webhooks.connection_id
      and (
        private.is_nexxohub_operator()
        or private.has_portal_membership('clinic'::public.portal_type, connection.clinic_id)
        or (
          connection.company_id is not null
          and private.has_portal_membership(
            'company'::public.portal_type,
            connection.clinic_id,
            connection.company_id
          )
        )
      )
  )
);

create policy "Clinic staff manage integration webhooks"
on public.integration_webhooks for all to authenticated
using (
  exists (
    select 1 from public.integration_connections connection
    where connection.id = integration_webhooks.connection_id
      and private.has_portal_role(
        'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], connection.clinic_id
      )
  )
)
with check (
  exists (
    select 1 from public.integration_connections connection
    where connection.id = integration_webhooks.connection_id
      and private.has_portal_role(
        'clinic'::public.portal_type, array['clinic_admin', 'clinic_staff'], connection.clinic_id
      )
  )
);

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    drop policy if exists "Clinic users read quick onboarding files" on storage.objects;
    drop policy if exists "Clinic staff upload quick onboarding files" on storage.objects;
    drop policy if exists "Clinic staff update quick onboarding files" on storage.objects;
    drop policy if exists "NexxoHub admins delete quick onboarding files" on storage.objects;

    create policy "Clinic users read quick onboarding files"
    on storage.objects for select to authenticated
    using (
      bucket_id = 'quick-onboarding-imports'
      and (storage.foldername(name))[1] = private.current_organization_id()::text
    );

    create policy "Clinic staff upload quick onboarding files"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'quick-onboarding-imports'
      and (storage.foldername(name))[1] = private.current_organization_id()::text
    );

    create policy "Clinic staff update quick onboarding files"
    on storage.objects for update to authenticated
    using (
      bucket_id = 'quick-onboarding-imports'
      and (storage.foldername(name))[1] = private.current_organization_id()::text
    )
    with check (
      bucket_id = 'quick-onboarding-imports'
      and (storage.foldername(name))[1] = private.current_organization_id()::text
    );

    create policy "NexxoHub admins delete quick onboarding files"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'quick-onboarding-imports'
      and private.is_nexxohub_admin()
    );
  end if;
end
$$;
