# LISTA DE PROBLEMAS CRÍTICOS

**Data:** Junho de 2026  
**Total de Problemas Críticos:** 18  
**Tempo Total Estimado para Correção:** 25-35 horas

---

## PROBLEMAS CRÍTICOS (Resolver HOJE)

### 1. SEGURANÇA - Middleware Insuficiente

**ID:** SEC-001  
**Severidade:** 🔴 CRÍTICO  
**Arquivo:** `middleware.ts`  
**Linha:** 13-14

**Problema:**

```typescript
export const config = {
  matcher: ['/'], // ❌ Apenas protege a homepage
};
```

O middleware apenas aplica a `/`, deixando `/api`, `/dashboard`, e outras rotas desprotegidas.

**Impacto:**

- Acesso não autorizado a APIs
- Usuários não autenticados podem fazer requisições
- Vazamento de dados

**Solução:**

```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Tempo:** 30 minutos

---

### 2. SEGURANÇA - Service Role Key Exposta

**ID:** SEC-002  
**Severidade:** 🔴 CRÍTICO  
**Arquivo:** `.env.example`

**Problema:**
Service Role Key pode estar em repositório público:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Impacto:**

- Chave de admin exposta
- Acesso total ao banco de dados
- Violação de dados

**Solução:**

1. Remover do `.env.example`
2. Usar apenas em variáveis secretas do Vercel
3. Rotacionar chaves no Supabase

**Tempo:** 1 hora

---

### 3. SEGURANÇA - Sem Validação de Entrada

**ID:** SEC-003  
**Severidade:** 🔴 CRÍTICO  
**Arquivo:** Todas as APIs futuras

**Problema:**
Não há validação de dados de entrada em nenhum lugar.

**Impacto:**

- Injeção SQL
- XSS attacks
- Dados corrompidos

**Solução:**
Implementar Zod em todas as rotas:

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export async function POST(req: Request) {
  const data = createUserSchema.parse(await req.json());
  // ...
}
```

**Tempo:** 4 horas (implementação em todas as rotas)

---

### 4. SEGURANÇA - Row Level Security Não Configurado

**ID:** SEC-004  
**Severidade:** 🔴 CRÍTICO  
**Arquivo:** Supabase (não em código)

**Problema:**
RLS não está ativado nas tabelas do Supabase.

**Impacto:**

- Todos os usuários veem todos os dados
- Violação de privacidade multi-tenant
- Não conformidade com LGPD/GDPR

**Solução:**

1. Ativar RLS em todas as tabelas
2. Criar policies por role
3. Testar acesso

Exemplo de policy:

```sql
CREATE POLICY "Users can see own data"
ON users
FOR SELECT
USING (auth.uid() = id);
```

**Tempo:** 3 horas

---

### 5. SEGURANÇA - Sem CSRF Protection

**ID:** SEC-005  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Formulários não têm proteção contra CSRF.

**Impacto:**

- Requisições maliciosas podem ser executadas
- Usuários podem ser manipulados

**Solução:**
Usar middleware de CSRF no Next.js:

```typescript
// middleware.ts
const CSRF_TOKEN_NAME = 'csrf-token';

export async function middleware(req: NextRequest) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = req.headers.get('x-csrf-token');
    // Validar token
  }
}
```

**Tempo:** 2 horas

---

### 6. SEGURANÇA - Headers de Segurança Faltando

**ID:** SEC-006  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Nenhum header de segurança configurado.

**Impacto:**

- Vulnerabilidades exploráveis
- Clickjacking
- XSS

**Solução:**
Adicionar em `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        }
      ],
    },
  ]
}
```

**Tempo:** 1 hora

---

### 7. SEGURANÇA - Sem Rate Limiting

**ID:** SEC-007  
**Severidade:** 🔴 CRÍTICO

**Problema:**
APIs sem proteção contra brute force.

**Impacto:**

- Ataques de força bruta
- DDoS

**Solução:**
Implementar rate limiting:

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for');
  const { success } = await ratelimit.limit(ip);
  if (!success) return new Response('Too Many Requests', { status: 429 });
}
```

**Tempo:** 2 horas

---

### 8. FUNCIONALIDADE - Sem Logout Implementado

**ID:** FUNC-001  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Não há função de logout.

**Impacto:**

- Usuários não podem se desconectar
- Sessões abertas indefinidamente
- Risco de segurança

**Solução:**
Criar rota de logout:

```typescript
// app/api/auth/logout/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export async function POST() {
  const supabase = createRouteHandlerClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
```

**Tempo:** 1 hora

---

### 9. FUNCIONALIDADE - Sem Email Verification

**ID:** FUNC-002  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Registro de usuários sem verificação de email.

**Impacto:**

- Emails inválidos no banco
- Impossível contatar usuários
- Abuso de conta

**Solução:**
Implementar verificação de email no Supabase e criar página de confirmação.

**Tempo:** 3 horas

---

### 10. FUNCIONALIDADE - Autenticação de Rota do Backend Ausente

**ID:** FUNC-003  
**Severidade:** 🔴 CRÍTICO

**Problema:**
APIs não validam autenticação.

**Impacto:**

- Acesso não autorizado
- Vazamento de dados

**Solução:**
Criar middleware de autenticação:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function requireAuth() {
  const supabase = createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
```

**Tempo:** 2 horas

---

### 11. DATABASE - Schema Inexistente

**ID:** DB-001  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Nenhuma tabela criada no Supabase.

**Impacto:**

- Impossível armazenar dados
- Aplicação não funciona

**Solução:**
Criar migrations SQL para:

- organizations
- clinics
- companies
- users
- employees
- roles
- assessments
- reports

**Tempo:** 4-6 horas

---

### 12. DEPENDÊNCIAS - Tailwind Não Instalado

**ID:** DEP-001  
**Severidade:** 🔴 CRÍTICO

**Problema:**
`package.json` menciona Tailwind mas não está instalado.

**Impacto:**

- Estilos não funcionam
- Build falha
- UI quebrada

**Solução:**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Tempo:** 30 minutos

---

### 13. DEPENDÊNCIAS - UI Components Faltando

**ID:** DEP-002  
**Severidade:** 🔴 CRÍTICO

**Problema:**
shadcn/ui não está instalado.

**Impacto:**

- Componentes de UI não funcionam
- Precisa criar tudo do zero

**Solução:**

```bash
npm install shadcn-ui
npx shadcn-ui@latest init
```

**Tempo:** 1 hora

---

### 14. DEPENDÊNCIAS - Validação Ausente

**ID:** DEP-003  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Zod não está instalado.

**Impacto:**

- Impossível validar dados
- Bugs e segurança comprometida

**Solução:**

```bash
npm install zod @hookform/react-hook-form
```

**Tempo:** 30 minutos

---

### 15. ENVIRONMENT - Variáveis Incompletas

**ID:** ENV-001  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Variáveis de ambiente não estão completas.

**Impacto:**

- Aplicação falha em produção
- Integração com serviços não funciona

**Solução:**
Adicionar a `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (apenas em CI/CD)
NEXT_PUBLIC_APP_URL=...
NODE_ENV=development
```

**Tempo:** 1 hora

---

### 16. ARQUITETURA - Sem Padrão de Componentes

**ID:** ARCH-001  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Não há estrutura de componentes reutilizáveis.

**Impacto:**

- Código duplicado
- Difícil manter
- Inconsistência visual

**Solução:**
Criar componentes base em `components/ui/`.

**Tempo:** 5-8 horas

---

### 17. DEPLOYMENT - Vercel Sem Secrets

**ID:** DEPLOY-001  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Variáveis secretas não configuradas em Vercel.

**Impacto:**

- Deploy falha
- Aplicação não funciona em produção

**Solução:**
Adicionar em Project Settings > Environment Variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (para APIs serverless)

**Tempo:** 30 minutos

---

### 18. TESTING - Sem Estrutura de Testes

**ID:** TEST-001  
**Severidade:** 🔴 CRÍTICO

**Problema:**
Nenhuma estrutura de testes implementada.

**Impacto:**

- Regressões não detectadas
- Qualidade comprometida
- Confiança baixa

**Solução:**
Configurar Vitest:

```bash
npm install -D vitest @testing-library/react msw
```

**Tempo:** 3-5 horas (para setup básico)

---

## RESUMO DE AÇÕES IMEDIATAS

| Problema               | Tempo | Prioridade |
| ---------------------- | ----- | ---------- |
| SEC-001: Middleware    | 30min | 🔴 NOW     |
| SEC-002: Service Key   | 1h    | 🔴 NOW     |
| SEC-003: Validação     | 4h    | 🔴 TODAY   |
| SEC-004: RLS           | 3h    | 🔴 TODAY   |
| SEC-005: CSRF          | 2h    | 🔴 TODAY   |
| SEC-006: Headers       | 1h    | 🔴 TODAY   |
| SEC-007: Rate Limit    | 2h    | 🔴 TODAY   |
| FUNC-001: Logout       | 1h    | 🔴 NOW     |
| FUNC-002: Email Verify | 3h    | 🔴 TODAY   |
| FUNC-003: Auth API     | 2h    | 🔴 TODAY   |
| DB-001: Schema         | 4-6h  | 🔴 TODAY   |
| DEP-001-003: Deps      | 2h    | 🔴 NOW     |
| ENV-001: Variables     | 1h    | 🔴 NOW     |
| ARCH-001: Padrão       | 5-8h  | 🟠 ASAP    |
| DEPLOY-001: Secrets    | 30min | 🟠 ASAP    |
| TEST-001: Testes       | 3-5h  | 🟠 ASAP    |

**TOTAL:** 35-50 horas de trabalho imediato

---

## PRÓXIMOS PASSOS

1. ✅ Ler este documento
2. ⚠️ **AGORA:** Corrigir SEC-001, SEC-002, DEP-001-003, ENV-001, FUNC-001
3. ⚠️ **HOJE:** Corrigir todos os problemas críticos de segurança
4. ⚠️ **AMANHÃ:** Criar schema de database
5. ⚠️ **SEMANA 1:** Implementar autenticação completa

---

**Documento gerado:** Junho de 2026  
**Responsabilidade:** Time de desenvolvimento
