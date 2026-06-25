# Guia Prático: Testando Autenticação com Middleware

## TESTE 1: Verificar que Cookies Estão Sendo Salvos

### Passo 1: Abrir DevTools

```bash
# No navegador (Chrome/Firefox/Edge):
F12 (Windows)
Cmd + Option + I (Mac)
```

### Passo 2: Ir para Application > Cookies

```
DevTools
├─ Application (ou Storage)
├─ Cookies
└─ https://seu-dominio.com
    ├─ sb-xxxxx-auth-token
    ├─ sb-xxxxx-auth-token.0
    └─ ... (outros cookies)
```

### Passo 3: Fazer Login e Observar

**Antes do login:**
```
Cookies vazios
❌ Nenhum cookie com "sb-" encontrado
```

**Após login bem-sucedido:**
```
✅ sb-xxxxx-auth-token
   Name: sb-xxxxx-auth-token
   Value: {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", ...}
   Domain: seu-dominio.com
   Path: /
   Expires: em 24 horas (aproximadamente)
   HttpOnly: ✅ (não acessível via JS, proteção contra XSS)
   Secure: ✅ (só enviado via HTTPS)
   SameSite: Lax
```

### Passo 4: Verificar Network Tab

Abra a aba "Network" (próxima a "Elements/Inspector"):

```
1. Fazer login
2. Procurar pela requisição POST para /api/auth/signin
3. Clicar nela e ir para "Response Headers"
4. Procurar por:

   Set-Cookie: sb-xxxxx-auth-token=...; Path=/; Secure; HttpOnly
   Set-Cookie: sb-xxxxx-auth-token.0=...; Path=/; Secure; HttpOnly
   
   ✅ Se ver isso, cookies foram enviados pelo servidor!
   ❌ Se não ver, há problema no endpoint
```

---

## TESTE 2: Verificar Middleware Está Vendo Session

### Passo 1: Console Check

Abra a aba Console (DevTools):

```javascript
// Cole isso após fazer login:
console.log('Cookies:', document.cookie);

// Resultado esperado:
// "sb-xxxxx-auth-token=...; sb-xxxxx-auth-token.0=..."

// Se aparecer vazio ❌:
// Cookies não foram salvos!
```

### Passo 2: Fazer Requisição para /dashboard

Após login, tente navegar para `https://seu-dominio.com/dashboard`

**✅ Sucesso:**
```
- Página carrega normalmente
- URL permanece em /dashboard
- Você vê o conteúdo do dashboard
- Middleware PERMITIU a requisição
```

**❌ Falha:**
```
- URL redireciona para /auth/login
- Middleware BLOQUEOU a requisição
- Problema: Session não foi encontrada
- Causa provável: Cookies não foram salvos
```

### Passo 3: Ver Logs do Middleware

Se usar Vercel, Netlify ou node dev:

```bash
npm run dev
```

Procure nos logs por:

```
[middleware] GET /dashboard
  - Session found: ✅
  - User ID: xxxxx-xxxxx-xxxxx
  - Redirecting: No
  
  OU

[middleware] GET /dashboard
  - Session found: ❌ (null)
  - Redirecting: /auth/login
```

---

## TESTE 3: Teste de Fluxo Completo

### Cenário 1: Login → Dashboard

```bash
1. Acesse: https://seu-dominio.com/auth/login
2. Preencha credenciais válidas
3. Clique "Entrar"
4. Aguarde resposta
5. ESPERADO:
   ✅ Redirecionado para /dashboard
   ✅ Vê conteúdo da dashboard
   ✅ Cookies salvos em DevTools
```

### Cenário 2: Logout → Login

```bash
1. Clique "Sair" na dashboard
2. ESPERADO:
   ✅ Redirecionado para /auth/login
   ✅ Cookies apagados
3. Faça login novamente
4. ESPERADO:
   ✅ Acesso concedido
   ✅ Novos cookies gerados
```

### Cenário 3: Acesso Direto sem Login

```bash
1. Abra guia anônima / incógnito
2. Acesse: https://seu-dominio.com/dashboard
3. SEM fazer login
4. ESPERADO:
   ✅ Redirecionado para /auth/login
   ✅ Nenhum cookie encontrado
```

### Cenário 4: Usuário Autenticado Acessa /auth/login

```bash
1. Faça login normalmente
2. Acesse: https://seu-dominio.com/auth/login
3. ESPERADO:
   ✅ Redirecionado para /dashboard
   (middleware redireciona usuários autenticados para fora das páginas auth)
```

---

## TESTE 4: Debug com Fetch API

Cole no Console (DevTools) ANTES de fazer login:

```javascript
// Simular o login via API
const loginResponse = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'seu@email.com',
    password: 'sua-senha',
  }),
});

console.log('Status:', loginResponse.status);  // Deve ser 200
console.log('Headers:', loginResponse.headers.get('set-cookie'));  // Cookies?
const data = await loginResponse.json();
console.log('Response:', data);  // { success: true, session: {...} }

// Agora verificar cookies
console.log('Cookies após login:', document.cookie);
```

**Saída esperada:**
```javascript
Status: 200
Headers: sb-xxxxx-auth-token=...; Path=/; Secure; HttpOnly
Response: {
  success: true,
  session: {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "...",
    user: { ... }
  }
}
Cookies após login: "sb-xxxxx-auth-token=..."
```

---

## TESTE 5: Verificar Middleware Middleware.ts

### Ativar Debug Logging

Abra `middleware.ts` e adicione:

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

  // 🆕 DEBUG LOGGING
  console.log('[middleware]', {
    pathname: req.nextUrl.pathname,
    sessionExists: !!session,
    userId: session?.user?.id || 'null',
    timestamp: new Date().toISOString(),
  });

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('[middleware] REDIRECT: /auth/login (no session)');
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    console.log('[middleware] REDIRECT: /dashboard (has session)');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Executar com Dev Server

```bash
npm run dev
```

Observe os logs no terminal:

```
[middleware] {
  pathname: '/auth/login',
  sessionExists: false,
  userId: 'null',
  timestamp: '2026-06-23T10:30:45.123Z'
}

// Após login:

[middleware] {
  pathname: '/dashboard',
  sessionExists: true,
  userId: 'uuid-da-sessao-aqui',
  timestamp: '2026-06-23T10:30:50.456Z'
}
```

---

## TESTE 6: Verificar Endpoint /api/auth/signin

### Via cURL

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"sua-senha"}'

# Resposta esperada:
# {
#   "success": true,
#   "session": {
#     "access_token": "...",
#     "user": {...}
#   }
# }

# Com status 200 e headers:
# Set-Cookie: sb-xxxxx-auth-token=...; Path=/; Secure; HttpOnly
```

### Via Postman/Thunder Client

```
POST http://localhost:3000/api/auth/signin
Headers:
  Content-Type: application/json

Body:
{
  "email": "seu@email.com",
  "password": "sua-senha"
}

Response:
{
  "success": true,
  "session": {...}
}

Cookies aparecem em:
Postman > Response Headers > Set-Cookie
Thunder Client > Response > Cookies
```

---

## TESTE 7: Teste de Email Verification

### Fluxo Completo

```bash
1. Acesse: https://seu-dominio.com/auth/register
2. Registre nova conta
3. Clique "Enviar Email"
4. Verifique sua caixa de entrada
5. Clique no link do email
6. ESPERADO:
   ✅ Redireciona para /auth/callback?code=...
   ✅ Route processa o código
   ✅ Email verificado
   ✅ Redireciona para /dashboard ou /auth/login
```

### Verificar Callback Behavior

DevTools > Network:

```
GET /auth/callback?code=xxxxx
├─ Status: 307 (Temporary Redirect)
├─ Location: /dashboard (ou /auth/login em caso de erro)
└─ Set-Cookie: sb-xxxxx-auth-token=... ✅
```

---

## PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: "Cookies vazios após login"

**Causa:**
- Endpoint `/api/auth/signin` não existe
- Endpoint não retorna Set-Cookie headers
- Cliente não aguarda resposta

**Solução:**
```bash
1. Verificar se existe app/api/auth/signin/route.ts
2. Verificar logs: npm run dev
3. Testar endpoint diretamente: curl -X POST http://localhost:3000/api/auth/signin ...
4. Verificar Network tab nos DevTools durante login
```

### Problema 2: "Middleware redireciona de volta para /auth/login"

**Causa:**
- Cookies não foram salvos no navegador
- Middleware não consegue ler os cookies
- Session é null

**Solução:**
```javascript
// No console após "login":
console.log('Cookies:', document.cookie);
// Se vazio: Cookies não foram salvos!

// Verificar se Set-Cookie foi enviado:
// DevTools > Network > POST /api/auth/signin > Response Headers > Set-Cookie
```

### Problema 3: "Loop infinito entre /auth/login e /dashboard"

**Causa:**
- Client faz `router.push('/dashboard')` ANTES de cookies serem salvos
- Middleware vê session=null e redireciona de volta para /auth/login
- Client faz login novamente = loop

**Solução:**
- Usar novo endpoint `/api/auth/signin` (server-side)
- Aguardar response do servidor ANTES de redirect
- Servidor salva cookies ANTES de responder

### Problema 4: "HttpOnly cookies não aparecem no console"

**Causa:**
- Comportamento esperado! HttpOnly é proteção contra XSS
- Cookies existem (enviados ao servidor) mas JS não pode acessá-los

**Verificação:**
```bash
1. DevTools > Application > Cookies
2. Procurar por sb-xxxxx-auth-token
3. Se existe: Tudo bem! ✅
4. Se vazio: Problema real ❌
```

---

## CHECKLIST DE TESTES

- [ ] Test 1: Cookies salvos após login (DevTools > Application)
- [ ] Test 2: Middleware vê session (Dashboard carrega)
- [ ] Test 3: Fluxo login → dashboard funciona
- [ ] Test 4: Logout remove cookies
- [ ] Test 5: Usuário não autenticado não acessa /dashboard
- [ ] Test 6: Usuário autenticado não pode acessar /auth/login
- [ ] Test 7: Email verification funciona
- [ ] Test 8: Refresh página = mantém session
- [ ] Test 9: Abrir em guia incógnita = sem session
- [ ] Test 10: Cookies aparecem em Network tab com Set-Cookie headers

---

## ENVIRONMENT ESPECÍFICOS

### Desenvolvimento Local (localhost:3000)

```bash
npm run dev

Cookies: HttpOnly + Secure (se em HTTPS)
Middleware Logs: Aparecem no terminal
Network Tab: Mostra Set-Cookie headers
```

### Staging/Preview

```bash
Verificar NEXT_PUBLIC_APP_URL no .env
Cookies: Podem ser Secure=false se não for HTTPS
Test: Acesse via link de preview
```

### Production (Vercel/Netlify)

```bash
Cookies: SEMPRE Secure=true + HttpOnly
HTTPS: Obrigatório
Logs: Vercel Logs ou Netlify Analytics
Debug: Use console.error() para logs
```

---

## SCRIPT DE TESTE AUTOMATIZADO

Cole no Console (DevTools) para teste rápido:

```javascript
async function testAuth() {
  console.log('=== TESTE DE AUTENTICAÇÃO ===\n');
  
  // 1. Verificar cookies antes
  console.log('1. Cookies antes:', document.cookie || '(vazio)');
  
  // 2. Fazer login
  console.log('2. Tentando login...');
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'seu@email.com',
      password: 'sua-senha'
    }),
  });
  
  console.log('   Status:', response.status);
  console.log('   Cookies em Response Headers:', response.headers.get('set-cookie') || '(nenhum)');
  
  // 3. Verificar cookies depois
  console.log('3. Cookies depois:', document.cookie || '(vazio)');
  
  // 4. Fazer requisição para /dashboard
  console.log('4. Testando acesso a /dashboard...');
  const dashboardResponse = await fetch('/dashboard', { method: 'HEAD' });
  console.log('   Status:', dashboardResponse.status);
  console.log('   ' + (dashboardResponse.status === 200 ? '✅ Acesso permitido' : '❌ Acesso negado'));
  
  console.log('\n=== FIM DO TESTE ===');
}

// Executar:
// testAuth();
```

---

## REFERÊNCIAS E LINKS

- Supabase Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- NextJS Middleware: https://nextjs.org/docs/advanced-features/middleware  
- HTTP Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
- HttpOnly Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies

