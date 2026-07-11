-- Permite o bootstrap seguro do proprietario da plataforma sem inventar CNPJ.

alter table public.organizations alter column cnpj drop not null;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
  full_name_value text;
  organization_name_value text;
  organization_cnpj_value text;
  is_platform_owner boolean;
begin
  full_name_value := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  organization_name_value := nullif(trim(new.raw_user_meta_data ->> 'organization_name'), '');
  organization_cnpj_value := regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'organization_cnpj', ''),
    '[^0-9]', '', 'g'
  );
  is_platform_owner := coalesce((new.raw_user_meta_data ->> 'platform_owner')::boolean, false);

  if full_name_value is null or organization_name_value is null then
    raise exception 'Required organization data was not provided';
  end if;

  if not is_platform_owner and length(organization_cnpj_value) <> 14 then
    raise exception 'Required organization data was not provided';
  end if;

  insert into public.organizations (
    name, legal_name, cnpj, responsible_name, email, status
  ) values (
    organization_name_value,
    organization_name_value,
    case when is_platform_owner then null else organization_cnpj_value end,
    full_name_value,
    new.email,
    'active'
  ) returning id into new_tenant_id;

  insert into public.users (id, email, full_name, role, organization_id)
  values (
    new.id,
    new.email,
    full_name_value,
    case when is_platform_owner then 'admin'::public.user_role else 'admin'::public.user_role end,
    new_tenant_id
  );

  insert into public.profiles (id, email, full_name, organization_id)
  values (new.id, new.email, full_name_value, new_tenant_id)
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      organization_id = excluded.organization_id,
      updated_at = now();

  insert into public.portal_memberships (
    user_id, portal, role, organization_id, is_active
  ) values (
    new.id,
    'nexxohub',
    case when is_platform_owner then 'nexxohub_admin' else 'nexxohub_admin' end,
    new_tenant_id,
    true
  );

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
