# 🧪 PLANO DE TESTES - AUTENTICAÇÃO NEXXOHUB

**Objetivo:** Validar que o fluxo de login/logout funciona 100% sem erros

---

## ✅ TESTE 1: LOGIN COM SUCESSO

**Pré-requisito:** Usuário cadastrado no Supabase Auth
- Email: `judeansilva046@gmail.com`
- Senha: (a definida)

**Passos:**
1. Abrir: `https://illustrious-cascaron-bd22da2.netlify.app/auth/login`
2. Digitar email
3. Digitar senha
4. Clicar "Entrar"
5. Aguardar redirecionamento

**Esperado:**
- ✅ Sem "piscando"
- ✅ Redireciona para `/dashboard`
- ✅ Mostra dados do usuário (organização, nome, email)
- ✅ Menu lateral aparece (Dashboard, Organizações, Clínicas, Empresas, Colaboradores, Avaliações, Relatórios)
- ✅ Nenhuma mensagem de erro

**Se houver erro "Failed to fetch user":**
- Abrir DevTools (F12) → Console
- Procurar logs `[API_AUTH_ME]`
- Anotar a mensagem de erro

---

## ✅ TESTE 2: MANTER AUTENTICADO

**Pré-requisito:** Estar logado no `/dashboard`

**Passos:**
1. Estar em `/dashboard`
2. Pressionar **F5** (recarregar página)
3. Aguardar carregamento

**Esperado:**
- ✅ Permanece em `/dashboard`
- ✅ Dados do usuário ainda aparecem
- ✅ Não redireciona para `/auth/login`
- ✅ Menu lateral intacto

---

## ✅ TESTE 3: USUÁRIO AUTENTICADO ACESSA /AUTH/LOGIN

**Pré-requisito:** Estar logado

**Passos:**
1. Estar em `/dashboard` (logado)
2. Digitar na URL: `/auth/login`
3. Pressionar Enter

**Esperado:**
- ✅ Redireciona para `/dashboard` UMA VEZ
- ✅ Sem loop
- ✅ Sem "piscando"

---

## ✅ TESTE 4: USUÁRIO NÃO AUTENTICADO ACESSA /DASHBOARD

**Pré-requisito:** Não estar logado

**Passos:**
1. Abrir em modo privado: `Ctrl+Shift+N`
2. Digitar URL: `/dashboard`
3. Pressionar Enter

**Esperado:**
- ✅ Redireciona para `/auth/login`
- ✅ Sem loop
- ✅ Sem "piscando"

---

## ✅ TESTE 5: LOGOUT

**Pré-requisito:** Estar logado

**Passos:**
1. Estar em `/dashboard`
2. Clicar no botão **"Sair"** (canto superior direito)
3. Aguardar redirecionamento

**Esperado:**
- ✅ Redireciona para `/auth/login`
- ✅ Sessão foi destruída
- ✅ Tentar acessar `/dashboard` → redireciona para `/auth/login`

---

## ✅ TESTE 6: MÚLTIPLOS LOGINS/LOGOUTS

**Pré-requisito:** Poder fazer login/logout

**Passos:**
1. Login → `/dashboard`
2. Logout → `/auth/login`
3. Login novamente → `/dashboard`
4. Logout → `/auth/login`
5. Repetir 3x

**Esperado:**
- ✅ Funciona sempre sem erros
- ✅ Sem "piscando"
- ✅ Sem loops

---

## 🔍 VERIFICAÇÕES NO CONSOLE

Abrir DevTools (F12) → Console e procurar por estes logs:

### Login bem-sucedido:
```
[LOGIN_SUCCESS] User logged in
[SESSION_EXISTS] Session confirmed on client
```

### Middleware funcionando:
```
[MIDDLEWARE_AUTHENTICATED] User has valid session
[MIDDLEWARE_REDIRECT_DASHBOARD] Authenticated user → /dashboard
[MIDDLEWARE_REDIRECT_LOGIN] Unauthenticated user → /auth/login
```

### API funcionando:
```
[API_AUTH_ME] User profile found
[API_AUTH_ME] User profile created (se novo usuário)
```

### Logout:
```
Logout successful
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. Login com sucesso | ⬜ | |
| 2. Manter autenticado (F5) | ⬜ | |
| 3. Usuário autenticado → /auth/login | ⬜ | |
| 4. Usuário não autenticado → /dashboard | ⬜ | |
| 5. Logout funciona | ⬜ | |
| 6. Múltiplos login/logout | ⬜ | |

---

## ❌ POSSÍVEIS ERROS E SOLUÇÕES

### "Failed to fetch user"
**Causas possíveis:**
- RLS bloqueando leitura
- Usuário não existe em `public.users`
- API retornando erro

**Solução:**
- Abrir Console (F12)
- Procurar logs `[API_AUTH_ME]`
- Se disser "User profile created" = resolvido (próxima tentativa)
- Se disser erro = RLS problema

---

### "Piscando" ao fazer login
**Causas possíveis:**
- Middleware ainda criando loop
- Cookies não sendo persistidos

**Solução:**
- Ctrl+Shift+R para limpar cache
- Abrir DevTools Network tab
- Ver redirecionamentos (307 status)
- Se houver muitos = loop

---

### Logout não funciona
**Causas possíveis:**
- Endpoint `/api/auth/logout` quebrado
- Sessão não sendo destruída

**Solução:**
- Abrir Console (F12)
- Verificar se há erro ao fazer logout
- Tentar logout de novo

---

## 🎯 CRITÉRIOS DE SUCESSO

✅ **TUDO PASSOU SE:**
1. Login sem "piscando"
2. Redirecionamento automático funciona
3. Dados do usuário aparecem
4. F5 mantém autenticação
5. Logout funciona
6. Múltiplos login/logout funcionam
7. Nenhuma mensagem de erro no console
8. Build `npm run build` passa

---

## 📋 APÓS TODOS OS TESTES

1. Anotar todos os resultados acima
2. Se algum teste falhou, abrir issue
3. Se tudo passou, ✅ PRONTO PARA PRODUÇÃO

