# Implantação do Supabase remoto

O deploy público da Netlify já está online, mas o banco Supabase remoto precisa receber a migration e os usuários de teste.

Projeto Supabase remoto identificado:

```text
xuhlhjpyukpqqpyixfct.supabase.co
```

## Opção A — Codex aplica automaticamente

Forneça/autentique um token Supabase e execute:

```bash
supabase login
supabase link --project-ref xuhlhjpyukpqqpyixfct
supabase db push
```

Depois, aplique o seed de testes no SQL Editor ou via `psql`, usando:

```text
supabase/seed.sql
```

## Opção B — Aplicar manualmente no Supabase Dashboard

1. Abra o Supabase Dashboard.
2. Entre no projeto `xuhlhjpyukpqqpyixfct`.
3. Vá em SQL Editor.
4. Execute primeiro:

```text
supabase/migrations/20260626170000_four_portal_rbac_and_modules.sql
```

5. Depois execute:

```text
supabase/seed.sql
```

## Acessos que serão criados

Senha única:

```text
NexxoHub@Teste2026!
```

Usuários:

```text
nexxohub.admin@nexxohub.test
clinica.admin@nexxohub.test
empresa.admin@nexxohub.test
colaborador@nexxohub.test
```

Sem essa etapa no Supabase remoto, o site público pode exibir `Acesso não autorizado`, porque o usuário não terá `portal_memberships` no banco de produção/staging.
