begin;

select plan(4);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'e5c9f568-1e0f-47ae-847a-cc265dff2206',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'clinic-admin@example.test',
  crypt('local-test-only', gen_salt('bf')),
  now(),
  '{}',
  '{"full_name":"Clinic Admin","organization_name":"Tenant Test","organization_cnpj":"30000000000001"}',
  now(),
  now()
);

delete from public.portal_memberships
where user_id = 'e5c9f568-1e0f-47ae-847a-cc265dff2206';

update public.users
set role = 'manager'
where id = 'e5c9f568-1e0f-47ae-847a-cc265dff2206';

insert into public.clinics (id, organization_id, name, cnpj, status)
values
  (
    '10000000-0000-4000-8000-000000000001',
    (select organization_id from public.users where id = 'e5c9f568-1e0f-47ae-847a-cc265dff2206'),
    'Clinic A', '10000000000001', 'active'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    (select organization_id from public.users where id = 'e5c9f568-1e0f-47ae-847a-cc265dff2206'),
    'Clinic B', '10000000000002', 'active'
  );

insert into public.companies (id, organization_id, clinic_id, name, cnpj, status)
values
  (
    '20000000-0000-4000-8000-000000000001',
    (select organization_id from public.users where id = 'e5c9f568-1e0f-47ae-847a-cc265dff2206'),
    '10000000-0000-4000-8000-000000000001',
    'Company A', '20000000000001', 'active'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    (select organization_id from public.users where id = 'e5c9f568-1e0f-47ae-847a-cc265dff2206'),
    '10000000-0000-4000-8000-000000000002',
    'Company B', '20000000000002', 'active'
  );

insert into public.portal_memberships (
  user_id, portal, role, organization_id, clinic_id, is_active
) values (
  'e5c9f568-1e0f-47ae-847a-cc265dff2206',
  'clinic', 'clinic_admin',
  (select organization_id from public.users where id = 'e5c9f568-1e0f-47ae-847a-cc265dff2206'),
  '10000000-0000-4000-8000-000000000001',
  true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e5c9f568-1e0f-47ae-847a-cc265dff2206', true);

select is((select count(*) from public.clinics), 1::bigint, 'clinic isolation works');
select is((select count(*) from public.companies), 1::bigint, 'company isolation works');
select is((select count(*) from public.portal_memberships), 1::bigint, 'membership isolation works');
select is(
  has_table_privilege('authenticated', 'public.assessment_responses', 'select'),
  false,
  'raw assessment responses stay private'
);

select * from finish();
rollback;
