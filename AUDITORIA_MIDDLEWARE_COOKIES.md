# AUDITORIA: Middleware + Cookies + Session Management

**Data:** 23 de Junho de 2026  
**Status:** CRÍTICO - Fluxo de autenticação quebrado  
**Severidade:** 🔴 CRÍTICO  
**Impacto:** Usuários não conseguem fazer login com redirect correto

---

## PROBLEMA RESUMIDO

O middleware **NÃO está vendo a session** após o `signIn()` no lado do cliente porque:

1. ❌ `lib/supabase/auth.ts` usa `createClient()` (client-side) que NÃO automaticamente salva cookies
2. ❌ `middleware.ts` usa `createMiddlewareClient()` que LÊ cookies, mas se não estão salvos, retorna `session: null`
3. ❌ **Falta um `/api/auth/callback` route** para processar o hash de autenticação após login
4. ❌ Cookies de sessão podem estar sendo salvos mas o middleware não consegue acessá-los corretamente
5. ❌ A página de login faz `router.push('/dashboard')` ANTES de cookies serem salvos no navegador

---

## DIAGNÓSTICO TÉCNICO DETALHADO

### 1. Fluxo Atual (QUEBRADO)

```
┌─────────────────────────────────────────────────────────────┐
│ Página de Login (Client)                                    │
│ app/auth/login/page.tsx                                     │
│                                                             │
│ 1. handleSubmit()                                           │
│    └─> await authClient.signIn(email, password)            │
│        └─> supabase.auth.signInWithPassword() [CLIENT]     │
│            └─> Retorna session: {...}                      │
│                                                             │
│ 2. if (data?.session)                                       │
│    └─> router.push('/dashboard')  ❌ TOO FAST!             │
│                                                             │
│ PROBLEMA: Cookies não foram salvos no navegador ainda!     │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│ Browser navega para /dashboard                              │
│                                                             │
│ middleware.ts executa:                                      │
│ const supabase = createMiddlewareClient({ req, res })       │
│ const { session } = await supabase.auth.getSession()        │
│                                                             │
│ ❌ RESULTADO: session === null                              │
│    Porque: middleware lê cookies do REQUEST                 │
│    Mas: cookies ainda não foram salvos pelo browser         │
│                                                             │
│ Ação: Redireciona para /auth/login                          │
└─────────────────────────────────────────────────────────────┘
           ↓
      LOOP INFINITO!
```

### 2. Ordem de Execução Problemática

**Timeline:**

```
t=0ms    signIn() chamado
t=10ms   Supabase retorna session
t=15ms   router.push('/dashboard') executado
t=20ms   Browser inicia navegação
t=50ms   Middleware executa (ANTES de cookies serem salvos!)
t=100ms  Browser salva cookies no localStorage
         ❌ Mas middleware já viu session=null!
```

### 3. Por que `createMiddlewareClient()` não vê os cookies?

**Supabase SSR Pattern:**

```typescript
// lib/supabase/server.ts (Correto para Server Components)
export async function createClient() {
  const cookieStore = await cookies(); // ✅ Acessa cookies do servidor

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options); // ✅ Salva ANTES de Response
        },
      },
    }
  );
}
```

**MAS `lib/supabase/auth.ts` (Cliente puro):**

```typescript
// lib/supabase/auth.ts (PROBLEM!)
const supabase = createClient(url, anonKey);

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // ❌ Cookies são salvos ASYNCRONAMENTE no navegador
  // ❌ router.push() executa ANTES dos cookies serem salvos
  return { data, error };
};
```

---

## SOLUÇÃO: 3 Passos Necessários

### PASSO 1: Criar `/api/auth/signin` endpoint (Server-side)

Este endpoint processa o login no servidor, garantindo que os cookies sejam salvos ANTES do redirect.

**Arquivo:** `app/api/auth/signin/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { getErrorResponse } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validação básica
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // ✅ Usar createClient() do servidor (com cookie handling correto)
    const supabase = await createClient();

    // Fazer signin
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return Response.json({ error: 'No session returned' }, { status: 401 });
    }

    // ✅ Cookies foram salvos automaticamente pelo createClient()
    // ✅ Response.json() retorna com Set-Cookie headers
    return Response.json({ success: true, session: data.session }, { status: 200 });
  } catch (error) {
    console.error('SignIn error:', error);
    return getErrorResponse(error);
  }
}
```

### PASSO 2: Atualizar página de login para usar novo endpoint

**Arquivo:** `app/auth/login/page.tsx` (MODIFICADO)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginSchema, type LoginInput } from '../../../lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const validation = loginSchema.parse(formData);

      // ✅ NOVO: Chamar API endpoint em vez de client-side signIn
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: validation.email,
          password: validation.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      const data = await response.json();

      if (data.success) {
        // ✅ Cookies já foram salvos pelo servidor!
        // ✅ Redirect é seguro agora
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            NexxoHub
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Gestão Psicossocial Corporativa
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Conectando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 block"
            >
              Esqueceu a senha?
            </Link>
            <div className="text-sm text-gray-600">
              Não tem conta?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Registre-se
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### PASSO 3: Criar `/api/auth/callback` para email verification

**Arquivo:** `app/api/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    // ✅ Exchange code para session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ✅ Cookies foram salvos, redirect para dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ❌ Erro na verificação, volta para login
  return NextResponse.redirect(new URL('/auth/login?error=callback', request.url));
}
```

### PASSO 4: Melhorar middleware.ts

**Arquivo:** `middleware.ts` (MELHORADO)

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ✅ Redirect unauthenticated users to login
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // ✅ Redirect authenticated users away from auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ✅ Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 🆕 Add CSP header (como recomendado na auditoria)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## ANTES vs DEPOIS

### ANTES (Quebrado)

```
Login Page (Client)
    ↓
signIn() [CLIENT] → Cookies salvos no navegador (async)
    ↓
router.push('/dashboard') [IMEDIATO]
    ↓
Middleware executa
    ↓
getSession() [LENDO COOKIES] ❌ Ainda não foram salvos!
    ↓
session = null
    ↓
Redireciona de volta para /auth/login
    ↓
LOOP INFINITO ❌
```

### DEPOIS (Correto)

```
Login Page (Client)
    ↓
fetch('/api/auth/signin', { POST })
    ↓
Server Endpoint
    ↓
createClient() [SERVER] + signInWithPassword()
    ↓
Cookies salvos pelo servidor (SET-COOKIE headers) ✅
    ↓
Response { success: true }
    ↓
router.push('/dashboard') [SEGURO AGORA]
    ↓
Middleware executa
    ↓
createMiddlewareClient() lê cookies
    ↓
getSession() ✅ ENCONTRA SESSION!
    ↓
Permite acesso a /dashboard
    ↓
SUCESSO ✅
```

---

## COMO DEBUGAR SE COOKIES ESTÃO SENDO SALVOS

### 1. Abrir DevTools

```bash
F12 ou Cmd+Option+I
```

### 2. Ir para "Application" > "Cookies"

Procurar por cookies com nome similar a:

- `sb-<project-id>-auth-token`
- `sb-<project-id>-auth-token.0`
- `sb-<project-id>-auth-token.1`

Ou qualquer cookie começando com `sb-`

### 3. Verificar após login

**ANTES (Quebrado):**

```
Cookies vazios ❌
Nenhum cookie com 'sb-' encontrado
```

**DEPOIS (Correto):**

```
✅ sb-xxxxx-auth-token
   Value: {"access_token":"...", "refresh_token":"..."}

✅ sb-xxxxx-auth-token.0 (particionado se > 4KB)
   Value: (parte 0 do token)
```

### 4. Ver Network tab durante login

**Com novo endpoint:**

```
POST /api/auth/signin
├─ Response Headers:
│  └─ Set-Cookie: sb-xxxxx-auth-token=...; Path=/; Secure; HttpOnly
│  └─ Set-Cookie: sb-xxxxx-auth-token.0=...; Path=/; Secure; HttpOnly
└─ Status: 200 OK ✅
```

### 5. Console check

```javascript
// Cole no console após login:
document.cookie;
// Resultado esperado:
// "sb-xxxxx-auth-token=...; sb-xxxxx-auth-token.0=..."
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar `app/api/auth/signin/route.ts`
- [ ] Atualizar `app/auth/login/page.tsx` para usar novo endpoint
- [ ] Criar `app/api/auth/callback/route.ts`
- [ ] Melhorar `middleware.ts` com CSP header
- [ ] Testar login no navegador
- [ ] Verificar cookies em DevTools > Application
- [ ] Testar redirect para /dashboard
- [ ] Testar que usuário autenticado não pode acessar /auth/\*
- [ ] Testar que usuário não autenticado não pode acessar /dashboard

---

## PROBLEMAS RELACIONADOS ENCONTRADOS

### ✅ Resolvido em `lib/supabase/server.ts`

- Cookies handler está correto para Server Components/API Routes

### ❌ Ainda Falta

- `/api/auth/callback` não existe
- `/api/auth/signin` não existe
- Login usa client-side `signIn()` sem aguardar cookie save

### ⚠️ Melhorias Adicionais Recomendadas

- Adicionar retry logic em `/api/auth/signin` para falhas de rede
- Implementar rate limiting em `/api/auth/signin` (prevent brute force)
- Adicionar logging detalhado de autenticação
- Testar fluxo em múltiplos navegadores

---

## TIMELINE DE IMPLEMENTAÇÃO

| Etapa     | Tarefa                     | Tempo       | Status |
| --------- | -------------------------- | ----------- | ------ |
| 1         | Criar `/api/auth/signin`   | 30 min      | TODO   |
| 2         | Criar `/api/auth/callback` | 15 min      | TODO   |
| 3         | Atualizar `login/page.tsx` | 20 min      | TODO   |
| 4         | Melhorar `middleware.ts`   | 10 min      | TODO   |
| 5         | Testes manuais + debugging | 30 min      | TODO   |
| **TOTAL** |                            | **1h45min** |        |

---

## REFERÊNCIAS

- Supabase Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers
- Next.js Middleware: https://nextjs.org/docs/advanced-features/middleware
- Cookie Handling in Next.js: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
