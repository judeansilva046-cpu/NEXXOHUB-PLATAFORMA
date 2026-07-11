-- Corrige o e-mail definitivo do proprietario sem recriar a conta ou perder vinculos.
do $$
declare
  owner_user_id uuid;
begin
  select id into owner_user_id
  from auth.users
  where lower(email) = 'judeabsilva45@gmail.com'
  limit 1;

  if owner_user_id is not null then
    if exists (
      select 1 from auth.users
      where lower(email) = 'judeansilva046@gmail.com' and id <> owner_user_id
    ) then
      raise exception 'O e-mail definitivo ja pertence a outra conta';
    end if;

    update auth.users
    set email = 'judeansilva046@gmail.com',
        email_change = '',
        email_change_token_new = '',
        email_change_token_current = '',
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = owner_user_id;

    update auth.identities
    set identity_data = identity_data || jsonb_build_object(
          'email', 'judeansilva046@gmail.com',
          'email_verified', true
        ),
        updated_at = now()
    where user_id = owner_user_id and provider = 'email';

    update public.users
    set email = 'judeansilva046@gmail.com', updated_at = now()
    where id = owner_user_id;
  end if;
end;
$$;
