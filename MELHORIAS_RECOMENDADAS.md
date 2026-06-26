# MELHORIAS RECOMENDADAS

**Data:** Junho de 2026  
**Foco:** Qualidade, Performance, Escalabilidade

---

## 1. ARQUITETURA & PADRÕES

### 1.1 Implementar Architecture Layer Pattern

**Benefício:** Separação clara de responsabilidades

**Estrutura Proposta:**

```
/app
  - Páginas e rotas

/components
  - Componentes reutilizáveis
  - Separados por domínio

/lib
  /api
    - Funções de chamada API
    - Serialização/desserialização
  /hooks
    - Custom hooks reutilizáveis
  /utils
    - Funções utilitárias
  /types
    - TypeScript types/interfaces
  /supabase
    - Cliente Supabase
    - Helpers de autenticação

/server
  /actions
    - Server actions do Next.js
  /utils
    - Utilitários de servidor

/domains
  /users
    - Tudo relacionado a usuários
  /organizations
    - Tudo relacionado a organizações
  /assessments
    - Tudo relacionado a avaliações
```

**Implementação:** 8 horas

---

### 1.2 Implementar Design System Consistente

**Benefício:** UI consistente, fácil de manter

**Recomendação:** Usar Storybook

```bash
npx storybook@latest init
```

**Componentes Base:**

```
Button
Input
Textarea
Select
Checkbox
Radio
Toggle
Card
Modal
Alert
Toast
Breadcrumb
Pagination
Table
Forms
Loading
Avatar
Badge
Tags
```

**Documentação:** 1h por componente

---

### 1.3 Criar Layer de Validação Centralizado

**Benefício:** Garantir integridade de dados

**Implementação:**

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  name: z.string().min(2, 'Nome muito curto'),
  role: z.enum(['admin', 'manager', 'user']),
});

// Reutilizar em frontend e backend
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

**Tempo:** 3 horas

---

### 1.4 Implementar Response Pattern Padronizado

**Benefício:** APIs previsíveis

**Padrão Recomendado:**

```typescript
// Success
{
  success: true,
  data: { ... },
  meta: { timestamp: '...', version: '1.0' }
}

// Error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Email já existe',
    details: { field: 'email', issue: 'duplicate' }
  }
}
```

**Tempo:** 2 horas

---

## 2. FRONTEND IMPROVEMENTS

### 2.1 Implementar Loading Skeleton System

**Benefício:** Better UX durante carregamento

```typescript
// components/ui/Skeleton.tsx
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
      {...props}
    />
  );
}

// Usage
function UsersSkeleton() {
  return (
    <div>
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-12 w-full mb-4" />
    </div>
  );
}
```

**Tempo:** 2 horas

---

### 2.2 Implementar Toast/Notification System

**Benefício:** Feedback ao usuário

**Recomendação:** Usar Sonner ou React Toastify

```bash
npm install sonner
```

**Uso:**

```typescript
import { toast } from 'sonner';

function SaveUser() {
  const handleSave = async () => {
    try {
      await api.updateUser(user);
      toast.success('Usuário atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    }
  };
}
```

**Tempo:** 1 hora

---

### 2.3 Implementar Modal/Dialog System

**Benefício:** UX melhor para ações

```typescript
// Usar Dialog do shadcn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function ConfirmDeleteDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
        </DialogHeader>
        {/* content */}
      </DialogContent>
    </Dialog>
  );
}
```

**Tempo:** 2 horas

---

### 2.4 Implementar Form Validation Real-time

**Benefício:** Feedback imediato ao usuário

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function UserForm() {
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    mode: 'onChange', // Validação em tempo real
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register('email')}
        placeholder="Email"
      />
      {form.formState.errors.email && (
        <span className="text-red-500">
          {form.formState.errors.email.message}
        </span>
      )}
    </form>
  );
}
```

**Tempo:** 2 horas

---

### 2.5 Implementar Breadcrumb Navigation

**Benefício:** Usuário sempre sabe onde está

```typescript
// components/Breadcrumb.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb';

function BreadcrumbNav() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="/organizations">Organizações</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem isCurrentPage>
        <span>Detalhes</span>
      </BreadcrumbItem>
    </Breadcrumb>
  );
}
```

**Tempo:** 1 hora

---

## 3. BACKEND IMPROVEMENTS

### 3.1 Implementar Request Logging Middleware

**Benefício:** Rastreabilidade de requisições

```typescript
// middleware/logging.ts
import { NextRequest, NextResponse } from 'next/server';

export async function loggingMiddleware(req: NextRequest) {
  const startTime = Date.now();
  const { pathname, search } = req.nextUrl;

  const response = NextResponse.next();

  const duration = Date.now() - startTime;

  console.log({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: pathname + search,
    status: response.status,
    duration: `${duration}ms`,
  });

  return response;
}
```

**Tempo:** 1 hora

---

### 3.2 Implementar Comprehensive Error Handling

**Benefício:** APIs mais robustas

```typescript
// lib/errors.ts
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// app/api/users/route.ts
import { handleApiError } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const validated = createUserSchema.parse(data);
    // ...
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Tempo:** 2 horas

---

### 3.3 Implementar Request/Response Interceptors

**Benefício:** Transformações centralizadas

```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Tempo:** 1 hora

---

### 3.4 Implementar API Versioning Strategy

**Benefício:** Compatibilidade futura

**Estrutura:**

```
/api/v1/
  /auth
  /users
  /organizations

/api/v2/ (futuro com breaking changes)
```

**Tempo:** 1 hora

---

## 4. DATABASE IMPROVEMENTS

### 4.1 Criar Audit Log Table

**Benefício:** Rastreabilidade completa

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  user_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

**Implementação:** Function trigger para cada tabela
**Tempo:** 4 horas

---

### 4.2 Implementar Row Level Security Policies

**Benefício:** Segurança multi-tenant automática

```sql
-- Users veem apenas sua própria organização
CREATE POLICY "Users see own organization data"
ON users
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Managers podem ver sua clínica
CREATE POLICY "Managers see own clinic"
ON clinics
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
  AND id IN (
    SELECT clinic_id FROM user_roles
    WHERE user_id = auth.uid() AND role = 'manager'
  )
);
```

**Tempo:** 3-4 horas

---

### 4.3 Criar Reusable Query Functions

**Benefício:** Queries otimizadas e reutilizáveis

```typescript
// lib/supabase/queries.ts
export async function getOrganizationUsers(orgId: string) {
  const supabase = createServerClient();

  return supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
}

export async function getUserWithRole(userId: string) {
  const supabase = createServerClient();

  return supabase
    .from('users')
    .select(
      `
      *,
      roles (
        id,
        name,
        permissions (
          id,
          name
        )
      )
    `
    )
    .eq('id', userId)
    .single();
}
```

**Tempo:** 2-3 horas

---

## 5. SECURITY IMPROVEMENTS

### 5.1 Implementar CORS Whitelist

**Benefício:** Protege contra requisições maliciosas

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = req.headers.get('origin');

  if (allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  return NextResponse.next();
}
```

**Tempo:** 1 hora

---

### 5.2 Implementar Helmet-like Headers

**Benefício:** Proteção contra ataques comuns

```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
}
```

**Tempo:** 30 minutos

---

### 5.3 Implementar Input Sanitization

**Benefício:** Proteção contra XSS

```bash
npm install dompurify
npm install -D @types/dompurify
```

```typescript
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

// Usar em dados do usuário
const cleanName = sanitizeInput(userInput.name);
```

**Tempo:** 1 hora

---

### 5.4 Implementar API Key Management

**Benefício:** Controle de terceiros

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
```

**Tempo:** 3 horas

---

## 6. PERFORMANCE IMPROVEMENTS

### 6.1 Implementar Database Query Optimization

**Técnicas:**

- Usar índices em foreign keys
- Usar índices em campos de busca
- Denormalizar dados quando necessário
- Usar query builder com select específico

```typescript
// Ruim: Select *
const data = await supabase.from('users').select('*');

// Bom: Select apenas o necessário
const data = await supabase.from('users').select('id, email, name, role');
```

**Tempo:** 2-3 horas

---

### 6.2 Implementar Caching Strategy

**Recomendação:** Redis + React Query

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export async function cachedGetUser(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = createServerClient();
      return supabase.from('users').select('*').eq('id', userId).single();
    },
    [`user-${userId}`],
    { revalidate: 3600 } // 1 hora
  )();
}
```

**Tempo:** 2 horas

---

### 6.3 Implementar CDN para Assets Estáticos

**Benefício:** Reduz latência

**Recomendação:** Vercel CDN (já incluído) + CloudFlare

```typescript
// next.config.js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'cdn.example.com',
    }
  ],
}
```

**Tempo:** 1 hora

---

## 7. MONITORING & OBSERVABILITY

### 7.1 Implementar Error Tracking

**Recomendação:** Sentry

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**Tempo:** 2 horas

---

### 7.2 Implementar Analytics

**Recomendação:** Vercel Analytics + Posthog

```bash
npm install @vercel/analytics @posthog/nextjs
```

**Tempo:** 2 horas

---

## RESUMO DE MELHORIAS

| Área        | Melhoria            | Tempo | Impacto |
| ----------- | ------------------- | ----- | ------- |
| Arquitetura | Layer Pattern       | 8h    | Alto    |
| Arquitetura | Design System       | 20h   | Alto    |
| Frontend    | Skeleton System     | 2h    | Médio   |
| Frontend    | Toast/Notifications | 1h    | Médio   |
| Frontend    | Modal System        | 2h    | Médio   |
| Frontend    | Form Validation     | 2h    | Alto    |
| Frontend    | Breadcrumb          | 1h    | Baixo   |
| Backend     | Request Logging     | 1h    | Médio   |
| Backend     | Error Handling      | 2h    | Alto    |
| Backend     | Interceptors        | 1h    | Médio   |
| Backend     | API Versioning      | 1h    | Médio   |
| Database    | Audit Logs          | 4h    | Médio   |
| Database    | RLS Policies        | 4h    | Alto    |
| Database    | Query Functions     | 3h    | Médio   |
| Segurança   | CORS Whitelist      | 1h    | Alto    |
| Segurança   | Security Headers    | 1h    | Alto    |
| Segurança   | Input Sanitization  | 1h    | Alto    |
| Segurança   | API Keys            | 3h    | Médio   |
| Performance | Query Optimization  | 3h    | Alto    |
| Performance | Caching             | 2h    | Alto    |
| Performance | CDN                 | 1h    | Médio   |
| Monitoring  | Error Tracking      | 2h    | Médio   |
| Monitoring  | Analytics           | 2h    | Médio   |

**TOTAL:** 65-80 horas

---

## ROADMAP PROPOSTO

### Sprint 1-2 (Semanas 1-2): Fundamentos

- [ ] Instalar dependências
- [ ] Arquitetura em camadas
- [ ] Design System básico
- [ ] Security headers
- [ ] RLS policies

### Sprint 3-4 (Semanas 3-4): UX & Forms

- [ ] Skeleton system
- [ ] Toast/Notifications
- [ ] Modal system
- [ ] Form validation
- [ ] Error handling

### Sprint 5-6 (Semanas 5-6): Performance & Observability

- [ ] Query optimization
- [ ] Caching strategy
- [ ] Error tracking
- [ ] Analytics
- [ ] Audit logs

### Sprint 7+ (Contínuo): Refinamento

- [ ] API versioning
- [ ] API keys
- [ ] Input sanitization
- [ ] Testes
- [ ] Documentação

---

**Documento gerado:** Junho de 2026
