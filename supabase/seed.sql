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
