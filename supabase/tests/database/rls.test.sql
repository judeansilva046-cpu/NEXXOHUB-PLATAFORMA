begin;

select plan(14);

select has_table('public', 'roles', 'roles table exists');
select has_table('public', 'permissions', 'permissions table exists');
select has_table('public', 'role_permissions', 'role_permissions table exists');
select has_table('public', 'user_roles', 'user_roles table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.roles'::regclass),
  'RLS is enabled on roles'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.permissions'::regclass),
  'RLS is enabled on permissions'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.role_permissions'::regclass),
  'RLS is enabled on role_permissions'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_roles'::regclass),
  'RLS is enabled on user_roles'
);

select is(
  has_table_privilege('anon', 'public.roles', 'select'),
  false,
  'anon cannot read roles'
);
select is(
  has_table_privilege('anon', 'public.permissions', 'select'),
  false,
  'anon cannot read permissions'
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin-a@example.test',
    crypt('local-test-only', gen_salt('bf')),
    now(),
    '{}',
    '{"full_name":"Admin A","organization_name":"Tenant A","organization_cnpj":"11111111000111"}',
    now(),
    now()
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'member-a@example.test',
    crypt('local-test-only', gen_salt('bf')),
    now(),
    '{}',
    '{"full_name":"Member A","organization_name":"Temporary Member Tenant","organization_cnpj":"33333333000133"}',
    now(),
    now()
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin-b@example.test',
    crypt('local-test-only', gen_salt('bf')),
    now(),
    '{}',
    '{"full_name":"Admin B","organization_name":"Tenant B","organization_cnpj":"22222222000122"}',
    now(),
    now()
  );

delete from public.portal_memberships
where user_id = 'a0000000-0000-0000-0000-000000000002';

update public.users
set
  organization_id = (
    select organization_id
    from public.users
    where id = 'a0000000-0000-0000-0000-000000000001'
  ),
  role = 'user'
where id = 'a0000000-0000-0000-0000-000000000002';

insert into public.roles (id, organization_id, name)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    (
      select organization_id from public.users
      where id = 'a0000000-0000-0000-0000-000000000001'
    ),
    'Tenant A Role'
  ),
  (
    'b1000000-0000-0000-0000-000000000001',
    (
      select organization_id from public.users
      where id = 'b0000000-0000-0000-0000-000000000001'
    ),
    'Tenant B Role'
  );

insert into public.user_roles (user_id, role_id)
values
  (
    'a0000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001'
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a0000000-0000-0000-0000-000000000001',
  true
);

select is(
  (select count(*) from public.roles),
  1::bigint,
  'tenant A admin sees only tenant A roles'
);
select is(
  (select count(*) from public.user_roles),
  1::bigint,
  'tenant A admin sees only tenant A role assignments'
);

select set_config(
  'request.jwt.claim.sub',
  'a0000000-0000-0000-0000-000000000002',
  true
);

select is(
  (select count(*) from public.roles),
  1::bigint,
  'tenant A member sees only tenant A roles'
);
select is(
  (select count(*) from public.user_roles),
  1::bigint,
  'tenant A member sees only their own role assignment'
);

select * from finish();
rollback;
