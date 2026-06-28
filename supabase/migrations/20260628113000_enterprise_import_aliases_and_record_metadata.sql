-- Enterprise compatibility and metadata hardening.
-- Keeps the existing quick_onboarding implementation as the source of truth while exposing
-- the mandatory import_batches/import_errors names requested for the product architecture.

alter table public.branches
  add column if not exists updated_by uuid references public.users(id) on delete set null,
  add column if not exists deleted_at timestamptz;

alter table public.departments
  add column if not exists updated_by uuid references public.users(id) on delete set null,
  add column if not exists deleted_at timestamptz;

alter table public.positions
  add column if not exists updated_by uuid references public.users(id) on delete set null,
  add column if not exists deleted_at timestamptz;

alter table public.employees
  add column if not exists created_by uuid references public.users(id) on delete set null,
  add column if not exists updated_by uuid references public.users(id) on delete set null,
  add column if not exists deleted_at timestamptz;

create index if not exists branches_deleted_at_idx
  on public.branches(deleted_at);
create index if not exists departments_deleted_at_idx
  on public.departments(deleted_at);
create index if not exists positions_deleted_at_idx
  on public.positions(deleted_at);
create index if not exists employees_deleted_at_idx
  on public.employees(deleted_at);

create or replace view public.import_batches
with (security_invoker = true)
as
select
  id,
  organization_id,
  clinic_id,
  company_id,
  import_type,
  status,
  original_filename,
  storage_bucket,
  storage_path,
  mime_type,
  size_bytes,
  total_rows,
  valid_rows,
  invalid_rows,
  created_count,
  updated_count,
  error_count,
  create_missing_structure,
  options,
  preview_rows,
  summary,
  created_by,
  confirmed_at,
  completed_at,
  created_at,
  updated_at
from public.quick_onboarding_imports;

create or replace view public.import_errors
with (security_invoker = true)
as
select
  id,
  import_id as batch_id,
  import_id,
  row_number,
  field,
  code,
  message,
  severity,
  row_data,
  created_at
from public.quick_onboarding_import_errors;

grant select on public.import_batches to authenticated;
grant select on public.import_errors to authenticated;
