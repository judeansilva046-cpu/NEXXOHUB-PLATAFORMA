# Auditoria técnica da plataforma NexxoHub

Data: 24 de junho de 2026  
Escopo: código Next.js, APIs, autenticação, Supabase, RLS, dependências, testes, build, CI/CD e configurações de implantação.

## Parecer executivo

**Status: NÃO IMPLANTAR.**

A plataforma não atende aos requisitos mínimos para staging ou produção. O build de produção falha, a suíte de testes falha, existe um endpoint público que recebe credenciais pela URL, o banco Supabase ativo possui tabelas públicas sem RLS e há vulnerabilidades conhecidas nas dependências.

Antes da implantação, os bloqueadores P0 e P1 deste relatório precisam ser corrigidos, validados em ambiente de staging e submetidos novamente aos advisors do Supabase.

## Evidências executadas

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | Falhou: 3 erros |
| `npm run lint` | Falhou: 1 erro e 17 avisos |
| `npm run build` | Falhou: módulo `recharts` ausente |
| Vitest | 40 testes passaram; 9 falharam |
| Separação Vitest/Playwright | Falhou: 5 suítes E2E são coletadas pelo Vitest |
| `npm audit` | 39 vulnerabilidades: 1 crítica, 6 altas, 28 moderadas e 4 baixas |
| Supabase Security Advisor | 3 erros de RLS e 1 tabela com RLS sem política |
| Supabase Performance Advisor | 4 FKs sem índice, 10 políticas RLS não otimizadas e políticas permissivas duplicadas |
| Build visual/autenticado | Não homologável enquanto o build falha |
| Estado Git | Branch `master` sem commit inicial; todos os arquivos estão sem rastreamento |

## Bloqueadores P0 — críticos

### P0.1 — Endpoint público recebe senha por query string

Arquivo: `app/api/auth/debug/route.ts`, linhas 6–77.

O endpoint `GET /api/auth/debug` recebe e-mail e senha pela URL, executa login e retorna dados de sessão. Senhas em URLs podem aparecer em histórico, logs, proxies, observabilidade e cabeçalhos de referência.

Correção obrigatória:

1. Remover integralmente a rota antes de qualquer deploy.
2. Invalidar e rotacionar qualquer credencial usada nesse endpoint.
3. Revisar logs locais e remotos para possível exposição.
4. Adicionar teste que confirme `404` para a rota em produção.

### P0.2 — Tabelas públicas sem RLS no Supabase ativo

O Security Advisor do projeto identificou:

- `public.permissions`: RLS desabilitado.
- `public.role_permissions`: RLS desabilitado.
- `public.user_roles`: RLS desabilitado.
- `public.roles`: RLS habilitado, mas sem políticas.

Essas tabelas fazem parte do modelo de autorização. Exposição ou alteração indevida pode resultar em elevação de privilégio.

Correção obrigatória:

1. Habilitar RLS nas três tabelas.
2. Criar políticas explícitas por operação e papel.
3. Definir políticas para `roles`.
4. Restringir `GRANT` para `anon` e `authenticated`.
5. Reexecutar os advisors após a migration.

Referência: [Supabase — RLS Disabled in Public](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

### P0.3 — Build de produção não compila

`app/dashboard/page.tsx:5` importa `recharts`, mas a dependência não existe no `package.json` nem no `node_modules`.

O TypeScript também encontrou dois parâmetros implicitamente `any` no dashboard.

Correção obrigatória:

1. Adicionar uma versão segura e fixada de `recharts` ou remover a implementação.
2. Corrigir os tipos do tooltip.
3. Exigir build, lint e typecheck verdes no CI.

### P0.4 — Credencial fixa em testes

`tests/e2e/auth.spec.ts` contém e-mail e senha literais reutilizados em cinco testes. Mesmo que sejam dados de teste, não devem estar versionados.

Correção obrigatória:

1. Rotacionar imediatamente a credencial.
2. Remover os valores do código.
3. Usar variáveis protegidas específicas de staging.
4. Bloquear execução E2E contra produção.

## Bloqueadores P1 — altos

### P1.1 — Autorização de middleware baseada em `getSession()`

`middleware.ts:42` e `app/api/auth/verify/route.ts:14` confiam em `auth.getSession()` no servidor. A autorização server-side deve validar a identidade com o padrão recomendado pela versão atual do Supabase, e não confiar apenas no conteúdo local da sessão.

Correção:

- Atualizar `@supabase/ssr` e `@supabase/supabase-js`.
- Migrar o middleware para o padrão SSR atual.
- Usar validação server-side apropriada (`getClaims()` ou `getUser()`, conforme suporte da versão adotada).
- Preservar corretamente todos os cookies ao renovar tokens.

Referência: [Supabase — Server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

### P1.2 — Políticas RLS incompletas para as operações da aplicação

A migration cria majoritariamente políticas `SELECT`. As APIs implementam `INSERT`, `UPDATE` e `DELETE` para organizações, clínicas, empresas e funcionários.

Consequências prováveis:

- CRUD falha com RLS habilitado; ou
- políticas adicionais existem apenas no banco e não estão versionadas, caracterizando drift de schema.

Além disso, a política de atualização de `users` possui `USING`, mas não possui `WITH CHECK`.

Correção:

1. Extrair e comparar o schema real com as migrations.
2. Versionar políticas para cada operação.
3. Incluir `TO authenticated`, predicado de tenant, `USING` e `WITH CHECK`.
4. Criar testes negativos de isolamento entre tenants.

### P1.3 — 39 vulnerabilidades de dependências

Resumo do `npm audit`:

- 1 crítica.
- 6 altas.
- 28 moderadas.
- 4 baixas.

Pacotes diretos relevantes:

- `vitest 1.3.1`: vulnerabilidades críticas.
- `axios 1.7.2`: múltiplas vulnerabilidades altas.
- `@hookform/resolvers 3.4.1`: vulnerabilidade alta transitiva.
- `@sentry/nextjs 8.17.0`: cadeia vulnerável.
- `@supabase/ssr 0.5.0` e `@supabase/supabase-js 2.46.0`: versões vulneráveis/antigas.
- `lint-staged 15.2.2`, `postcss 8.4.35` e `uuid 9.0.0`: advisories pendentes.

Correção:

1. Atualizar dependências em lotes controlados.
2. Não executar `npm audit fix --force` sem revisão.
3. Rodar testes e build após cada lote.
4. Remover dependências não utilizadas.

### P1.4 — Testes não formam uma barreira de qualidade confiável

O Vitest coleta `tests/e2e/*.spec.ts`, que pertencem ao Playwright. Entre os testes unitários reais há 9 falhas:

- datas dependentes de timezone;
- moeda com espaço Unicode;
- validação de data de nascimento incompatível com os dados;
- ausência de `trim()` em schema;
- expectativa de acessibilidade divergente no componente Card.

Correção:

- Limitar Vitest a `tests/unit/**`.
- Limitar Playwright a `tests/e2e/**`.
- Tornar testes de data determinísticos e timezone-aware.
- Corrigir schemas e componentes, não apenas relaxar expectativas.

### P1.5 — Pipeline de deploy aponta para endpoint inexistente

`.github/workflows/deploy.yml` testa `/api/health` em staging e produção, mas `app/api/health/route.ts` não existe. Portanto, o smoke test falhará mesmo após o build.

O workflow também referencia ações por `@main`, reduzindo reprodutibilidade e segurança da cadeia de CI.

Correção:

- Criar health check real, sem revelar segredos.
- Fixar ações por versão ou SHA.
- Validar staging antes de qualquer promoção.

## Achados P2 — médios

### P2.1 — Configurações de implantação conflitantes

O projeto contém Vercel/GitHub Actions, Netlify e Amplify simultaneamente.

`netlify.toml` redireciona todas as rotas para `/index.html`, padrão de SPA estática incompatível com uma aplicação Next.js com API routes e middleware.

É necessário escolher um único alvo inicial de implantação e remover configurações contraditórias.

### P2.2 — Gates de qualidade são deliberadamente ignorados

- `package.json`: build usa `next build --no-lint`.
- `next.config.ts`: `ignoreBuildErrors: true`.
- Existem `next.config.js` e `next.config.ts` com políticas diferentes.
- O job de segurança executa `npm audit ... || true`.

Falhas de lint, tipos e auditoria não devem ser ignoradas em produção.

### P2.3 — Falha aberta no fluxo de provisionamento de perfil

`app/api/auth/me/route.ts` tenta criar perfil automaticamente e, em caso de erro/RLS, retorna sucesso com um usuário parcial e `organization_id: null`.

Isso mascara falhas de provisionamento e pode levar a estados inconsistentes. O fluxo deve ser transacional, explícito e idempotente.

### P2.4 — Logs expõem dados pessoais

Há logs de e-mail, ID de usuário, telefone, respostas de API e perfil em middleware, autenticação e páginas do dashboard.

Para uma plataforma de gestão psicossocial, logs devem ser minimizados, estruturados e redigidos. Nunca registrar credenciais, tokens, respostas sensíveis ou dados clínicos.

### P2.5 — Performance do banco

O advisor identificou:

- FKs sem índice em `assessments.created_by`, `reports.generated_by`, `role_permissions.permission_id` e `user_roles.role_id`.
- Dez políticas RLS que recalculam `auth.uid()` por linha.
- Políticas permissivas duplicadas em `users`.

Otimizar com índices adequados e `(select auth.uid())`, depois medir com consultas reais.

### P2.6 — CI e runtime não estão alinhados

- Ambiente local auditado: Node `24.16.0`, npm `11.13.0`.
- CI: Node 18.
- Netlify: Node 20.
- `package.json`: Node `>=18.17.0`.

Definir uma versão única LTS em `.nvmrc`/`.node-version`, `engines`, CI e provedor.

### P2.7 — Repositório ainda não possui baseline

O repositório de destino está na branch `master`, sem commits, com todos os arquivos sem rastreamento. Não há base confiável para rollback, revisão ou deploy automatizado.

Antes de implantação:

1. Remover artefatos gerados e relatórios desnecessários.
2. Confirmar que nenhum segredo será versionado.
3. Criar commit inicial auditável.
4. Adotar branch `main` ou ajustar todos os workflows.

## Aspectos positivos

- `.env.local` está ignorado pelo Git.
- Não foi encontrado `service_role` real no frontend.
- As rotas CRUD usam `auth.getUser()` e fazem verificações de tenant/papel na aplicação.
- O projeto possui validação Zod, testes unitários e E2E, headers básicos e lockfile.
- O Supabase ativo tem RLS nas tabelas de negócio principais.

Esses controles são uma boa base, mas ainda não compensam os bloqueadores descritos.

## Plano de correção recomendado

### Fase 1 — contenção de segurança

1. Remover `/api/auth/debug`.
2. Rotacionar credenciais presentes nos testes e revisar logs.
3. Corrigir RLS/RBAC no Supabase.
4. Atualizar autenticação SSR.
5. Reduzir logs sensíveis.

### Fase 2 — tornar o projeto compilável

1. Resolver `recharts` e erros TypeScript.
2. Unificar `next.config`.
3. Corrigir lint.
4. Atualizar dependências vulneráveis.
5. Fixar Node LTS.

### Fase 3 — restaurar qualidade

1. Separar Vitest e Playwright.
2. Corrigir os 9 testes unitários.
3. Criar testes de autorização e isolamento multi-tenant.
4. Executar E2E com usuário exclusivo de staging.
5. Exigir cobertura e gates sem `|| true`.

### Fase 4 — preparar staging

1. Escolher o provedor de deploy.
2. Criar `/api/health`.
3. Configurar variáveis e URLs de redirect.
4. Criar migration reproduzível e verificar advisors.
5. Implantar somente em staging.
6. Executar smoke, E2E, segurança e rollback.

### Fase 5 — produção

Produção só deve ser liberada após:

- build, lint, typecheck e testes 100% verdes;
- zero achado crítico/alto no código e nas dependências relevantes;
- zero erro do Security Advisor;
- isolamento de tenant testado;
- backups e restauração testados;
- domínio, HTTPS, observabilidade e alertas validados;
- rollback ensaiado;
- aprovação formal do checklist.

## Critério atual de decisão

| Área | Estado |
|---|---|
| Segurança de aplicação | Reprovada |
| Segurança do banco | Reprovada |
| Build | Reprovado |
| Tipos/lint | Reprovados |
| Testes | Reprovados |
| Dependências | Reprovadas |
| CI/CD | Reprovado |
| Prontidão para staging | Não |
| Prontidão para produção | Não |

## Fontes técnicas

- [Supabase changelog](https://supabase.com/changelog)
- [Supabase Server-side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Supabase Going into Production](https://supabase.com/docs/guides/deployment/going-into-prod)
- [GitHub Advisory Database](https://github.com/advisories)
