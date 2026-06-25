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

insert into public.organizations (id, name, cnpj)
values
  ('10000000-0000-0000-0000-000000000001', 'Tenant A', '11.111.111/0001-11'),
  ('20000000-0000-0000-0000-000000000002', 'Tenant B', '22.222.222/0001-22');

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
    '{}',
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
    '{}',
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
    '{}',
    now(),
    now()
  );

insert into public.users (id, email, full_name, role, organization_id)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'admin-a@example.test',
    'Admin A',
    'admin',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'member-a@example.test',
    'Member A',
    'user',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'admin-b@example.test',
    'Admin B',
    'admin',
    '20000000-0000-0000-0000-000000000002'
  );

insert into public.roles (id, organization_id, name)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Tenant A Role'
  ),
  (
    'b1000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
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
