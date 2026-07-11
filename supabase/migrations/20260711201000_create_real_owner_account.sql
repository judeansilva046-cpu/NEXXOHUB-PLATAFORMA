-- Cria a conta proprietaria real usando somente o hash bcrypt da senha informada.

do $$
declare
  owner_user_id uuid;
begin
  select id into owner_user_id
  from auth.users
  where lower(email) = 'judeabsilva45@gmail.com'
  limit 1;

  if owner_user_id is null then
    owner_user_id := gen_random_uuid();

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change_token_current, email_change,
      phone_change_token, reauthentication_token, is_sso_user, is_anonymous,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      owner_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'judeabsilva45@gmail.com',
      '$2b$12$w0I3KlY7wySu1k8S8PPslu8v3FBqoeupqp.8lNbX6H.gZrNriDsz6',
      now(), '', '', '', '', '', '', '', false, false,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', 'Judean Silva',
        'organization_name', 'NexxoHub',
        'platform_owner', true
      ),
      now(), now()
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      owner_user_id,
      owner_user_id,
      owner_user_id::text,
      jsonb_build_object(
        'sub', owner_user_id::text,
        'email', 'judeabsilva45@gmail.com',
        'email_verified', true
      ),
      'email', now(), now(), now()
    );
  else
    update auth.users
    set encrypted_password = '$2b$12$w0I3KlY7wySu1k8S8PPslu8v3FBqoeupqp.8lNbX6H.gZrNriDsz6',
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = owner_user_id;
  end if;
end;
$$;
