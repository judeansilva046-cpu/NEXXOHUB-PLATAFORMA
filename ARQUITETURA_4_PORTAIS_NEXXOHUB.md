# Arquitetura de 4 portais NexxoHub

Implementação base para SaaS multi-tenant B2B2B com Supabase Auth, PostgreSQL, RLS e isolamento por tenant.

## Rotas

- `/nexxohub`: Portal NexxoHub — Admin Master SaaS.
- `/clinic`: Portal Clínica — Admin Técnico.
- `/company`: Portal Empresa — Cliente Corporativo.
- `/employee`: Portal Colaborador — Usuário Final.

As rotas antigas de dashboard administrativo continuam disponíveis em `/dashboard/*` para compatibilidade, mas o destino principal do portal master passa a ser `/nexxohub`.

## Papéis oficiais

- `nexxohub_admin`
- `nexxohub_operator`
- `clinic_admin`
- `clinic_staff`
- `company_admin`
- `company_director`
- `company_hr`
- `company_compliance`
- `company_governance`
- `company_manager`
- `employee`

O helper [lib/rbac.ts](./lib/rbac.ts) normaliza aliases antigos, como `super_admin`, `hr`, `director` e `clinic_professional`, para evitar quebra de usuários existentes.

## Banco de dados

A migração [20260626170000_four_portal_rbac_and_modules.sql](./supabase/migrations/20260626170000_four_portal_rbac_and_modules.sql) adiciona ou reforça:

- `profiles`
- `roles`
- `user_roles`
- `portal_memberships`
- `programs`
- `tracks`
- `modules`
- `lessons`
- `lesson_resources`
- `quizzes`
- `certificates`
- `weekly_checkins`
- `complaints`
- `help_requests`
- `nr1_dossiers`
- `billing_plans`
- `subscriptions`
- `integration_settings`

Também preserva as tabelas já existentes de clínicas, empresas, colaboradores, filiais, departamentos, cargos, evidências, auditoria e avaliações.

## Segurança multi-tenant

- Middleware valida sessão, portal e papel antes de liberar rotas protegidas.
- `portal_memberships` define o escopo de tenant por usuário.
- RLS é obrigatório nas novas tabelas.
- Dados sensíveis individuais de check-ins ficam acessíveis apenas ao colaborador dono.
- Pedidos de ajuda seguem fluxo identificado entre colaborador e RH autorizado.
- Denúncias podem ser anônimas ou identificadas e ficam restritas a papéis de governança/compliance da empresa.
- NexxoHub não recebe política de leitura direta sobre respostas individuais, check-ins, denúncias ou pedidos de ajuda.

## Frontend

- Layout do Portal NexxoHub: [app/nexxohub/layout.tsx](./app/nexxohub/layout.tsx)
- Página inicial do Portal NexxoHub: [app/nexxohub/page.tsx](./app/nexxohub/page.tsx)
- Layouts dos portais Clínica/Empresa/Colaborador: [components/layout/portal-shell.tsx](./components/layout/portal-shell.tsx)
- Sidebar master sem links fictícios: [components/layout/sidebar.tsx](./components/layout/sidebar.tsx)
- Redirecionamento pós-login por papel real: [app/auth/login/page.tsx](./app/auth/login/page.tsx)

## APIs reais conectadas ao Supabase

- Dashboard multiportal: [app/api/portal/summary/route.ts](./app/api/portal/summary/route.ts)
- Convite de participantes psicossociais com papéis oficiais: [app/api/psychosocial/campaigns/[id]/participants/route.ts](./app/api/psychosocial/campaigns/[id]/participants/route.ts)

## Próximos passos do MVP

1. Rodar `supabase db reset` com Docker Desktop ativo para aplicar a nova migration localmente.
2. Criar telas CRUD reais para programas, trilhas, módulos, aulas, quizzes e certificados.
3. Criar endpoints agregados para indicadores psicossociais, evitando exposição individual.
4. Implementar fluxo completo de ajuda: abertura, atribuição, tratativa e encerramento.
5. Implementar fluxo completo de denúncias com regras de anonimato.
6. Conectar integrações reais: Vimeo, Asaas, Claude, e-mail e webhooks.
7. Criar testes SQL específicos para as novas políticas RLS.
8. Criar testes E2E por portal e por papel.
