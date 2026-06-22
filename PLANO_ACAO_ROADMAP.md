# PLANO DE AÇÃO & ROADMAP DE IMPLEMENTAÇÃO

**Data de Criação:** Junho de 2026  
**Duração Estimada:** 8-12 semanas  
**Equipe Recomendada:** 2-3 desenvolvedores full-stack  

---

## FASE 0: PREPARAÇÃO (1-2 dias)

### 0.1 Setup de Ambiente
- [ ] Clonar repositório
- [ ] Instalar Node.js v18+
- [ ] `npm install`
- [ ] Configurar `.env.local` com variáveis Supabase
- [ ] Testar `npm run dev`

**Tempo:** 1 hora

### 0.2 Configurar Git Workflow
- [ ] Criar branches de desenvolvimento
- [ ] Setup de pull request template
- [ ] Configurar protection rules
- [ ] Adicionar CONTRIBUTING.md

**Tempo:** 1 hora

### 0.3 Setup de Ferramentas de Desenvolvimento
- [ ] Configurar ESLint
- [ ] Configurar Prettier
- [ ] Configurar Husky
- [ ] Configurar Vercel CLI

**Tempo:** 1 hora

### 0.4 Documentação Inicial
- [ ] README.md detalhado
- [ ] Setup guide
- [ ] Arquitetura diagram
- [ ] Database schema diagram

**Tempo:** 2 horas

**Total Fase 0:** 5 horas

---

## FASE 1: SEGURANÇA CRÍTICA (2-3 dias)

### 1.1 Middleware & Autenticação
**Prioridade:** 🔴 CRÍTICO

```bash
# 1. Corrigir middleware.ts
# 2. Estender matcher a todas as rotas
# 3. Adicionar redirect ao login
# 4. Implementar refresh token automático
```

**Arquivos a modificar:**
- `middleware.ts` (refactor completo)
- `lib/supabase.ts` (adicionar helpers)

**Checklist:**
- [ ] Middleware protege todas as rotas
- [ ] Usuários não autenticados redirecionados ao login
- [ ] Token refresh automático
- [ ] Logout funciona

**Tempo:** 2-3 horas

### 1.2 Headers de Segurança
**Prioridade:** 🔴 CRÍTICO

```bash
# Criar/modificar next.config.js com security headers
```

**Checklist:**
- [ ] X-Content-Type-Options
- [ ] X-Frame-Options
- [ ] X-XSS-Protection
- [ ] Strict-Transport-Security
- [ ] CSP headers

**Tempo:** 1 hora

### 1.3 Variáveis de Ambiente
**Prioridade:** 🔴 CRÍTICO

```bash
# Revisar e completar .env.local
# Adicionar a Vercel environment variables
```

**Checklist:**
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY (apenas server)
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NODE_ENV

**Tempo:** 1 hora

### 1.4 Validação de Input
**Prioridade:** 🔴 CRÍTICO

```bash
npm install zod @hookform/react-hook-form
```

**Criar:**
- `lib/validation/schemas.ts` (Zod schemas)
- `lib/validation/errors.ts` (Custom errors)

**Checklist:**
- [ ] Schemas para auth criados
- [ ] Schemas para users criados
- [ ] Middleware de validação
- [ ] Error handling para validação

**Tempo:** 3-4 horas

### 1.5 RLS no Supabase
**Prioridade:** 🔴 CRÍTICO

**Ações:**
- [ ] Ativar RLS em todas as tabelas
- [ ] Criar policies básicas
- [ ] Testar acesso

**Sugestão de policies:**
```sql
-- Users veem apenas sua própria organização
-- Organizações veem apenas seu próprio tenant
-- Clinics veem apenas sua organização
```

**Tempo:** 3-4 horas

**Total Fase 1:** 10-15 horas

---

## FASE 2: SETUP & DEPENDÊNCIAS (1-2 dias)

### 2.1 Instalar & Configurar Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Modificar:**
- `tailwind.config.ts` (adicionar paths)
- `app/globals.css` (imports)

**Tempo:** 1 hora

### 2.2 Instalar & Configurar shadcn/ui

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add pagination
```

**Tempo:** 2 horas

### 2.3 Instalar Dependências de Desenvolvimento

```bash
npm install -D eslint prettier @typescript-eslint/eslint-plugin
npm install -D husky lint-staged
npm install -D vitest @testing-library/react msw
```

**Tempo:** 1 hora

### 2.4 Instalar Dependências de Runtime

```bash
npm install zustand
npm install @tanstack/react-query
npm install axios
npm install lucide-react
npm install clsx date-fns uuid
npm install sonner
```

**Tempo:** 30 minutos

### 2.5 Configurar Linting & Formatting

```bash
npx eslint --init
# Criar .prettierrc
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**Tempo:** 1 hora

**Total Fase 2:** 5.5 horas

---

## FASE 3: DATABASE SCHEMA (2-3 dias)

### 3.1 Planejamento de Schema

**Tabelas Necessárias:**
1. `organizations` - Orgs principais
2. `users` - Usuários do sistema
3. `user_roles` - Roles por usuário
4. `clinics` - Clínicas dentro de orgs
5. `companies` - Empresas dentro de orgs
6. `employees` - Colaboradores
7. `roles` - Papéis do sistema
8. `permissions` - Permissões
9. `assessments` - Avaliações
10. `assessment_responses` - Respostas
11. `reports` - Relatórios gerados
12. `audit_logs` - Auditoria

**Tempo:** 2 horas (planejamento)

### 3.2 Criar Migrations SQL

**Estrutura:**
```
supabase/migrations/
  ├── 001_initial_schema.sql
  ├── 002_create_rls_policies.sql
  ├── 003_create_audit_triggers.sql
```

**Checklist:**
- [ ] Organizations table com hierarquia
- [ ] Users table com autenticação
- [ ] Clinics & Companies
- [ ] Employees
- [ ] Roles & Permissions
- [ ] Assessments
- [ ] Reports
- [ ] Audit logs

**Tempo:** 6-8 horas

### 3.3 Criar Índices

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_clinics_org_id ON clinics(organization_id);
-- etc
```

**Tempo:** 1 hora

### 3.4 Criar Seed Data (Opcional)

```sql
-- Insert test data para desenvolvimento
```

**Tempo:** 1-2 horas

### 3.5 Validar Schema

- [ ] Todas as relações definidas
- [ ] Índices criados
- [ ] RLS policies testadas
- [ ] Foreign keys com cascade correto

**Tempo:** 1 hora

**Total Fase 3:** 11-15 horas

---

## FASE 4: AUTENTICAÇÃO COMPLETA (2-3 dias)

### 4.1 Pages de Autenticação

**Criar:**
- `app/auth/login/page.tsx` - Login
- `app/auth/register/page.tsx` - Registro
- `app/auth/forgot-password/page.tsx` - Reset de senha
- `app/auth/verify-email/page.tsx` - Verificação de email
- `app/auth/callback/route.ts` - OAuth callback

**Tempo:** 4-5 horas

### 4.2 Autenticação Flows

**Implementar:**
- Email/Password login
- Email/Password register
- Email verification
- Password reset
- Session persistence
- Logout

```typescript
// lib/auth/client.ts
export const authClient = {
  signUp: async (email, password) => { ... },
  signIn: async (email, password) => { ... },
  signOut: async () => { ... },
  resetPassword: async (email) => { ... },
  verifyOtp: async (otp) => { ... },
};
```

**Tempo:** 4-6 horas

### 4.3 Protected Layouts

**Criar:**
- `app/layout.tsx` - Layout raiz
- `app/(auth)/layout.tsx` - Auth layout
- `app/(dashboard)/layout.tsx` - Dashboard layout com navbar

**Tempo:** 3 horas

### 4.4 User Context/Store

**Implementar com Zustand:**
```typescript
// lib/stores/user.ts
export const useUserStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
```

**Tempo:** 1 hora

### 4.5 Testar Flows

- [ ] Login funciona
- [ ] Register funciona
- [ ] Email verification funciona
- [ ] Password reset funciona
- [ ] Session persiste após refresh
- [ ] Logout funciona

**Tempo:** 2 horas

**Total Fase 4:** 14-18 horas

---

## FASE 5: COMPONENTES & UI (2-3 dias)

### 5.1 Criar Componentes Base

**Usar shadcn/ui para:**
- Button
- Input
- Form
- Card
- Dialog
- Dropdown
- Alert
- Badge
- Table
- Pagination

**Tempo:** 1 hora (usando shadcn)

### 5.2 Criar Componentes Custom

**Componentes a criar:**
- `components/ui/Skeleton.tsx`
- `components/ui/LoadingSpinner.tsx`
- `components/ui/Avatar.tsx`
- `components/forms/FormField.tsx`
- `components/navigation/Navbar.tsx`
- `components/navigation/Sidebar.tsx`
- `components/layout/Container.tsx`

**Tempo:** 4-5 horas

### 5.3 Criar Layouts

**Layouts:**
- AuthLayout (minimal)
- DashboardLayout (com sidebar)
- AdminLayout (com mais opções)

**Tempo:** 3 horas

### 5.4 Criar Pages Template

**Templates:**
- Dashboard home
- Users list
- User detail
- Organizations list
- Settings

**Tempo:** 3-4 horas

### 5.5 Testes de UI/UX

- [ ] Responsivo em mobile
- [ ] Acessibilidade básica (WCAG)
- [ ] Temas de cores consistentes
- [ ] Tipografia consistente

**Tempo:** 2 horas

**Total Fase 5:** 13-16 horas

---

## FASE 6: APIS BÁSICAS (3-4 dias)

### 6.1 Criar API Routes Structure

```
app/api/
  ├── auth/
  │   ├── login/route.ts
  │   ├── register/route.ts
  │   ├── logout/route.ts
  │   └── me/route.ts
  ├── users/
  │   ├── route.ts (GET, POST)
  │   └── [id]/route.ts (GET, PUT, DELETE)
  ├── organizations/
  ├── clinics/
  └── ...
```

**Tempo:** 1 hora (estrutura)

### 6.2 Implementar Middleware de Autenticação

```typescript
// lib/api/auth-middleware.ts
export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    throw new UnauthorizedError('Unauthorized');
  }
  return session;
}
```

**Tempo:** 1 hora

### 6.3 Implementar CRUD de Usuários

**Endpoints:**
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `GET /api/users/[id]` - Obter usuário
- `PUT /api/users/[id]` - Atualizar usuário
- `DELETE /api/users/[id]` - Deletar usuário

**Validações:**
- Email único
- Senha mínimo 8 caracteres
- Role válido

**Tempo:** 4-5 horas

### 6.4 Implementar CRUD de Organizações

**Similar ao CRUD de usuários**

**Tempo:** 3-4 horas

### 6.5 Implementar CRUD de Clinics

**Tempo:** 3 horas

### 6.6 Testes de API

- [ ] Todos endpoints retornam 200/201
- [ ] Validações funcionam
- [ ] Erro handling funciona
- [ ] Autenticação protege rotas

**Tempo:** 2 horas

**Total Fase 6:** 14-17 horas

---

## FASE 7: DASHBOARD & NAVEGAÇÃO (2-3 dias)

### 7.1 Criar Dashboard Principal

**Componentes:**
- Welcome card
- Quick stats
- Recent activity
- Navigation cards

**Tempo:** 3 horas

### 7.2 Criar Navegação

**Componentes:**
- Header com user menu
- Sidebar com links
- Mobile navigation

**Tempo:** 2-3 horas

### 7.3 Criar Pages de Listagem

**Pages:**
- Users list com filtro e paginação
- Organizations list
- Clinics list

**Tempo:** 3-4 horas

### 7.4 Criar Pages de Detalhes

**Pages:**
- User detail com edição
- Organization detail
- Clinic detail

**Tempo:** 3-4 horas

### 7.5 Criar Settings Page

**Sections:**
- Profile settings
- Password change
- Notifications
- Integrations

**Tempo:** 2-3 horas

**Total Fase 7:** 13-17 horas

---

## FASE 8: TESTES & QA (2-3 dias)

### 8.1 Testes Unitários

```bash
npm install -D vitest @testing-library/react
```

**Coverage target:** > 70%

**Testes para:**
- Validações (Zod schemas)
- Hooks customizados
- Utilitários
- Componentes simples

**Tempo:** 4-6 horas

### 8.2 Testes de Integração

**Testes para:**
- Fluxo de autenticação
- CRUD de usuários
- CRUD de organizações

**Tempo:** 3-4 horas

### 8.3 E2E Tests (Opcional)

```bash
npm install -D @playwright/test
```

**Tempo:** 3-4 horas

### 8.4 Testes Manuais

**Checklist:**
- [ ] Login/Logout funciona
- [ ] CRUD de todas entidades
- [ ] Validações funcionam
- [ ] Erros mostram mensagens claras
- [ ] UI responsivo

**Tempo:** 2-3 horas

### 8.5 Security Testing

- [ ] CORS funciona
- [ ] Headers de segurança presentes
- [ ] RLS protege dados
- [ ] Rate limiting funciona
- [ ] CSRF protection funciona

**Tempo:** 2 horas

**Total Fase 8:** 14-19 horas

---

## FASE 9: DEPLOYMENT & MONITORING (1-2 dias)

### 9.1 Configurar CI/CD

```bash
# GitHub Actions workflow
.github/workflows/ci.yml
```

**Stages:**
- Lint
- Test
- Build
- Deploy to preview
- Deploy to production

**Tempo:** 2-3 horas

### 9.2 Configurar Monitoring

**Ferramentas:**
- Sentry (error tracking)
- Vercel Analytics
- Posthog (user analytics)

**Tempo:** 2 horas

### 9.3 Preparar Para Produção

**Checklist:**
- [ ] Environment variables configuradas
- [ ] Secrets configurados
- [ ] Domínio configurado
- [ ] SSL/HTTPS ativo
- [ ] Backups configurados

**Tempo:** 1-2 horas

### 9.4 Deploy Inicial

**Processo:**
- Deploy para staging
- Testes em staging
- Deploy para produção

**Tempo:** 1 hora

### 9.5 Pós-Deploy

- [ ] Monitorar erros
- [ ] Monitorar performance
- [ ] Usuários conseguem acessar
- [ ] Não há problemas de segurança

**Tempo:** 1 hora

**Total Fase 9:** 7-10 horas

---

## FASE 10: DOCUMENTAÇÃO & HANDOVER (1-2 dias)

### 10.1 Documentação Técnica

- [ ] README.md completo
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Architecture documentation
- [ ] Deployment guide

**Tempo:** 3-4 horas

### 10.2 Documentação de User

- [ ] User guide
- [ ] FAQ
- [ ] Troubleshooting

**Tempo:** 2-3 horas

### 10.3 Training

- [ ] Treinar time em codebase
- [ ] Treinar em deployment
- [ ] Treinar em monitoring

**Tempo:** 2 horas

### 10.4 Handover

- [ ] Passar projeto para team
- [ ] Estabelecer process de maintenance

**Tempo:** 1 hora

**Total Fase 10:** 8-10 horas

---

## CRONOGRAMA DETALHADO

### Semana 1
**Fase 0-1:** Setup & Segurança Crítica
- Seg-Ter: Setup, Git, Tools
- Qua-Sex: Middleware, Headers, RLS

**Horas:** 20 horas

### Semana 2
**Fase 1-2:** Segurança + Dependencies
- Seg-Ter: Validação, RLS
- Qua-Sex: Dependencies, Tailwind, shadcn

**Horas:** 20 horas

### Semana 3
**Fase 3:** Database Schema
- Seg-Ter: Schema design
- Qua-Qui: SQL migrations
- Sex: Índices e testes

**Horas:** 22 horas

### Semana 4
**Fase 4:** Autenticação
- Seg-Ter: Auth pages
- Qua-Qui: Auth flows
- Sex: Testes

**Horas:** 20 horas

### Semana 5
**Fase 5-6:** Componentes & APIs
- Seg-Ter: Componentes
- Qua-Qui: Layouts
- Sex: APIs de auth

**Horas:** 20 horas

### Semana 6
**Fase 6:** APIs Completas
- Seg-Ter: CRUD de users
- Qua-Qui: CRUD de orgs
- Sex: CRUD de clinics

**Horas:** 20 horas

### Semana 7
**Fase 7:** Dashboard
- Seg-Ter: Dashboard principal
- Qua-Qui: Pages de listagem
- Sex: Pages de detalhes

**Horas:** 20 horas

### Semana 8
**Fase 8:** Testes
- Seg-Qua: Unit tests
- Qui-Fri: Integration tests & E2E

**Horas:** 20 horas

### Semana 9
**Fase 9:** Deployment
- Seg-Ter: CI/CD setup
- Qua-Qui: Monitoring
- Sex: Deploy e testes em prod

**Horas:** 15 horas

### Semana 10
**Fase 10:** Documentação
- Seg-Ter: Docs técnicas
- Qua-Qui: Docs de usuário
- Sex: Training & handover

**Horas:** 15 horas

---

## ESTIMATIVA TOTAL

| Fase | Horas | Semanas |
|------|-------|---------|
| 0: Preparação | 5 | 0.25 |
| 1: Segurança | 15 | 0.75 |
| 2: Setup | 5.5 | 0.27 |
| 3: Database | 15 | 0.75 |
| 4: Autenticação | 18 | 0.9 |
| 5: UI | 16 | 0.8 |
| 6: APIs | 17 | 0.85 |
| 7: Dashboard | 17 | 0.85 |
| 8: Testes | 19 | 0.95 |
| 9: Deploy | 10 | 0.5 |
| 10: Documentação | 10 | 0.5 |
| **TOTAL** | **147.5** | **7.4** |

**Com 1 developer:** 10 semanas  
**Com 2 developers:** 5-6 semanas  
**Com 3 developers:** 3-4 semanas  

---

## DEPENDÊNCIAS CRÍTICAS

- ✓ Repositório Git configurado
- ✗ Supabase project criado
- ✗ Vercel project configurado
- ✗ Domínio registrado (opcional para MVP)
- ✗ Team comunicado sobre roadmap

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Delays em schema | Planejamento antecipado |
| Security bugs | Code review mandatória |
| Performance issues | Monitoring desde o start |
| Bugs em produção | CI/CD robusta |
| Knowledge gap | Documentação completa |

---

## PRÓXIMAS AÇÕES

1. ✅ Revisar este documento
2. ⚠️ **Semana 1:** Iniciar Fase 0-1
3. ⚠️ **Semana 2:** Completar Fase 2
4. ⚠️ **Semana 3:** Completar Fase 3
5. 🚀 **Semana 9:** Deploy MVP

---

**Plano de Ação gerado:** Junho de 2026  
**Status:** Pronto para execução
