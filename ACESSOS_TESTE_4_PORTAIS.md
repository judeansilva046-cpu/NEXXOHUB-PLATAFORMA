# Acessos de teste dos portais

Use estes acessos somente em ambiente local/homologação.

Senha única para todos:

```text
NexxoHub@Teste2026!Seguro
```

| Portal      | URL                           | E-mail                         | Papel              |
| ----------- | ----------------------------- | ------------------------------ | ------------------ |
| NexxoHub    | `/auth/login?portal=nexxohub` | `nexxohub.admin@nexxohub.test` | `nexxohub_admin`   |
| Financeiro  | `/auth/login?portal=nexxohub` | `financeiro@nexxohub.com.br`   | `nexxohub_finance` |
| Clínica     | `/auth/login?portal=clinic`   | `clinica.admin@nexxohub.test`  | `clinic_admin`     |
| Empresa     | `/auth/login?portal=company`  | `empresa.admin@nexxohub.test`  | `company_admin`    |
| Colaborador | `/auth/login?portal=employee` | `colaborador@nexxohub.test`    | `employee`         |

## Como gerar no banco local

Com Docker Desktop ativo:

```bash
supabase db reset
```

O arquivo [supabase/seed.sql](./supabase/seed.sql) cria os usuários no Supabase Auth e vincula cada um ao portal correto via `portal_memberships`.
