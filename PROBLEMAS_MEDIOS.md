# LISTA DE PROBLEMAS MÉDIOS

**Data:** Junho de 2026  
**Total de Problemas Médios:** 25  
**Tempo Total Estimado:** 35-50 horas  
**Prioridade:** Resolver após problemas críticos  

---

## PROBLEMAS MÉDIOS

### 1. FRONTEND - Sem Sistema de Estado Global

**ID:** FE-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Sem bibliotecas de state management (Zustand, Context, etc).

**Consequência:**
- Props drilling excessivo
- Código difícil de manter
- Performance ruim (re-renders)

**Solução Recomendada:**
```bash
npm install zustand
# ou
npm install jotai
```

Exemplo com Zustand:
```typescript
import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

**Tempo:** 3 horas (setup + implementação básica)

---

### 2. FRONTEND - Sem Data Fetching Layer

**ID:** FE-002  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Sem React Query ou SWR para gerenciar requests.

**Consequência:**
- Múltiplas requisições
- Cache manual
- Loading states complicados
- Race conditions

**Solução Recomendada:**
```bash
npm install @tanstack/react-query
```

Exemplo:
```typescript
import { useQuery } from '@tanstack/react-query';

function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      return res.json();
    }
  });
}
```

**Tempo:** 4 horas

---

### 3. FRONTEND - Componentes de UI Não Configurados

**ID:** FE-003  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Mesmo com Tailwind instalado, componentes base não estão criados.

**Componentes Faltando:**
- Button
- Input
- Form
- Card
- Dialog
- Dropdown
- Alert
- Badge
- Breadcrumb
- Table
- Pagination

**Solução:**
Usar `shadcn-ui` ou criar manualmente.

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
# etc
```

**Tempo:** 4-6 horas (para todos os componentes básicos)

---

### 4. FRONTEND - Sem Error Boundary

**ID:** FE-004  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Erros não são capturados graciosamente.

**Consequência:**
- App quebra completamente
- Usuário vê tela branca
- Não há feedback

**Solução:**
```typescript
'use client';

import { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  // Implementar error boundary
  return <>{children}</>;
}
```

**Tempo:** 2 horas

---

### 5. FRONTEND - Sem Loading States Padrão

**ID:** FE-005  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Não há padrão para mostrar loading/skeleton.

**Solução:**
Criar componentes:
- `<Skeleton />`
- `<LoadingSpinner />`
- `<LoadingButton />`

**Tempo:** 2 horas

---

### 6. BACKEND - Tratamento de Erros Inconsistente

**ID:** BE-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Sem tratamento padronizado de erros nas APIs.

**Solução:**
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string
  ) {
    super(message);
  }
}

export async function handleError(error: unknown) {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({ error: error.code, message: error.message }),
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({ error: 'INTERNAL_SERVER_ERROR' }),
    { status: 500 }
  );
}
```

**Tempo:** 2 horas

---

### 7. BACKEND - Sem Logging Estruturado

**ID:** BE-002  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Sem logging de requests/erros.

**Solução:**
```bash
npm install winston pino
# ou usar Vercel Functions logging
```

```typescript
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  logger.info('Creating user', { 
    timestamp: new Date().toISOString() 
  });
  // ...
}
```

**Tempo:** 2 horas

---

### 8. BACKEND - Sem Versionamento de API

**ID:** BE-003  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
APIs sem versionamento.

**Solução:**
Estruturar como:
```
/api/v1/users
/api/v1/organizations
/api/v2/users (versão futura com breaking changes)
```

**Tempo:** 1 hora

---

### 9. BACKEND - Sem Paginação

**ID:** BE-004  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Sem limite de resultados.

**Solução:**
Implementar offset/limit ou cursor pagination:
```typescript
const limit = Math.min(parseInt(req.query.limit || '10'), 100);
const offset = parseInt(req.query.offset || '0');

const { data, count } = await supabase
  .from('users')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);
```

**Tempo:** 2 horas

---

### 10. BACKEND - Sem Documentação de API

**ID:** BE-005  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Sem swagger/OpenAPI documentation.

**Solução:**
```bash
npm install swagger-jsdoc swagger-ui-express
```

**Tempo:** 3-4 horas

---

### 11. DATABASE - Sem Índices de Performance

**ID:** DB-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Queries podem ser lentas sem índices.

**Solução:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_organizations_id ON organizations(id);
CREATE INDEX idx_users_org_id ON users(organization_id);
```

**Tempo:** 1 hora

---

### 12. DATABASE - Sem Soft Deletes

**ID:** DB-002  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Sem possibilidade de recuperar dados deletados.

**Solução:**
Adicionar coluna `deleted_at`:
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Query com soft delete
SELECT * FROM users WHERE deleted_at IS NULL;
```

**Tempo:** 1 hora

---

### 13. DATABASE - Sem Timestamps de Auditoria

**ID:** DB-003  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Sem rastreamento de quando dados foram criados/modificados.

**Solução:**
```sql
ALTER TABLE users 
  ADD COLUMN created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

**Tempo:** 30 minutos

---

### 14. DATABASE - Sem Relacionamentos Definidos

**ID:** DB-004  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Foreign keys não estão definidos.

**Solução:**
```sql
ALTER TABLE clinics
  ADD CONSTRAINT fk_clinics_organization
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id) ON DELETE CASCADE;
```

**Tempo:** 1-2 horas

---

### 15. AUTENTICAÇÃO - Sem Multi-Factor Authentication

**ID:** AUTH-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto (segurança)  

**Problema:**
Sem proteção contra força bruta/roubo de senha.

**Solução:**
Implementar 2FA no Supabase:
```typescript
// Gerar secret TOTP
const { data } = await supabase.auth.mfa.enroll({ factorType: 'totp' });

// Verificar durante login
await supabase.auth.mfa.challengeFactor({ factorId: data.id });
```

**Tempo:** 4 horas

---

### 16. AUTENTICAÇÃO - Sem Session Management

**ID:** AUTH-002  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Sem logout em múltiplos dispositivos.

**Solução:**
Implementar session invalidation.

**Tempo:** 2 horas

---

### 17. AUTENTICAÇÃO - Sem OAuth/Social Login

**ID:** AUTH-003  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Sem integração com Google, GitHub, etc.

**Solução:**
Configurar em Supabase:
```typescript
// Enable GitHub OAuth em Supabase dashboard
// Usar no cliente:

const { error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: { redirectTo: `${location.origin}/auth/callback` }
});
```

**Tempo:** 2-3 horas

---

### 18. PERFORMANCE - Sem Code Splitting

**ID:** PERF-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Bundle JavaScript potencialmente grande.

**Solução:**
Usar dynamic imports:
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/Heavy'), {
  loading: () => <Skeleton />,
});
```

**Tempo:** 2 horas

---

### 19. PERFORMANCE - Sem Image Optimization

**ID:** PERF-002  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Imagens não otimizadas.

**Solução:**
Usar Next.js Image:
```typescript
import Image from 'next/image';

<Image
  src="/image.png"
  alt="Description"
  width={400}
  height={300}
  priority
/>
```

**Tempo:** 1 hora

---

### 20. LINTING & CODE QUALITY - Sem Linter

**ID:** QA-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Sem enforcement de padrão de código.

**Solução:**
```bash
npm install -D eslint @typescript-eslint/eslint-plugin prettier
npx eslint --init
```

**Tempo:** 1 hora

---

### 21. LINTING & CODE QUALITY - Sem Prettier

**ID:** QA-002  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Baixo  

**Problema:**
Formatação inconsistente.

**Solução:**
```bash
npm install -D prettier
# Criar .prettierrc
```

**Tempo:** 30 minutos

---

### 22. LINTING & CODE QUALITY - Sem Git Hooks

**ID:** QA-003  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Médio  

**Problema:**
Código ruim pode ser commitado.

**Solução:**
```bash
npm install -D husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**Tempo:** 1 hora

---

### 23. TESTING - Sem Testes Unitários

**ID:** TEST-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Nenhum teste automatizado.

**Solução:**
```bash
npm install -D vitest @testing-library/react
```

**Tempo:** 5-8 horas (para testes básicos)

---

### 24. TESTING - Sem Testes de Integração

**ID:** TEST-002  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Sem testes de fluxo completo.

**Solução:**
Implementar testes de integração com MSW:
```bash
npm install -D msw
```

**Tempo:** 4-6 horas

---

### 25. CI/CD - Sem Pipeline Automatizado

**ID:** CICD-001  
**Severidade:** 🟠 MÉDIO  
**Impacto:** Alto  

**Problema:**
Sem verificações antes de deploy.

**Solução:**
Configurar GitHub Actions:
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**Tempo:** 2 horas

---

## RESUMO POR CATEGORIA

### Frontend (5 problemas)
- State management
- Data fetching
- UI components
- Error boundary
- Loading states

**Tempo Total:** 15-18 horas

### Backend (5 problemas)
- Error handling
- Logging
- API versioning
- Pagination
- Documentação

**Tempo Total:** 10-12 horas

### Database (4 problemas)
- Índices
- Soft deletes
- Timestamps
- Relacionamentos

**Tempo Total:** 3-4 horas

### Autenticação (3 problemas)
- MFA
- Session management
- OAuth

**Tempo Total:** 8-10 horas

### Performance (2 problemas)
- Code splitting
- Image optimization

**Tempo Total:** 3 horas

### Code Quality (3 problemas)
- ESLint
- Prettier
- Git hooks

**Tempo Total:** 2.5 horas

### Testing (2 problemas)
- Unit tests
- Integration tests

**Tempo Total:** 9-14 horas

### CI/CD (1 problema)
- GitHub Actions

**Tempo Total:** 2 horas

---

## MATRIZ DE PRIORIDADE

### Alta Prioridade (Resolver em 1-2 semanas)
- FE-001: State management
- FE-002: Data fetching
- FE-003: UI components
- BE-001: Error handling
- BE-002: Logging
- TEST-001: Unit tests
- DB-001: Índices

**Tempo:** 20-25 horas

### Média Prioridade (Resolver em 2-4 semanas)
- FE-004-005: Error handling & Loading
- BE-003-005: Versionamento, Paginação, Docs
- AUTH-001-003: MFA, Sessions, OAuth
- PERF-001-002: Code splitting, Images
- QA-001-003: Linting, Prettier, Hooks
- TEST-002: Integration tests

**Tempo:** 25-30 horas

### Baixa Prioridade (Resolver em 1-2 meses)
- DB-002-004: Soft deletes, Timestamps, FKs
- CICD-001: GitHub Actions
- PERF-003+: Outras otimizações

**Tempo:** 10 horas

---

## PRÓXIMOS PASSOS

1. ✅ Completar problemas críticos (25-35h)
2. ⚠️ Começar problemas médios de alta prioridade (20-25h)
3. ⚠️ Depois problemas médios de média prioridade
4. ✅ Deixar baixa prioridade para depois

---

**Documento gerado:** Junho de 2026  
