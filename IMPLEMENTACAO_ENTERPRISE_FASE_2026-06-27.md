# NexxoHub — Implementação Enterprise Fase 2026-06-27

## Entrega desta fase

- Portal Financeiro NexxoHub em `/finance`.
- Role financeira `nexxohub_finance` com redirect pós-login para `/finance`.
- RLS financeira para planos, assinaturas, contratos, faturas, pagamentos e cupons.
- Tabelas financeiras adicionais: `payments` e `coupons`.
- Importação organizacional movida para o Portal Empresa em `/company/organization`.
- Portal Clínica restrito à importação rápida de empresas.
- Portal Empresa habilitado para importar filiais, departamentos, cargos e colaboradores.
- Redirecionamento `/financeiro` para `/finance`.
- RLS reforçada para que empresa só importe a própria estrutura organizacional.

## Migrations criadas

- `supabase/migrations/20260627123000_enterprise_finance_and_company_imports.sql`

## Tabelas criadas/alteradas

Criadas:

- `payments`
- `coupons`

Alteradas:

- `portal_memberships`
- `billing_plans`
- `subscriptions`
- `quick_onboarding_imports`
- `quick_onboarding_import_errors`

## Policies RLS principais

- `NexxoHub finance manages billing plans`
- `NexxoHub finance manages subscriptions`
- `NexxoHub finance reads contracts`
- `NexxoHub finance reads invoices`
- `NexxoHub finance manages payments`
- `NexxoHub finance manages coupons`
- `Clinics read own subscriptions`
- `Clinic staff create quick onboarding imports`
- `Clinic staff update quick onboarding imports`
- `Company HR read own quick onboarding imports`
- `Company HR create own quick onboarding imports`
- `Company HR update own quick onboarding imports`
- `Company HR manage own quick onboarding import errors`

## Comandos de validação executados

```bash
npm run format:check
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
supabase db reset
```

## Variáveis de ambiente necessárias

Obrigatórias:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
```

Para integrações/produção:

```bash
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
ASAAS_API_KEY=
VIMEO_ACCESS_TOKEN=
ANTHROPIC_API_KEY=
```

## Checklist de validação

- Entrar como `nexxohub_admin` e acessar `/finance`.
- Entrar como `nexxohub_finance` e confirmar redirect para `/finance`.
- Confirmar que `nexxohub_operator` não acessa `/finance`.
- Entrar como clínica e confirmar que a Implantação Rápida só exibe importação de empresas.
- Entrar como empresa e abrir `/company/organization`.
- Importar template CSV de filiais/departamentos/cargos/colaboradores no Portal Empresa.
- Confirmar que importações gravam em `quick_onboarding_imports`.
- Confirmar que erros por linha gravam em `quick_onboarding_import_errors`.
- Confirmar que pagamentos/cupons só são visíveis para `nexxohub_admin`/`nexxohub_finance`.

## Pendências reais restantes

- Aplicar migrations no Supabase remoto antes de deploy em produção.
- Criar telas CRUD completas para planos, assinaturas, cupons, faturas e pagamentos.
- Adicionar CRUD individual completo no Portal Empresa para filiais/departamentos/cargos/colaboradores.
- Integrar Asaas, Vimeo e Claude APIs com credenciais reais.
- Criar testes E2E autenticados para `/finance` e `/company/organization`.
