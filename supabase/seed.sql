-- NexxoHub local/staging test access seed.
-- These users are for controlled testing only. Do not use these credentials in production.

begin;

insert into public.organizations (
  id,
  name,
  legal_name,
  cnpj,
  responsible_name,
  email,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000100',
  'NexxoHub Test Tenant',
  'NexxoHub Test Tenant LTDA',
  '90909090000190',
  'Admin Teste',
  'nexxohub.admin@nexxohub.test',
  'active',
  now(),
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  legal_name = excluded.legal_name,
  responsible_name = excluded.responsible_name,
  email = excluded.email,
  status = excluded.status,
  updated_at = now();

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'nexxohub.admin@nexxohub.test',
    crypt('NexxoHub@Teste2026!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin NexxoHub Teste","organization_name":"Seed Temporário NexxoHub","organization_cnpj":"90909090001161"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'clinica.admin@nexxohub.test',
    crypt('NexxoHub@Teste2026!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin Clínica Teste","organization_name":"Seed Temporário Clínica","organization_cnpj":"90909090001242"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'empresa.admin@nexxohub.test',
    crypt('NexxoHub@Teste2026!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin Empresa Teste","organization_name":"Seed Temporário Empresa","organization_cnpj":"90909090001323"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'colaborador@nexxohub.test',
    crypt('NexxoHub@Teste2026!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Colaborador Teste","organization_name":"Seed Temporário Colaborador","organization_cnpj":"90909090001404"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change_token_current = excluded.email_change_token_current,
  email_change = excluded.email_change,
  phone_change_token = excluded.phone_change_token,
  reauthentication_token = excluded.reauthentication_token,
  is_sso_user = excluded.is_sso_user,
  is_anonymous = excluded.is_anonymous,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  seeded_user.id,
  seeded_user.id,
  seeded_user.id::text,
  jsonb_build_object('sub', seeded_user.id::text, 'email', seeded_user.email),
  'email',
  now(),
  now(),
  now()
from auth.users seeded_user
where seeded_user.id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004'
)
on conflict (provider, provider_id) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.users (id, email, full_name, role, organization_id, created_at, updated_at)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'nexxohub.admin@nexxohub.test',
    'Admin NexxoHub Teste',
    'admin',
    '00000000-0000-4000-8000-000000000100',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'clinica.admin@nexxohub.test',
    'Admin Clínica Teste',
    'manager',
    '00000000-0000-4000-8000-000000000100',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'empresa.admin@nexxohub.test',
    'Admin Empresa Teste',
    'manager',
    '00000000-0000-4000-8000-000000000100',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'colaborador@nexxohub.test',
    'Colaborador Teste',
    'user',
    '00000000-0000-4000-8000-000000000100',
    now(),
    now()
  )
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  organization_id = excluded.organization_id,
  updated_at = now();

insert into public.profiles (id, organization_id, email, full_name, created_at, updated_at)
select id, organization_id, email, full_name, created_at, updated_at
from public.users
where id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004'
)
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = now();

insert into public.roles (organization_id, name, role_key, portal, description)
values
  (
    '00000000-0000-4000-8000-000000000100',
    'NexxoHub Admin',
    'nexxohub_admin',
    'nexxohub',
    'Administrador master SaaS'
  ),
  (
    '00000000-0000-4000-8000-000000000100',
    'Clinic Admin',
    'clinic_admin',
    'clinic',
    'Administrador técnico da clínica'
  ),
  (
    '00000000-0000-4000-8000-000000000100',
    'Company Admin',
    'company_admin',
    'company',
    'Administrador da empresa'
  ),
  (
    '00000000-0000-4000-8000-000000000100',
    'Employee',
    'employee',
    'employee',
    'Colaborador'
  )
on conflict (organization_id, role_key) do update
set
  name = excluded.name,
  portal = excluded.portal,
  description = excluded.description,
  updated_at = now();

insert into public.clinics (
  id,
  organization_id,
  name,
  description,
  cnpj,
  responsible_name,
  email,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000200',
  '00000000-0000-4000-8000-000000000100',
  'Clínica NexxoHub Teste',
  'Clínica vinculada ao seed de testes dos 4 portais.',
  '90909090000270',
  'Admin Clínica Teste',
  'clinica.admin@nexxohub.test',
  'active',
  now(),
  now()
)
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  name = excluded.name,
  description = excluded.description,
  responsible_name = excluded.responsible_name,
  email = excluded.email,
  status = excluded.status,
  updated_at = now();

insert into public.companies (
  id,
  organization_id,
  clinic_id,
  name,
  legal_name,
  description,
  cnpj,
  hr_responsible,
  email,
  employee_count,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000300',
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000200',
  'Empresa NexxoHub Teste',
  'Empresa NexxoHub Teste LTDA',
  'Empresa vinculada ao seed de testes dos 4 portais.',
  '90909090000350',
  'Admin Empresa Teste',
  'empresa.admin@nexxohub.test',
  1,
  'active',
  now(),
  now()
)
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  clinic_id = excluded.clinic_id,
  name = excluded.name,
  legal_name = excluded.legal_name,
  description = excluded.description,
  hr_responsible = excluded.hr_responsible,
  email = excluded.email,
  employee_count = excluded.employee_count,
  status = excluded.status,
  updated_at = now();

insert into public.branches (
  id,
  organization_id,
  clinic_id,
  company_id,
  name,
  city,
  state,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000310',
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000200',
  '00000000-0000-4000-8000-000000000300',
  'Matriz Teste',
  'São Paulo',
  'SP',
  'active',
  now(),
  now()
)
on conflict (company_id, name) do update
set
  city = excluded.city,
  state = excluded.state,
  status = excluded.status,
  updated_at = now();

insert into public.departments (
  id,
  organization_id,
  company_id,
  branch_id,
  name,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000320',
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000300',
  '00000000-0000-4000-8000-000000000310',
  'Recursos Humanos',
  'active',
  now(),
  now()
)
on conflict (company_id, (coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)), name)
do update
set status = excluded.status,
    updated_at = now();

insert into public.positions (
  id,
  organization_id,
  company_id,
  name,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000300',
  'Analista de Testes',
  'active',
  now(),
  now()
)
on conflict (company_id, name) do update
set status = excluded.status,
    updated_at = now();

insert into public.employees (
  id,
  organization_id,
  company_id,
  auth_user_id,
  email,
  full_name,
  position,
  department,
  branch_id,
  department_id,
  position_id,
  cpf,
  registration,
  admission_date,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000400',
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000300',
  '00000000-0000-4000-8000-000000000004',
  'colaborador@nexxohub.test',
  'Colaborador Teste',
  'Analista de Testes',
  'Recursos Humanos',
  '00000000-0000-4000-8000-000000000310',
  '00000000-0000-4000-8000-000000000320',
  '00000000-0000-4000-8000-000000000330',
  '90909090004',
  'TESTE-001',
  current_date,
  'active',
  now(),
  now()
)
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  company_id = excluded.company_id,
  auth_user_id = excluded.auth_user_id,
  email = excluded.email,
  full_name = excluded.full_name,
  position = excluded.position,
  department = excluded.department,
  branch_id = excluded.branch_id,
  department_id = excluded.department_id,
  position_id = excluded.position_id,
  cpf = excluded.cpf,
  registration = excluded.registration,
  admission_date = excluded.admission_date,
  status = excluded.status,
  updated_at = now();

delete from public.portal_memberships
where user_id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004'
);

insert into public.portal_memberships (
  user_id,
  portal,
  role,
  organization_id,
  clinic_id,
  company_id,
  employee_id,
  is_active,
  created_by,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'nexxohub',
    'nexxohub_admin',
    '00000000-0000-4000-8000-000000000100',
    null,
    null,
    null,
    true,
    '00000000-0000-4000-8000-000000000001',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'clinic',
    'clinic_admin',
    '00000000-0000-4000-8000-000000000100',
    '00000000-0000-4000-8000-000000000200',
    null,
    null,
    true,
    '00000000-0000-4000-8000-000000000001',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'company',
    'company_admin',
    '00000000-0000-4000-8000-000000000100',
    '00000000-0000-4000-8000-000000000200',
    '00000000-0000-4000-8000-000000000300',
    null,
    true,
    '00000000-0000-4000-8000-000000000001',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'employee',
    'employee',
    '00000000-0000-4000-8000-000000000100',
    '00000000-0000-4000-8000-000000000200',
    '00000000-0000-4000-8000-000000000300',
    '00000000-0000-4000-8000-000000000400',
    true,
    '00000000-0000-4000-8000-000000000001',
    now(),
    now()
  );

delete from public.organizations
where cnpj in (
  '90909090001161',
  '90909090001242',
  '90909090001323',
  '90909090001404'
);

commit;

-- Enterprise homologation seed requested by the master prompt.
-- Temporary password for all users below: NexxoHub@2026!

do $enterprise_seed$
begin
insert into public.organizations (
  id,
  name,
  legal_name,
  cnpj,
  responsible_name,
  email,
  status,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000900',
  'NexxoHub Brasil Homologação',
  'NexxoHub Brasil Tecnologia LTDA',
  '12121212000112',
  'Admin NexxoHub',
  'admin@nexxohub.com.br',
  'active',
  now(),
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  legal_name = excluded.legal_name,
  responsible_name = excluded.responsible_name,
  email = excluded.email,
  status = excluded.status,
  updated_at = now();

drop table if exists public._seed_enterprise_users;

create table public._seed_enterprise_users (
  id uuid primary key,
  email text not null,
  full_name text not null,
  legacy_role public.user_role not null,
  portal public.portal_type not null,
  portal_role text not null,
  clinic_id uuid,
  company_id uuid,
  employee_number integer
);

insert into public._seed_enterprise_users (
  id,
  email,
  full_name,
  legacy_role,
  portal,
  portal_role,
  clinic_id,
  company_id,
  employee_number
)
values
  (
    '00000000-0000-4000-8000-000000001001',
    'admin@nexxohub.com.br',
    'Admin NexxoHub',
    'admin',
    'nexxohub',
    'nexxohub_admin',
    null,
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000001002',
    'financeiro@nexxohub.com.br',
    'Financeiro NexxoHub',
    'manager',
    'nexxohub',
    'nexxohub_finance',
    null,
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000001101',
    'admin@clinicacentral.com.br',
    'Admin Clínica Central',
    'manager',
    'clinic',
    'clinic_admin',
    '00000000-0000-4000-8000-000000000901',
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000001102',
    'operador@clinicacentral.com.br',
    'Operador Clínica Central',
    'manager',
    'clinic',
    'clinic_staff',
    '00000000-0000-4000-8000-000000000901',
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000001201',
    'admin@empresa01.com.br',
    'Admin Empresa 01',
    'manager',
    'company',
    'company_admin',
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000911',
    null
  ),
  (
    '00000000-0000-4000-8000-000000001202',
    'rh@empresa01.com.br',
    'RH Empresa 01',
    'manager',
    'company',
    'company_hr',
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000911',
    null
  ),
  (
    '00000000-0000-4000-8000-000000001203',
    'diretoria@empresa01.com.br',
    'Diretoria Empresa 01',
    'manager',
    'company',
    'company_director',
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000911',
    null
  ),
  (
    '00000000-0000-4000-8000-000000001204',
    'compliance@empresa01.com.br',
    'Compliance Empresa 01',
    'manager',
    'company',
    'company_compliance',
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000911',
    null
  ),
  (
    '00000000-0000-4000-8000-000000001205',
    'governanca@empresa01.com.br',
    'Governança Empresa 01',
    'manager',
    'company',
    'company_governance',
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000911',
    null
  ),
  (
    '00000000-0000-4000-8000-000000001206',
    'gestor@empresa01.com.br',
    'Gestor Empresa 01',
    'manager',
    'company',
    'company_manager',
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000911',
    null
  );

insert into public._seed_enterprise_users (
  id,
  email,
  full_name,
  legacy_role,
  portal,
  portal_role,
  clinic_id,
  company_id,
  employee_number
)
select
  ('00000000-0000-4000-8000-' || lpad((1300 + n)::text, 12, '0'))::uuid,
  'colaborador' || lpad(n::text, 2, '0') || '@empresa01.com.br',
  'Colaborador ' || lpad(n::text, 2, '0'),
  'user'::public.user_role,
  'employee'::public.portal_type,
  'employee',
  '00000000-0000-4000-8000-000000000901'::uuid,
  '00000000-0000-4000-8000-000000000911'::uuid,
  n
from generate_series(1, 10) as series(n);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  id,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  email,
  crypt('NexxoHub@2026!', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'full_name',
    full_name,
    'organization_name',
    'Seed Temporário Enterprise',
    'organization_cnpj',
    '88' || lpad((row_number() over (order by id))::text, 12, '0'),
    'seed',
    'enterprise-homologation'
  ),
  now(),
  now()
from public._seed_enterprise_users
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  id::text,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
from public._seed_enterprise_users
on conflict (provider, provider_id) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.users (id, email, full_name, role, organization_id, created_at, updated_at)
select
  id,
  email,
  full_name,
  legacy_role,
  '00000000-0000-4000-8000-000000000900',
  now(),
  now()
from public._seed_enterprise_users
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  organization_id = excluded.organization_id,
  updated_at = now();

insert into public.profiles (id, organization_id, email, full_name, created_at, updated_at)
select
  id,
  '00000000-0000-4000-8000-000000000900',
  email,
  full_name,
  now(),
  now()
from public._seed_enterprise_users
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = now();

insert into public.roles (organization_id, name, role_key, portal, description)
values
  ('00000000-0000-4000-8000-000000000900', 'NexxoHub Admin', 'nexxohub_admin', 'nexxohub', 'Administrador master SaaS'),
  ('00000000-0000-4000-8000-000000000900', 'NexxoHub Financeiro', 'nexxohub_finance', 'nexxohub', 'Gestão financeira SaaS'),
  ('00000000-0000-4000-8000-000000000900', 'Clínica Admin', 'clinic_admin', 'clinic', 'Administrador técnico da clínica'),
  ('00000000-0000-4000-8000-000000000900', 'Clínica Operação', 'clinic_staff', 'clinic', 'Operação técnica da clínica'),
  ('00000000-0000-4000-8000-000000000900', 'Empresa Admin', 'company_admin', 'company', 'Administrador da empresa'),
  ('00000000-0000-4000-8000-000000000900', 'Empresa RH', 'company_hr', 'company', 'Recursos humanos'),
  ('00000000-0000-4000-8000-000000000900', 'Empresa Diretoria', 'company_director', 'company', 'Diretoria'),
  ('00000000-0000-4000-8000-000000000900', 'Empresa Compliance', 'company_compliance', 'company', 'Compliance'),
  ('00000000-0000-4000-8000-000000000900', 'Empresa Governança', 'company_governance', 'company', 'Governança'),
  ('00000000-0000-4000-8000-000000000900', 'Empresa Gestor', 'company_manager', 'company', 'Gestor'),
  ('00000000-0000-4000-8000-000000000900', 'Colaborador', 'employee', 'employee', 'Colaborador')
on conflict (organization_id, role_key) do update
set
  name = excluded.name,
  portal = excluded.portal,
  description = excluded.description,
  updated_at = now();

insert into public.clinics (
  id,
  organization_id,
  name,
  description,
  cnpj,
  responsible_name,
  email,
  phone,
  address,
  specialties,
  status,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000900',
    'Clínica Central',
    'Clínica principal de homologação NexxoHub.',
    '12121212000191',
    'Admin Clínica Central',
    'admin@clinicacentral.com.br',
    '(11) 4002-9001',
    'Av. Paulista, 1000 - São Paulo/SP',
    array['Psicologia Organizacional', 'NR-1', 'Saúde Ocupacional'],
    'active',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000902',
    '00000000-0000-4000-8000-000000000900',
    'Clínica Horizonte',
    'Clínica secundária para testes multi-clínica.',
    '12121212000272',
    'Coordenação Clínica Horizonte',
    'admin@clinicahorizonte.com.br',
    '(21) 4002-9002',
    'Rua da Saúde, 200 - Rio de Janeiro/RJ',
    array['Psicossocial', 'Treinamentos', 'Relatórios'],
    'active',
    now(),
    now()
  )
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  name = excluded.name,
  description = excluded.description,
  responsible_name = excluded.responsible_name,
  email = excluded.email,
  phone = excluded.phone,
  address = excluded.address,
  specialties = excluded.specialties,
  status = excluded.status,
  updated_at = now();

drop table if exists public._seed_enterprise_companies;

create table public._seed_enterprise_companies (
  company_index integer primary key,
  id uuid not null,
  clinic_id uuid not null,
  name text not null,
  legal_name text not null,
  cnpj text not null,
  city text not null,
  state text not null
);

insert into public._seed_enterprise_companies (
  company_index,
  id,
  clinic_id,
  name,
  legal_name,
  cnpj,
  city,
  state
)
values
  (1, '00000000-0000-4000-8000-000000000911', '00000000-0000-4000-8000-000000000901', 'Empresa 01', 'Empresa 01 Indústria e Serviços LTDA', '12121212001180', 'São Paulo', 'SP'),
  (2, '00000000-0000-4000-8000-000000000912', '00000000-0000-4000-8000-000000000901', 'Empresa 02', 'Empresa 02 Tecnologia S.A.', '12121212001261', 'Campinas', 'SP'),
  (3, '00000000-0000-4000-8000-000000000913', '00000000-0000-4000-8000-000000000901', 'Empresa 03', 'Empresa 03 Logística LTDA', '12121212001342', 'Santos', 'SP'),
  (4, '00000000-0000-4000-8000-000000000914', '00000000-0000-4000-8000-000000000902', 'Empresa 04', 'Empresa 04 Varejo LTDA', '12121212001423', 'Rio de Janeiro', 'RJ'),
  (5, '00000000-0000-4000-8000-000000000915', '00000000-0000-4000-8000-000000000902', 'Empresa 05', 'Empresa 05 Serviços Compartilhados LTDA', '12121212001504', 'Niterói', 'RJ');

insert into public.companies (
  id,
  organization_id,
  clinic_id,
  name,
  legal_name,
  description,
  cnpj,
  hr_responsible,
  email,
  phone,
  address,
  employee_count,
  status,
  created_at,
  updated_at
)
select
  id,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  name,
  legal_name,
  'Empresa de homologação com dados reais persistidos no seed.',
  cnpj,
  'RH ' || name,
  lower(replace(name, ' ', '')) || '@nexxohub.test',
  '(11) 3000-' || lpad(company_index::text, 4, '0'),
  city || '/' || state,
  20,
  'active',
  now(),
  now()
from public._seed_enterprise_companies
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  clinic_id = excluded.clinic_id,
  name = excluded.name,
  legal_name = excluded.legal_name,
  description = excluded.description,
  hr_responsible = excluded.hr_responsible,
  email = excluded.email,
  phone = excluded.phone,
  address = excluded.address,
  employee_count = excluded.employee_count,
  status = excluded.status,
  updated_at = now();

insert into public.branches (
  id,
  organization_id,
  clinic_id,
  company_id,
  name,
  city,
  state,
  address,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((200000 + company_index * 10 + branch_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  id,
  case when branch_no = 1 then 'Matriz' else 'Unidade Operacional' end,
  city,
  state,
  case when branch_no = 1 then 'Centro corporativo' else 'Unidade operacional regional' end,
  'active',
  '00000000-0000-4000-8000-000000001201',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 2) as branch(branch_no)
on conflict (company_id, name) do update
set
  city = excluded.city,
  state = excluded.state,
  address = excluded.address,
  status = excluded.status,
  updated_at = now();

insert into public.departments (
  id,
  organization_id,
  company_id,
  branch_id,
  name,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((300000 + company_index * 10 + department_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  id,
  ('00000000-0000-4000-8000-' || lpad((200000 + company_index * 10 + (((department_no - 1) % 2) + 1))::text, 12, '0'))::uuid,
  case department_no
    when 1 then 'Recursos Humanos'
    when 2 then 'Operações'
    when 3 then 'Comercial'
    else 'Administrativo'
  end,
  'active',
  '00000000-0000-4000-8000-000000001201',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 4) as department(department_no)
on conflict (company_id, (coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)), name)
do update
set
  status = excluded.status,
  updated_at = now();

insert into public.positions (
  id,
  organization_id,
  company_id,
  department_id,
  name,
  cbo_code,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((400000 + company_index * 10 + position_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  id,
  ('00000000-0000-4000-8000-' || lpad((300000 + company_index * 10 + (((position_no - 1) % 4) + 1))::text, 12, '0'))::uuid,
  case position_no
    when 1 then 'Analista Administrativo'
    when 2 then 'Coordenador de Operações'
    when 3 then 'Especialista Comercial'
    when 4 then 'Business Partner de RH'
    else 'Gerente de Unidade'
  end,
  '0000-' || position_no,
  'active',
  '00000000-0000-4000-8000-000000001201',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 5) as position(position_no)
on conflict (company_id, name) do update
set
  department_id = excluded.department_id,
  cbo_code = excluded.cbo_code,
  status = excluded.status,
  updated_at = now();

insert into public.employees (
  id,
  organization_id,
  company_id,
  auth_user_id,
  email,
  full_name,
  position,
  department,
  branch_id,
  department_id,
  position_id,
  cpf,
  registration,
  admission_date,
  status,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((500000 + (company_index - 1) * 20 + employee_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  id,
  case
    when company_index = 1 and employee_no <= 10
      then ('00000000-0000-4000-8000-' || lpad((1300 + employee_no)::text, 12, '0'))::uuid
    else null
  end,
  case
    when company_index = 1 and employee_no <= 10
      then 'colaborador' || lpad(employee_no::text, 2, '0') || '@empresa01.com.br'
    else 'colaborador' || lpad(((company_index - 1) * 20 + employee_no)::text, 3, '0') || '@empresa' || lpad(company_index::text, 2, '0') || '.com.br'
  end,
  'Colaborador ' || lpad(((company_index - 1) * 20 + employee_no)::text, 3, '0'),
  case (((employee_no - 1) % 5) + 1)
    when 1 then 'Analista Administrativo'
    when 2 then 'Coordenador de Operações'
    when 3 then 'Especialista Comercial'
    when 4 then 'Business Partner de RH'
    else 'Gerente de Unidade'
  end,
  case (((employee_no - 1) % 4) + 1)
    when 1 then 'Recursos Humanos'
    when 2 then 'Operações'
    when 3 then 'Comercial'
    else 'Administrativo'
  end,
  ('00000000-0000-4000-8000-' || lpad((200000 + company_index * 10 + (((employee_no - 1) % 2) + 1))::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((300000 + company_index * 10 + (((employee_no - 1) % 4) + 1))::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((400000 + company_index * 10 + (((employee_no - 1) % 5) + 1))::text, 12, '0'))::uuid,
  lpad((90000000000 + ((company_index - 1) * 20 + employee_no))::text, 11, '0'),
  'EMP' || lpad(company_index::text, 2, '0') || '-' || lpad(employee_no::text, 3, '0'),
  current_date - employee_no,
  'active',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 20) as employee(employee_no)
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  company_id = excluded.company_id,
  auth_user_id = excluded.auth_user_id,
  email = excluded.email,
  full_name = excluded.full_name,
  position = excluded.position,
  department = excluded.department,
  branch_id = excluded.branch_id,
  department_id = excluded.department_id,
  position_id = excluded.position_id,
  cpf = excluded.cpf,
  registration = excluded.registration,
  admission_date = excluded.admission_date,
  status = excluded.status,
  updated_at = now();

insert into public.programs (
  id,
  organization_id,
  clinic_id,
  company_id,
  title,
  description,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((600000 + company_index * 10 + program_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  id,
  case program_no
    when 1 then 'Programa NR-1 Psicossocial'
    else 'Programa Liderança Saudável'
  end || ' - ' || name,
  'Programa ativo de homologação com trilhas, módulos, aulas, recursos e quiz.',
  'active',
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 2) as program(program_no)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.tracks (
  id,
  organization_id,
  clinic_id,
  company_id,
  program_id,
  title,
  description,
  position,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((610000 + company_index * 10 + program_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  id,
  ('00000000-0000-4000-8000-' || lpad((600000 + company_index * 10 + program_no)::text, 12, '0'))::uuid,
  'Trilha principal ' || program_no || ' - ' || name,
  'Trilha de aprendizagem vinculada ao programa.',
  program_no,
  'active',
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 2) as program(program_no)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.modules (
  id,
  organization_id,
  clinic_id,
  company_id,
  track_id,
  title,
  description,
  position,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((620000 + company_index * 100 + program_no * 10 + module_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  id,
  ('00000000-0000-4000-8000-' || lpad((610000 + company_index * 10 + program_no)::text, 12, '0'))::uuid,
  'Módulo ' || module_no || ' - Programa ' || program_no,
  'Módulo de homologação.',
  module_no,
  'active',
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 2) as program(program_no)
cross join generate_series(1, 2) as module(module_no)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.lessons (
  id,
  organization_id,
  clinic_id,
  company_id,
  module_id,
  title,
  description,
  video_provider,
  video_external_id,
  duration_seconds,
  position,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((630000 + company_index * 1000 + program_no * 100 + module_no * 10 + lesson_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  id,
  ('00000000-0000-4000-8000-' || lpad((620000 + company_index * 100 + program_no * 10 + module_no)::text, 12, '0'))::uuid,
  'Aula ' || lesson_no || ' - Módulo ' || module_no,
  'Aula preparada para integração Vimeo.',
  'vimeo',
  'vimeo-seed-' || company_index || '-' || program_no || '-' || module_no || '-' || lesson_no,
  600 + lesson_no * 60,
  lesson_no,
  'active',
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 2) as program(program_no)
cross join generate_series(1, 2) as module(module_no)
cross join generate_series(1, 3) as lesson(lesson_no)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  video_external_id = excluded.video_external_id,
  duration_seconds = excluded.duration_seconds,
  status = excluded.status,
  updated_at = now();

insert into public.lesson_resources (
  id,
  organization_id,
  clinic_id,
  company_id,
  lesson_id,
  title,
  resource_type,
  external_url,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((640000 + company_index * 1000 + program_no * 100 + module_no * 10 + lesson_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  id,
  ('00000000-0000-4000-8000-' || lpad((630000 + company_index * 1000 + program_no * 100 + module_no * 10 + lesson_no)::text, 12, '0'))::uuid,
  'Material de apoio',
  'link',
  'https://nexxohub.com.br/materiais/homologacao',
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 2) as program(program_no)
cross join generate_series(1, 2) as module(module_no)
cross join generate_series(1, 3) as lesson(lesson_no)
on conflict (id) do update
set
  title = excluded.title,
  external_url = excluded.external_url,
  updated_at = now();

insert into public.quizzes (
  id,
  organization_id,
  clinic_id,
  company_id,
  lesson_id,
  title,
  questions,
  passing_score,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((650000 + company_index * 1000 + program_no * 100 + module_no * 10 + lesson_no)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  id,
  ('00000000-0000-4000-8000-' || lpad((630000 + company_index * 1000 + program_no * 100 + module_no * 10 + lesson_no)::text, 12, '0'))::uuid,
  'Quiz da aula ' || lesson_no,
  jsonb_build_array(
    jsonb_build_object(
      'question',
      'Qual é o objetivo desta aula?',
      'options',
      jsonb_build_array('Conscientização e prevenção', 'Controle financeiro', 'Venda externa'),
      'answer',
      0
    )
  ),
  70,
  'active',
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
cross join generate_series(1, 2) as program(program_no)
cross join generate_series(1, 2) as module(module_no)
cross join generate_series(1, 3) as lesson(lesson_no)
on conflict (id) do update
set
  title = excluded.title,
  questions = excluded.questions,
  status = excluded.status,
  updated_at = now();

insert into public.certificates (
  id,
  organization_id,
  clinic_id,
  company_id,
  employee_id,
  program_id,
  issued_at,
  certificate_url,
  metadata,
  created_at
)
select
  ('00000000-0000-4000-8000-' || lpad((660000 + n)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  '00000000-0000-4000-8000-000000000901',
  '00000000-0000-4000-8000-000000000911',
  ('00000000-0000-4000-8000-' || lpad((500000 + n)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000600011',
  now(),
  'https://nexxohub.com.br/certificados/seed-' || n,
  jsonb_build_object('seed', true, 'score', 92),
  now()
from generate_series(1, 10) as certificate(n)
on conflict (id) do update
set
  issued_at = excluded.issued_at,
  certificate_url = excluded.certificate_url,
  metadata = excluded.metadata;

insert into public.assessments (
  id,
  organization_id,
  employee_id,
  title,
  description,
  questions,
  status,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((670000 + company_index)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  null,
  'Diagnóstico Psicossocial - ' || name,
  'Diagnóstico de homologação para indicadores e relatórios.',
  jsonb_build_array(
    jsonb_build_object('question', 'Como você avalia sua semana?', 'type', 'scale', 'min', 1, 'max', 5)
  ),
  'active',
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  questions = excluded.questions,
  status = excluded.status,
  updated_at = now();

insert into public.reports (
  id,
  organization_id,
  assessment_id,
  title,
  description,
  report_data,
  generated_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((680000 + company_index)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  ('00000000-0000-4000-8000-' || lpad((670000 + company_index)::text, 12, '0'))::uuid,
  'Relatório Executivo - ' || name,
  'Relatório gerado pelo seed enterprise.',
  jsonb_build_object('riskIndex', 72, 'participants', 20, 'company', name),
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  report_data = excluded.report_data,
  updated_at = now();

insert into public.action_plans (
  id,
  organization_id,
  company_id,
  title,
  description,
  owner_id,
  status,
  priority,
  starts_on,
  due_on,
  created_by,
  created_at,
  updated_at
)
select
  ('00000000-0000-4000-8000-' || lpad((690000 + company_index)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000900',
  id,
  'Plano de Ação NR-1 - ' || name,
  'Plano de homologação para acompanhamento técnico da clínica.',
  '00000000-0000-4000-8000-000000001101',
  'active',
  'high',
  current_date,
  current_date + 30,
  '00000000-0000-4000-8000-000000001101',
  now(),
  now()
from public._seed_enterprise_companies
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  priority = excluded.priority,
  starts_on = excluded.starts_on,
  due_on = excluded.due_on,
  updated_at = now();

delete from public.portal_memberships
where user_id in (select id from public._seed_enterprise_users);

insert into public.portal_memberships (
  user_id,
  portal,
  role,
  organization_id,
  clinic_id,
  company_id,
  employee_id,
  is_active,
  created_by,
  created_at,
  updated_at
)
select
  id,
  portal,
  portal_role,
  '00000000-0000-4000-8000-000000000900',
  clinic_id,
  company_id,
  case
    when portal = 'employee'
      then ('00000000-0000-4000-8000-' || lpad((500000 + employee_number)::text, 12, '0'))::uuid
    else null
  end,
  true,
  '00000000-0000-4000-8000-000000001001',
  now(),
  now()
from public._seed_enterprise_users;

delete from public.organizations
where name = 'Seed Temporário Enterprise'
  and cnpj like '88%';

insert into public.activity_events (
  organization_id,
  actor_id,
  event_type,
  entity_type,
  entity_id,
  title,
  description,
  occurred_at
)
values (
  '00000000-0000-4000-8000-000000000900',
  '00000000-0000-4000-8000-000000001001',
  'seed.enterprise_completed',
  'organization',
  '00000000-0000-4000-8000-000000000900',
  'Seed enterprise carregado',
  '2 clínicas, 5 empresas, 100 colaboradores e usuários de homologação criados.',
  now()
);

drop table if exists public._seed_enterprise_users;
drop table if exists public._seed_enterprise_companies;
end;
$enterprise_seed$;
