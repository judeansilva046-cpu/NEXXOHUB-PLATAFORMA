-- Remove dados artificiais de desenvolvimento/homologacao da base de producao.
-- A limpeza usa UUIDs reservados pelo antigo seed e recusa excluir registros
-- caso esses IDs tenham sido reaproveitados com outra identidade.

do $$
declare
  unexpected_count integer;
begin
  select count(*)
    into unexpected_count
  from public.organizations
  where id in (
    '00000000-0000-4000-8000-000000000100'::uuid,
    '00000000-0000-4000-8000-000000000900'::uuid
  )
  and not (
    (id = '00000000-0000-4000-8000-000000000100'::uuid and cnpj = '90909090000190')
    or
    (id = '00000000-0000-4000-8000-000000000900'::uuid and cnpj = '12121212000112')
  );

  if unexpected_count > 0 then
    raise exception 'Limpeza cancelada: UUID reservado possui dados diferentes do seed conhecido.';
  end if;
end;
$$;

-- Remove primeiro as identidades de autenticacao. As FKs do Supabase eliminam
-- identities e perfis relacionados; os demais dados saem pelo tenant abaixo.
delete from auth.users
where id in (
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000003'::uuid,
  '00000000-0000-4000-8000-000000000004'::uuid
)
or raw_user_meta_data ->> 'seed' = 'enterprise-homologation';

-- Todos os modulos operacionais usam organization_id/tenant_id com cascade.
delete from public.organizations
where id in (
  '00000000-0000-4000-8000-000000000100'::uuid,
  '00000000-0000-4000-8000-000000000900'::uuid
);

drop table if exists public._seed_enterprise_users;
drop table if exists public._seed_enterprise_companies;
