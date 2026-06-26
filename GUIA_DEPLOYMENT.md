# 🚀 GUIA DE DEPLOYMENT - NexxoHub v1.0

**Status:** 📋 Preparação para Produção  
**Data:** 24 de junho de 2026  
**Versão:** 1.0 (Production Ready)

---

## 📋 PRÉ-REQUISITOS

### ✅ Técnicos

- [x] Build passes: `npm run build` ✅
- [x] Lint passes: `npm run lint` ✅
- [x] TypeScript passes: `npm run typecheck` ✅
- [x] Testes E2E passam: `npm run test:e2e` ✅
- [x] Zero console errors
- [x] Database schema aplicado

### ✅ Conta/Credenciais

- [x] Vercel/Netlify account criada
- [x] Supabase project criado
- [x] Domain registrado (opcional)
- [x] SSL certificate pronto
- [x] GitHub repository configurado

### ✅ Variáveis de Ambiente

- [x] `NEXT_PUBLIC_SUPABASE_URL` - Configurada
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Configurada
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Configurada
- [x] `NEXT_PUBLIC_SENTRY_DSN` - (opcional) Configurada
- [x] `.env.local` presente

---

## 🎯 Opção 1: Deploy em Vercel (Recomendado)

### Passo 1: Conectar GitHub

```
1. Ir para https://vercel.com
2. Click "New Project"
3. Importar repositório GitHub
4. Autorizar acesso
```

### Passo 2: Configurar Variáveis de Ambiente

```
Na dashboard do Vercel:

Settings → Environment Variables

Adicionar:
├── NEXT_PUBLIC_SUPABASE_URL
├── NEXT_PUBLIC_SUPABASE_ANON_KEY
├── SUPABASE_SERVICE_ROLE_KEY
├── NEXT_PUBLIC_SENTRY_DSN (opcional)
└── NEXT_PUBLIC_APP_URL
```

### Passo 3: Deploy

```
1. Click "Deploy"
2. Aguardar build (3-5 minutos)
3. Vercel fornecerá URL: https://nexxohub-xxxxx.vercel.app
```

### Passo 4: Validar

```bash
# Testar em produção
curl https://nexxohub-xxxxx.vercel.app/api/auth/me

# Esperado: 401 (não autenticado)
# ou sucesso se já logado
```

---

## 🎯 Opção 2: Deploy em Netlify

### Passo 1: Conectar GitHub

```
1. Ir para https://netlify.com
2. Click "New site from Git"
3. Selecionar GitHub
4. Autorizar e escolher repo
```

### Passo 2: Configurar Build

```
Build Command:     npm run build
Publish Directory: .next
```

### Passo 3: Variáveis de Ambiente

```
Site settings → Build & deploy → Environment

Adicionar todas as variáveis de .env.local
```

### Passo 4: Deploy

```
1. Conectar repository
2. Netlify faz deploy automático
3. URL gerada: https://nexxohub-xxxxx.netlify.app
```

---

## 🔐 Configuração de Segurança Pós-Deploy

### 1. Ativar HTTPS

```
Automático em Vercel/Netlify ✅
Certificado SSL/TLS ✅
```

### 2. Configurar Headers de Segurança

```
Arquivo: next.config.js

module.exports = {
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
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  }
}
```

### 3. Configurar CORS em Supabase

```
Supabase Dashboard → Settings → API

Allowed origins:
├── https://nexxohub-xxxxx.vercel.app
├── https://nexxohub-xxxxx.netlify.app
└── https://seu-dominio-customizado.com
```

### 4. Configurar RLS Policies

```
Supabase Dashboard → SQL Editor

Executar:
├── RLS policy para public.users
├── RLS policy para public.clinics
├── RLS policy para public.companies
└── RLS policy para public.employees
```

---

## 📊 Teste Pós-Deploy

### Teste 1: Health Check

```bash
curl -I https://seu-app.vercel.app

# Esperado:
# HTTP/1.1 200 OK
# X-Content-Type-Options: nosniff
```

### Teste 2: Login

```
1. Ir para https://seu-app.vercel.app/auth/login
2. Fazer login com judeansilva046@gmail.com / Judean16@
3. Verificar redirecionamento para /dashboard
4. Validar dados do usuário aparecem
```

### Teste 3: API

```bash
# Após fazer login, obter cookie
curl -b "cookies.txt" https://seu-app.vercel.app/api/auth/me

# Esperado:
# { "success": true, "data": { "id": "...", "email": "..." } }
```

### Teste 4: Performance

```
Lighthouse:
├── Performance: > 80
├── Accessibility: > 90
├── Best Practices: > 90
└── SEO: > 90
```

---

## 🔄 Configurar Auto-Deploy

### Em Vercel

```
1. Dashboard → Settings → Git
2. Automatic deployments já ativado
3. Cada push em main = deploy automático
```

### Em Netlify

```
1. Site settings → Deploy
2. Ativar: Continuous deployment
3. Escolher branch: main
4. Build triggers: on push
```

---

## 📱 Configurar Domínio Customizado

### Opção A: Vercel

```
1. Settings → Domains
2. Adicionar seu domínio (ex: nexxohub.com)
3. Seguir instruções de DNS
4. Aguardar propagação (24-48h)
```

### Opção B: Netlify

```
1. Site settings → Domain management
2. Add domain
3. Configurar DNS records
4. Aguardar propagação
```

---

## 🛠️ Monitoramento Pós-Deploy

### 1. Ativar Sentry (Error Tracking)

```
1. Ir para https://sentry.io
2. Criar projeto
3. Copiar DSN
4. Adicionar em environment: NEXT_PUBLIC_SENTRY_DSN
5. Redeployar
```

### 2. Ativar Analytics

```
next/analytics já integrado em providers.tsx

Verificar:
├── Vercel Analytics ativado
├── Google Analytics (se configurado)
└── Custom events sendo rastreados
```

### 3. Configurar Alertas

```
Sentry:
├── Notificar quando > 5 erros
├── Notificar em novo tipo de erro
└── Notification channel: Email/Slack
```

---

## 📊 Métricas de Produção

### Performance (Target)

```
✅ First Contentful Paint: < 1.5s
✅ Largest Contentful Paint: < 2.5s
✅ Cumulative Layout Shift: < 0.1
✅ Time to Interactive: < 3.5s
```

### Uptime (Target)

```
✅ 99.9% uptime mensal
✅ < 5 minutos downtime
✅ Auto-recovery em caso de erro
```

### Segurança (Validar)

```
✅ HTTPS forçado
✅ Security headers presentes
✅ RLS policies ativas
✅ Sem dados sensíveis em logs
```

---

## 🔄 Rollback (Se Necessário)

### Vercel

```
1. Deployments → Selecionar versão anterior
2. Click "Rollback"
3. Site volta para versão anterior em segundos
```

### Netlify

```
1. Deploys → Selecionar deploy anterior
2. Click "Publish"
3. Site volta para versão anterior
```

---

## 📋 Checklist Final Pré-Deploy

- [ ] `npm run build` passa
- [ ] `npm run lint` passa (0 errors)
- [ ] `npm run test:e2e` passa (6/6)
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase production config validada
- [ ] RLS policies ativas
- [ ] Database backups configurados
- [ ] Email transacional testado (se aplicável)
- [ ] CORS configurado corretamente
- [ ] SSL certificate válido
- [ ] Domain propagado (se custom domain)
- [ ] Sentry configurado
- [ ] Analytics ativado
- [ ] Monitoramento pronto
- [ ] Plano de rollback definido

**Se todos checked:** ✅ **Pronto para deploy!**

---

## 🚀 Comando de Deploy Final

### Vercel

```bash
npm run build
vercel deploy --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod
```

---

## ✅ Pós-Deploy (Primeiras 24h)

### Monitorar:

```
✅ Sentry: Verificar se há erros
✅ Logs: Procurar por [ERROR] ou [WARN]
✅ Performance: Lighthouse > 80
✅ Users: Testar login em produção
✅ API: Verificar endpoints respondendo
```

### Validar:

```
✅ Login funciona
✅ Dashboard carrega
✅ F5 mantém sessão
✅ Logout funciona
✅ Sem erros de console
```

### Divulgar:

```
✅ Email para stakeholders
✅ Slack notification
✅ Status page atualizado
✅ Documentação atualizada
```

---

## 📞 Troubleshooting Pós-Deploy

### Problema: "503 Service Unavailable"

```
Solução:
1. Verificar Supabase está online
2. Verificar variáveis de ambiente
3. Ver logs em Vercel/Netlify
```

### Problema: "CORS error"

```
Solução:
1. Verificar CORS em Supabase
2. Adicionar domain em allowed origins
3. Redeployar
```

### Problema: "Database connection failed"

```
Solução:
1. Verificar Supabase está online
2. Verificar credenciais em .env
3. Testar conexão: curl /api/auth/me
```

### Problema: "Auth redirect loop"

```
Solução:
1. Verificar middleware.ts
2. Limpar browser cache (Ctrl+Shift+R)
3. Ver logs: F12 → Console
```

---

## 🎓 Documentação para Manutenção

Após deploy, compartilhar com time:

1. **Para Developers:**

   - `RELATORIO_FINAL_AUTENTICACAO.md` (arquitetura)
   - `README_HOMOLOGACAO.md` (scripts úteis)

2. **Para DevOps:**

   - `GUIA_DEPLOYMENT.md` (este arquivo)
   - Guia de backup/recovery

3. **Para Support:**
   - `PLANO_TESTES_FINAIS.md` (reproduzir issues)
   - Guia de troubleshooting

---

## 🎉 Parabéns!

Você deployou **NexxoHub v1.0** em produção! 🚀

### Próximos Passos:

1. ✅ Monitorar por 7 dias
2. ✅ Coletar feedback de usuários
3. ✅ Corrigir bugs encontrados
4. ✅ Iniciar Fase 2 (novas features)

---

**Documento Preparado Por:** Claude Agent Team  
**Data:** 24 de junho de 2026  
**Status:** 🟢 **PRODUCTION DEPLOYMENT READY**
