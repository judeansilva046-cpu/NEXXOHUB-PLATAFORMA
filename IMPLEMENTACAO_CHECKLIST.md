# Checklist de Implementação: Middleware + Cookies Fix

**Objetivo:** Corrigir autenticação para que middleware veja a session após login  
**Tempo Estimado:** 1h45min  
**Critério de Sucesso:** Usuário faz login → redireciona para /dashboard → não volta para /auth/login

---

## FASE 1: Criar API Routes (30 min)

### Task 1.1: Criar `/app/api/auth/signin/route.ts`

**Arquivo:** `C:\Users\User\NEXXOHUB-PLATAFORMA\app\api\auth\signin\route.ts`

- [ ] Criar diretório `app/api/auth/signin/`
- [ ] Criar arquivo `route.ts` nesse diretório
- [ ] Adicionar código (veja abaixo)
- [ ] Salvar arquivo

**Código:**

```typescript
import { createClient } from '@/lib/supabase/server';
import { getErrorResponse } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validação
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // ✅ Usar server client
    const supabase = await createClient();

    // ✅ SignIn no servidor
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

    // ✅ Cookies já foram salvos pelo createClient()
    // ✅ Response tem Set-Cookie headers automaticamente
    return Response.json({ success: true, session: data.session }, { status: 200 });
  } catch (error) {
    console.error('SignIn error:', error);
    return getErrorResponse(error);
  }
}
```

**Checklist:**

- [ ] Arquivo criado em `app/api/auth/signin/route.ts`
- [ ] Código copiado exatamente como mostrado
- [ ] Imports estão corretos
- [ ] Arquivo salvo sem erros

### Task 1.2: Criar `/app/api/auth/callback/route.ts`

**Arquivo:** `C:\Users\User\NEXXOHUB-PLATAFORMA\app\api\auth\callback\route.ts`

- [ ] Criar diretório `app/api/auth/callback/`
- [ ] Criar arquivo `route.ts` nesse diretório
- [ ] Adicionar código (veja abaixo)
- [ ] Salvar arquivo

**Código:**

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const supabase = await createClient();

      // ✅ Exchange código para sessão
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // ✅ Sucesso: redireciona para dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // ❌ Erro: redireciona para login com erro
    return NextResponse.redirect(new URL('/auth/login?error=callback', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=unexpected', request.url));
  }
}
```

**Checklist:**

- [ ] Arquivo criado em `app/api/auth/callback/route.ts`
- [ ] Código copiado exatamente como mostrado
- [ ] Imports estão corretos
- [ ] Arquivo salvo sem erros

---

## FASE 2: Atualizar Login Page (20 min)

### Task 2.1: Modificar `/app/auth/login/page.tsx`

**Arquivo:** `C:\Users\User\NEXXOHUB-PLATAFORMA\app\auth\login\page.tsx`

**O que fazer:**

- [ ] Abrir arquivo existente
- [ ] Substituir função `handleSubmit`
- [ ] NÃO remover o resto do arquivo

**Trocar DESTA parte:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
    const validation = loginSchema.parse(formData);
    const { data, error: authError } = await authClient.signIn(
      validation.email,
      validation.password
    );

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data?.session) {
      router.push('/dashboard');
    }
  } catch (err: any) {
    setError(err.message || 'Erro ao fazer login');
  } finally {
    setIsLoading(false);
  }
};
```

**PARA ESTA parte:**

```typescript
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
```

**Checklist:**

- [ ] Abri arquivo `/app/auth/login/page.tsx`
- [ ] Localizei a função `handleSubmit`
- [ ] Substituí apenas o conteúdo da função
- [ ] Mantive o resto do arquivo igual
- [ ] Arquivo salvo sem erros

---

## FASE 3: Melhorar Middleware (10 min)

### Task 3.1: Adicionar CSP Header em `middleware.ts`

**Arquivo:** `C:\Users\User\NEXXOHUB-PLATAFORMA\middleware.ts`

**O que fazer:**

- [ ] Abrir arquivo existente
- [ ] Encontrar seção de "Add security headers"
- [ ] Adicionar novo header (veja abaixo)

**Encontrar ESTA seção:**

```typescript
// Add security headers
const response = NextResponse.next();
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'SAMEORIGIN');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

return response;
```

**ADICIONAR ESTE header:**

```typescript
// Add security headers
const response = NextResponse.next();
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'SAMEORIGIN');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

// 🆕 Add Content Security Policy
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
);

return response;
```

**Checklist:**

- [ ] Abri arquivo `middleware.ts`
- [ ] Localizei a seção de security headers
- [ ] Adicionei o header CSP ANTES de `return response`
- [ ] Arquivo salvo sem erros

---

## FASE 4: Testes Manuais (45 min)

### Test 4.1: Teste Local - Ambiente de Desenvolvimento

**Pré-requisitos:**

- [ ] Terminal aberto
- [ ] Certificado SSL configurado (ou localhost funcionando)
- [ ] `.env.local` com variáveis Supabase corretas

**Executar:**

```bash
# Terminal 1: Iniciar dev server
npm run dev

# Aguardar mensagem:
# ▲ Next.js 15.5.19
# - Local: http://localhost:3000
```

**Checklist:**

- [ ] Dev server iniciado com sucesso
- [ ] Nenhum erro no console
- [ ] Acesso a http://localhost:3000 funciona

### Test 4.2: Testar Login

**Passo a passo:**

1. [ ] Abrir http://localhost:3000/auth/login
2. [ ] Abrir DevTools (F12)
3. [ ] Ir para "Network" tab
4. [ ] Preencher credenciais (conta de teste)
5. [ ] Clicar "Entrar"
6. [ ] Observar Network:
   - [ ] Deve ver requisição `POST /api/auth/signin`
   - [ ] Status deve ser `200`
   - [ ] Response Headers deve ter `Set-Cookie:`
7. [ ] Observar resultado:
   - [ ] Deve redirecionar para `/dashboard`
   - [ ] URL deve permanecer em `/dashboard` (sem redirecionar de volta)

**Se algo deu errado:**

- [ ] Verificar erro em Network tab > Response
- [ ] Verificar logs em `npm run dev` (terminal)
- [ ] Verificar `.env.local` tem variáveis corretas

### Test 4.3: Verificar Cookies Salvos

**No DevTools:**

1. [ ] Ainda com DevTools aberto
2. [ ] Ir para "Application" ou "Storage"
3. [ ] Clicar em "Cookies"
4. [ ] Selecionar domínio `localhost`
5. [ ] Procurar por cookies com "sb-" no nome
6. [ ] Deve ver algo como:
   - [ ] `sb-xxxxx-auth-token` (value com {"access_token":...})
   - [ ] `sb-xxxxx-auth-token.0` (se token > 4KB)

**Se não ver cookies:**

- [ ] Verificar Response Headers do POST (deve ter Set-Cookie)
- [ ] Limpar browser cache e tentar novamente
- [ ] Verificar se Supabase URL está correta em `.env.local`

### Test 4.4: Testar Middleware Bloqueando Sem Session

1. [ ] Abrir guia INCÓGNITA (nova)
2. [ ] Acessar http://localhost:3000/dashboard SEM fazer login
3. [ ] Esperado:
   - [ ] Redireciona IMEDIATAMENTE para `/auth/login`
   - [ ] Nenhuma página de dashboard visível
   - [ ] Cookies vazios

### Test 4.5: Testar Logout e Login Novamente

1. [ ] Na dashboard, clique "Logout" (ou botão de sair)
2. [ ] Esperado:
   - [ ] Redireciona para `/auth/login`
   - [ ] Cookies são removidos (vide DevTools)
3. [ ] Fazer login novamente
4. [ ] Esperado:
   - [ ] Mesmo fluxo funciona
   - [ ] Novos cookies gerados

### Test 4.6: Testar Email Verification (se aplicável)

1. [ ] Ir para `/auth/register`
2. [ ] Registrar nova conta
3. [ ] Verificar email
4. [ ] Clicar link no email (com código)
5. [ ] Esperado:
   - [ ] Redireciona para `/auth/callback?code=...`
   - [ ] Callback processa o código
   - [ ] Redireciona para `/dashboard` ou `/auth/login`
   - [ ] Email verificado

---

## FASE 5: Debugging (Se Necessário) (30 min)

### Debug 5.1: Se Teste Falhar - Verificar Logs

**Terminal (npm run dev):**

```
Procurar por linhas com:
- "SignIn error:"
- "[middleware]"
- "POST /api/auth/signin"

Se ver erro:
1. Copiar erro completo
2. Verificar se é erro de validação ou autenticação
3. Verificar .env.local tem valores corretos
```

### Debug 5.2: Se Cookies Não Salvos

**Checklist:**

- [ ] POST `/api/auth/signin` retorna 200?

  - Se não: Erro na autenticação (senha errada, etc)
  - Se sim: Continuar próxima verificação

- [ ] Response Headers tem `Set-Cookie`?

  - Se não: Problema em `createClient()` no servidor
  - Se sim: Continuar próxima verificação

- [ ] Browser salva cookies?
  - DevTools > Application > Cookies
  - Procurar por `sb-` cookies
  - Se não aparecer: Problema com HTTPS ou domínio

### Debug 5.3: Se Middleware Redireciona Errado

**Adicionar logging ao middleware.ts:**

```typescript
console.log('[middleware]', {
  pathname: req.nextUrl.pathname,
  sessionExists: !!session,
  userId: session?.user?.id || 'null',
});
```

**No console, procurar por:**

```
[middleware] {
  pathname: '/dashboard',
  sessionExists: true,    ← Deve ser true
  userId: 'uuid-here'
}
```

Se `sessionExists: false`:

- [ ] Cookies não foram salvos
- [ ] Voltar para Debug 5.2

---

## FASE 6: Verificação Final (10 min)

### Final 6.1: Checklist de Sucesso

- [ ] Criar conta funciona
- [ ] Email verification funciona (se habilitado)
- [ ] Login com email/password funciona
- [ ] Após login, redireciona para `/dashboard` SEM voltar
- [ ] Cookies são salvos e persistem
- [ ] Logout funciona e limpa cookies
- [ ] Usuário não autenticado não acessa `/dashboard`
- [ ] Usuário autenticado não pode acessar `/auth/login`
- [ ] Refresh página = mantém session
- [ ] Cookies aparecem em DevTools

### Final 6.2: Build para Produção

**Se tudo passar nos testes:**

```bash
# Testar build
npm run build

# Deve terminar sem erros
# Output esperado:
# ✓ compiled successfully
```

- [ ] Build executa sem erros
- [ ] Nenhuma TypeScript error
- [ ] Arquivo `.next/` criado

### Final 6.3: Deploy (Opcional)

```bash
# Se usar Vercel:
vercel

# Se usar Netlify:
netlify deploy

# Se usar outro: seguir instruções
```

- [ ] Deploy bem-sucedido
- [ ] Verificar em produção que autenticação funciona

---

## ROLLBACK (Se Necessário)

Se algo quebrou, reverter:

```bash
# Reverter mudanças em login/page.tsx
git checkout app/auth/login/page.tsx

# Reverter mudanças em middleware.ts
git checkout middleware.ts

# Remover novos arquivos
rm -rf app/api/auth/signin/
rm -rf app/api/auth/callback/

# Voltar ao estado anterior
git reset --hard
```

---

## TEMPO TOTAL

| Fase      | Tarefa               | Tempo       | Status      |
| --------- | -------------------- | ----------- | ----------- |
| 1         | Criar API Routes     | 30 min      | ⏳ TODO     |
| 2         | Atualizar Login Page | 20 min      | ⏳ TODO     |
| 3         | Melhorar Middleware  | 10 min      | ⏳ TODO     |
| 4         | Testes Manuais       | 45 min      | ⏳ TODO     |
| 5         | Debugging            | 20 min      | ⏳ OPCIONAL |
| 6         | Verificação Final    | 10 min      | ⏳ TODO     |
| **TOTAL** |                      | **1h45min** |             |

---

## PERGUNTAS FREQUENTES (FAQ)

### P: Posso fazer isso em produção?

**R:** Não. Teste primeiro localmente, depois em staging, depois em produção.

### P: Preciso limpar browser cache?

**R:** Se tiver problemas, sim. Ir para DevTools > Application > Clear Site Data.

### P: E se esqueci de salvar um arquivo?

**R:** Sem problema, vai dar erro. Salva e tenta de novo.

### P: Qual é o erro mais comum?

**R:** Cookies não salvos porque POST `/api/auth/signin` não foi criado. Verificar que arquivo existe em `app/api/auth/signin/route.ts`.

### P: Como debugar se algo não funciona?

**R:** Abra Console (DevTools) e cole:

```javascript
console.log('Cookies:', document.cookie);
fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
})
  .then((r) => r.json())
  .then(console.log);
```

### P: Preciso mudar algo no banco de dados?

**R:** Não. Apenas código cliente/servidor.

---

## PRÓXIMOS PASSOS APÓS IMPLEMENTAÇÃO

1. ✅ Implementação concluída
2. ⏳ Criar testes automatizados (E2E com Playwright)
3. ⏳ Implementar rate limiting em `/api/auth/signin`
4. ⏳ Adicionar logging estruturado
5. ⏳ Implementar refresh token rotation
6. ⏳ Implementar forgot password / reset

---

**Documentação Completa:** Veja também:

- `AUDITORIA_MIDDLEWARE_COOKIES.md` - Diagnóstico técnico detalhado
- `GUIA_TESTES_AUTENTICACAO.md` - Guia de testes completo
- `PROBLEMA_TECNICO_DIAGRAMA.md` - Diagramas e fluxos visuais
