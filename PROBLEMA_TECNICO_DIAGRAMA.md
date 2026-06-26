# Diagrama Técnico: Problema de Autenticação e Middleware

## VISÃO GERAL DA ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (Cliente)                  │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  app/auth/login/page.tsx                           │    │
│  │  ('use client')                                    │    │
│  │                                                    │    │
│  │  handleSubmit() {                                  │    │
│  │    await fetch('/api/auth/signin', {...})         │    │
│  │    if (success) router.push('/dashboard')          │    │
│  │  }                                                 │    │
│  └────────────────────────────────────────────────────┘    │
│           ↓                                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cookies (LocalStorage / IndexedDB)                │    │
│  │                                                    │    │
│  │  ✅ sb-xxxxx-auth-token (SALVO AQUI após login)   │    │
│  └────────────────────────────────────────────────────┘    │
│           ↓                                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Navigation (router.push('/dashboard'))            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
             ↓ (Request com Cookies)
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Next.js)                       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  middleware.ts                                     │    │
│  │                                                    │    │
│  │  createMiddlewareClient({ req, res })             │    │
│  │    └─> LÊ cookies do REQUEST                      │    │
│  │        ├─ sb-xxxxx-auth-token ✅ (DEVE ESTAR)     │    │
│  │        └─> Autentica a sessão                     │    │
│  │                                                    │    │
│  │  if (!session) redirect('/auth/login')            │    │
│  │  else allow request                               │    │
│  └────────────────────────────────────────────────────┘    │
│           ↓                                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  app/dashboard/page.tsx                            │    │
│  │  (Server Component)                                │    │
│  │                                                    │    │
│  │  ✅ Renderiza com access ao user autenticado       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
             ↓ (Response com conteúdo)
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR Novamente                    │
│  ✅ Exibe /dashboard                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## FLUXO ATUAL (PROBLEMÁTICO) - PASSO A PASSO

```
t=0ms     ┌─────────────────────────────────┐
          │ 1. Usuário clica "Entrar"       │
          │    Email: user@example.com      │
          │    Password: senha123           │
          └─────────────────────────────────┘
                      ↓
t=5ms     ┌─────────────────────────────────┐
          │ 2. JavaScript executa:          │
          │    const { data, error } =      │
          │      await authClient.signIn()  │
          │                                 │
          │    authClient usa              │
          │    lib/supabase/auth.ts        │
          │    (createClient() - CLIENT)   │
          └─────────────────────────────────┘
                      ↓
t=10ms    ┌─────────────────────────────────┐
          │ 3. Supabase responde            │
          │    session: {                   │
          │      access_token: "...",       │
          │      user: {...}                │
          │    }                            │
          │                                 │
          │ ⚠️ Cookies são salvos           │
          │    ASSINCRONAMENTE no browser   │
          │    (setTimeout dentro do SDK)   │
          └─────────────────────────────────┘
                      ↓
t=12ms    ┌─────────────────────────────────┐
          │ 4. JavaScript continua:         │
          │    if (data?.session) {         │
          │      router.push(               │
          │        '/dashboard'             │
          │      )  ❌ TOO FAST!            │
          │    }                            │
          │                                 │
          │ ❌ NÃO AGUARDA cookies serem    │
          │    salvos!                      │
          └─────────────────────────────────┘
                      ↓
t=15ms    ┌─────────────────────────────────┐
          │ 5. Browser inicia navegação     │
          │    GET /dashboard               │
          │                                 │
          │ Headers:                        │
          │   Cookie: ❌ (vazio!)           │
          │   (cookies ainda estão sendo    │
          │    salvos pelo Supabase SDK)    │
          └─────────────────────────────────┘
                      ↓
t=20ms    ┌─────────────────────────────────┐
          │ 6. Servidor recebe requisição   │
          │    middleware.ts executa        │
          │                                 │
          │    createMiddlewareClient()     │
          │      └─> Lê cookies do req      │
          │          ❌ VAZIO! (não foram   │
          │             salvos ainda)       │
          │                                 │
          │      └─> getSession()           │
          │          ❌ session = null      │
          │                                 │
          │    if (!session)                │
          │      redirect('/auth/login')    │
          └─────────────────────────────────┘
                      ↓
t=25ms    ┌─────────────────────────────────┐
          │ 7. Browser salva cookies        │
          │    (Supabase SDK finalmente)    │
          │                                 │
          │    localStorage:                │
          │      sb-xxxxx-auth-token: "..."│
          │                                 │
          │ ⚠️ MAS JÁ É TARDE! Servidor     │
          │    já respondeu com redirect    │
          └─────────────────────────────────┘
                      ↓
t=30ms    ┌─────────────────────────────────┐
          │ 8. Browser redireciona para     │
          │    /auth/login (conforme        │
          │    resposta do servidor)        │
          │                                 │
          │ ❌ RESULTADO: VOLTAR PARA       │
          │    LOGIN!                       │
          │                                 │
          │ ❌ LOOP INFINITO POSSÍVEL       │
          │    Se usuário clicar "Entrar"   │
          │    novamente, repete o fluxo    │
          └─────────────────────────────────┘
```

**Problema Core:**

```
┌─────────────────────────────────────────┐
│ RACE CONDITION                          │
├─────────────────────────────────────────┤
│ Task A: router.push() (Síncrono)        │
│         ├─ t=12ms: Inicia              │
│         └─ t=15ms: Cookies ainda vazios│
│                                         │
│ Task B: Supabase save cookies (Async)   │
│         ├─ t=15ms: Em progresso        │
│         ├─ t=20ms: Ainda salvando      │
│         └─ t=25ms: Finalmente salvo    │
│                                         │
│ ❌ Task A executa ANTES de Task B       │
│    terminar!                            │
└─────────────────────────────────────────┘
```

---

## FLUXO NOVO (CORRETO) - PASSO A PASSO

```
t=0ms     ┌─────────────────────────────────┐
          │ 1. Usuário clica "Entrar"       │
          │    Email: user@example.com      │
          │    Password: senha123           │
          └─────────────────────────────────┘
                      ↓
t=5ms     ┌─────────────────────────────────┐
          │ 2. JavaScript executa:          │
          │    fetch('/api/auth/signin', {  │
          │      method: 'POST',            │
          │      body: JSON.stringify({     │
          │        email,                   │
          │        password                 │
          │      })                         │
          │    })                           │
          │                                 │
          │ ✅ REQUISIÇÃO PARA SERVIDOR     │
          │    (não faz signin no cliente)  │
          └─────────────────────────────────┘
                      ↓
t=10ms    ┌─────────────────────────────────┐
          │ 3. Servidor recebe POST         │
          │    /api/auth/signin/route.ts    │
          │                                 │
          │    createClient() [SERVER]      │
          │      └─> Cria Supabase client   │
          │          com cookie handling    │
          │          do servidor            │
          │                                 │
          │    supabase.auth                │
          │      .signInWithPassword()      │
          └─────────────────────────────────┘
                      ↓
t=15ms    ┌─────────────────────────────────┐
          │ 4. Supabase responde ao servidor│
          │    session: {                   │
          │      access_token: "...",       │
          │      user: {...}                │
          │    }                            │
          │                                 │
          │ ✅ Cookies SALVOS no cookieStore│
          │    (do servidor, sincronamente) │
          │                                 │
          │    cookieStore.set(             │
          │      'sb-xxxxx-auth-token',     │
          │      '{...}',                   │
          │      options                    │
          │    )                            │
          └─────────────────────────────────┘
                      ↓
t=20ms    ┌─────────────────────────────────┐
          │ 5. Servidor cria Response       │
          │    JSON.stringify({             │
          │      success: true,             │
          │      session: {...}             │
          │    })                           │
          │                                 │
          │ ✅ HEADERS DA RESPOSTA:         │
          │    Set-Cookie: sb-xxxxx...      │
          │      Path=/;                    │
          │      Secure;                    │
          │      HttpOnly;                  │
          │      Max-Age=3600               │
          │                                 │
          │ ✅ COOKIES ESTÃO SENDO ENVIADOS│
          │    AO NAVEGADOR AGORA!         │
          └─────────────────────────────────┘
                      ↓
t=25ms    ┌─────────────────────────────────┐
          │ 6. Browser recebe Response      │
          │    {                            │
          │      success: true,             │
          │      session: {...}             │
          │    }                            │
          │                                 │
          │ ✅ Browser salva Set-Cookie     │
          │    headers automaticamente      │
          │                                 │
          │ ✅ Cookies NOW saved:           │
          │    sb-xxxxx-auth-token         │
          │                                 │
          │ ✅ JavaScript continua:         │
          │    if (data.success) {          │
          │      router.push(               │
          │        '/dashboard'             │
          │      )  ✅ SEGURO AGORA!        │
          │    }                            │
          └─────────────────────────────────┘
                      ↓
t=30ms    ┌─────────────────────────────────┐
          │ 7. Browser inicia navegação     │
          │    GET /dashboard               │
          │                                 │
          │ Headers:                        │
          │   Cookie: sb-xxxxx-auth...      │
          │   ✅ (COOKIES AGORA PRESENTES!)│
          └─────────────────────────────────┘
                      ↓
t=35ms    ┌─────────────────────────────────┐
          │ 8. Servidor recebe requisição   │
          │    middleware.ts executa        │
          │                                 │
          │    createMiddlewareClient()     │
          │      └─> Lê cookies do req      │
          │          ✅ sb-xxxxx... FOUND!  │
          │                                 │
          │      └─> getSession()           │
          │          ✅ session = {...}     │
          │          ✅ user: {...}         │
          │                                 │
          │    if (session)                 │
          │      allow request              │
          │      (não redireciona)          │
          └─────────────────────────────────┘
                      ↓
t=40ms    ┌─────────────────────────────────┐
          │ 9. Servidor renderiza           │
          │    app/dashboard/page.tsx       │
          │                                 │
          │    (Server Component)           │
          │    ✅ Acesso ao user            │
          │    ✅ Acesso aos dados          │
          │    ✅ Sem redirecionar          │
          └─────────────────────────────────┘
                      ↓
t=45ms    ┌─────────────────────────────────┐
          │ 10. Browser recebe HTML         │
          │     renderizado com dados       │
          │                                 │
          │ ✅ RESULTADO: DASHBOARD EXIBE! │
          │ ✅ URL permanece em /dashboard │
          │ ✅ SEM redirects                │
          │ ✅ SEM loops infinitos          │
          └─────────────────────────────────┘
```

**Problema Resolvido:**

```
┌──────────────────────────────────────────┐
│ SEM RACE CONDITION AGORA                 │
├──────────────────────────────────────────┤
│ Task A: fetch('/api/auth/signin')        │
│         ├─ t=5ms: Inicia                 │
│         ├─ t=20ms: Aguarda response      │
│         ├─ t=25ms: Recebe cookies        │
│         └─ t=25ms: Cookies salvos        │
│                                          │
│ Task B: router.push() (após Task A)      │
│         ├─ t=25ms: SÓ DEPOIS de A        │
│         └─ t=30ms: Cookies já salvos ✅  │
│                                          │
│ ✅ Task B executa DEPOIS de Task A       │
│    terminar!                             │
└──────────────────────────────────────────┘
```

---

## COMPARAÇÃO: Cliente vs Servidor signIn

### ❌ CLIENT-SIDE signIn (Atual - Quebrado)

```typescript
// lib/supabase/auth.ts
const supabase = createClient(url, anonKey); // Browser client

export const signIn = async (email: string, password: string) => {
  // ❌ Problema: signIn em client
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // ❌ Problema: Cookies salvos ASSINCRONAMENTE
  //    (dentro de setTimeout do SDK)

  // ❌ Problema: router.push() executa ANTES de cookies salvos
  return { data, error };
};

// app/auth/login/page.tsx
const { data, error } = await authClient.signIn(email, password);
if (data?.session) {
  router.push('/dashboard'); // ❌ TOO FAST!
}
```

**Timeline:**

```
signIn()        → session recebida (async)
router.push()   → executa IMEDIATAMENTE (sync)
Cookie save     → acontece DEPOIS (async)
Middleware      → vê cookies VAZIOS

❌ ORDEM ERRADA!
```

### ✅ SERVER-SIDE signIn (Novo - Correto)

```typescript
// app/api/auth/signin/route.ts
export async function POST(req: Request) {
  const supabase = await createClient(); // Server client

  // ✅ signIn no servidor
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // ✅ Cookies salvos SINCRONAMENTE no cookieStore
  // ✅ Set-Cookie headers adicionados à Response

  return Response.json(
    { success: true, session: data.session },
    { status: 200 }
    // ✅ Cookies enviados via Set-Cookie headers
  );
}

// app/auth/login/page.tsx
const response = await fetch('/api/auth/signin', { POST });
if (response.ok) {
  const data = await response.json();
  router.push('/dashboard'); // ✅ SAFE NOW!
}
```

**Timeline:**

```
fetch(/api/auth/signin)
  ├─ Server: signIn() → session
  ├─ Server: cookieStore.set() → cookies salvos
  ├─ Server: response.json() → Response com Set-Cookie
Browser recebe Response com Set-Cookie headers
Browser salva cookies automaticamente
router.push()    → executa DEPOIS
Middleware       → vê cookies ✅

✅ ORDEM CORRETA!
```

---

## ARQUITETURA SUPABASE - Cliente vs Servidor

### Fluxo Cliente (❌ Não funciona bem com middleware)

```
┌──────────────┐
│   Browser    │
└──────────────┘
       ↓
┌──────────────────────────────────┐
│ createClient() [Browser]         │
│                                  │
│ const supabase = createClient(    │
│   NEXT_PUBLIC_SUPABASE_URL,       │
│   NEXT_PUBLIC_SUPABASE_ANON_KEY   │
│ );                               │
│                                  │
│ ❌ PROBLEMA:                     │
│  Não tem acesso aos cookies do   │
│  servidor/request!               │
│  Cookies salvos ASSINCRONAMENTE  │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ supabase.auth.signInWithPassword()│
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ Session retornada                │
│ Cookies salvos no localStorage   │
│ (setTimeout ~100ms depois)        │
└──────────────────────────────────┘
       ↓
❌ router.push() (race condition!)
```

### Fluxo Servidor (✅ Funciona com middleware)

```
┌──────────────┐
│   Browser    │
└──────────────┘
       ↓ (fetch POST)
┌──────────────────────────────────┐
│ API Route: /api/auth/signin       │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ createClient() [Server]          │
│                                  │
│ export async function createClient|
│   const cookieStore = cookies()  │
│   return createServerClient(     │
│     URL, ANONKEY, {              │
│       cookies: {                 │
│         get(name) {              │
│           return cookieStore     │
│             .get(name)?.value    │
│         },                        │
│         set(name, value, opts) {│
│           cookieStore.set(       │
│             name, value, opts    │
│           )  ← ANTES de Response │
│         }                         │
│       }                           │
│     }                             │
│   )                              │
│                                  │
│ ✅ VANTAGEM:                     │
│  Acesso aos cookies do servidor  │
│  Cookies salvos SINCRONAMENTE    │
│  ANTES da Response ser enviada    │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ supabase.auth.signInWithPassword()│
│ (no servidor!)                   │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ Response.json({...})             │
│ + Set-Cookie headers             │
│ (cookies já salvos em cookieStore)│
└──────────────────────────────────┘
       ↓ (volta ao browser)
┌──────────────────────────────────┐
│ Browser recebe Response          │
│ Processa Set-Cookie headers      │
│ Salva cookies automaticamente     │
└──────────────────────────────────┘
       ↓
✅ router.push() (agora seguro!)
```

---

## MIDDLEWARE: Como Funciona

```
┌─────────────────────────────────────────────────────────┐
│ Browser Request                                         │
│ GET /dashboard                                          │
│ Headers:                                                │
│   Cookie: sb-xxxxx-auth-token=...;                      │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ middleware.ts (executa para CADA requisição)            │
│                                                         │
│ export async function middleware(req: NextRequest) {   │
│   const res = NextResponse.next()                       │
│   const supabase =                                      │
│     createMiddlewareClient({ req, res })                │
│                                                         │
│   // ✅ Lê cookies do REQUEST                           │
│   // ✅ Procura por sb-xxxxx-auth-token                 │
│                                                         │
│   const { data: { session } } =                         │
│     await supabase.auth.getSession()                    │
│                                                         │
│   if (!session &&                                       │
│       req.nextUrl.pathname.startsWith('/dashboard')) {  │
│     // ❌ Sem session: redireciona                      │
│     return NextResponse.redirect(                       │
│       new URL('/auth/login', req.url)                   │
│     )                                                   │
│   }                                                     │
│                                                         │
│   return res  // ✅ Com session: permite                │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Se session = null: Redireciona para /auth/login         │
│ Se session = {...}: Permite acesso a /dashboard         │
└─────────────────────────────────────────────────────────┘
```

**O que middleware precisa para funcionar:**

```javascript
// ✅ NECESSÁRIO: Cookies no REQUEST
Headers: {
  Cookie: 'sb-xxxxx-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
}

// ✅ createMiddlewareClient lê esses cookies
// ✅ supabase.auth.getSession() encontra a sessão
// ✅ Middleware sabe que usuário está autenticado

// ❌ PROBLEMA ANTERIOR:
// Cookies não eram enviados pelo browser porque
// não foram salvos antes de router.push()
```

---

## RESUMO: ANTES vs DEPOIS

| Aspecto         | ANTES (❌ Quebrado)       | DEPOIS (✅ Correto)          |
| --------------- | ------------------------- | ---------------------------- |
| **Onde signIn** | Client (browser)          | Server (API route)           |
| **Cookie Save** | Async (setTimeout)        | Sync (antes de Response)     |
| **Timing**      | Race condition            | Ordem garantida              |
| **Set-Cookie**  | Não enviado pelo servidor | Enviado via Response headers |
| **Middleware**  | Vê cookies vazios         | Vê cookies salvos            |
| **Resultado**   | Redireciona para login    | Permite acesso               |
| **UX**          | Loop infinito             | Sucesso de primeira          |

---

## CÓDIGO COMPLETO: Implementação

### Arquivo 1: `/app/api/auth/signin/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { getErrorResponse } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json({ success: true, session: data.session }, { status: 200 });
  } catch (error) {
    return getErrorResponse(error);
  }
}
```

### Arquivo 2: `/app/api/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=callback', request.url));
}
```

### Arquivo 3: Atualizar `/app/auth/login/page.tsx`

(Veja AUDITORIA_MIDDLEWARE_COOKIES.md para código completo)

---

## PRÓXIMOS PASSOS

1. ✅ Entender o problema (race condition com cookies)
2. ✅ Entender a solução (server-side auth)
3. ⏳ Implementar os 3 arquivos (route.ts × 2, page.tsx)
4. ⏳ Testar manualmente
5. ⏳ Verificar cookies em DevTools
6. ⏳ Celebrar! 🎉
