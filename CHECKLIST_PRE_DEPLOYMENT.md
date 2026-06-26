# ✅ CHECKLIST PRÉ-DEPLOYMENT - NexxoHub v1.0

**Status:** Validação Final  
**Data:** 24 de junho de 2026  
**Responsável:** QA/DevOps

---

## 🎯 Seção 1: Código & Build

### Code Quality

- [ ] `npm run lint` passa (0 errors)
- [ ] `npm run typecheck` passa
- [ ] Sem console.logs em produção
- [ ] Sem commented code
- [ ] Imports organizados e limpos

**Verificar:**

```bash
npm run lint
npm run typecheck
npm run build
```

### Build Production

- [ ] `npm run build` passa
- [ ] Sem warnings no build
- [ ] Build time < 5s
- [ ] Bundle size aceitável (< 100KB gzipped)
- [ ] Sourcemaps desabilitados em prod

**Verificar:**

```bash
npm run build
npm run start
curl http://localhost:3000
```

### Dependencies

- [ ] npm audit sem vulnerabilidades críticas
- [ ] Versions pinned corretamente
- [ ] Sem peer dependency warnings
- [ ] `package.json` e `package-lock.json` sincronizados

**Verificar:**

```bash
npm audit
npm outdated
```

---

## 🧪 Seção 2: Testes

### Unit Tests

- [ ] `npm run test` passa
- [ ] Coverage > 80% (se aplicável)
- [ ] Sem skipped tests
- [ ] Sem flaky tests

**Verificar:**

```bash
npm run test
npm run test:coverage
```

### E2E Tests

- [ ] `npm run test:e2e` passa (6/6)
- [ ] Todos os testes executam com sucesso
- [ ] Sem timeout errors
- [ ] Screenshots gerados para falhas

**Verificar:**

```bash
npm run test:e2e
```

### Manual Testing

- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] F5 mantém autenticação
- [ ] Logout funciona
- [ ] Sem erros de console (F12)

**Verificar:**

```
Abrir http://localhost:3000/auth/login
Testar fluxo completo
Ver seção "Testes Manuais"
```

---

## 🔐 Seção 3: Segurança

### Autenticação

- [ ] Supabase Auth configurado
- [ ] Tokens JWT funcionando
- [ ] Refresh tokens gerenciados
- [ ] Session timeouts configurados
- [ ] Cookies HTTP-only

**Verificar:**

```bash
curl -v http://localhost:3000/auth/login
# Procurar por Set-Cookie headers
```

### Autorização & Permissões

- [ ] Middleware validando autenticação
- [ ] RLS policies ativas no Supabase
- [ ] Admin checks em endpoints críticos
- [ ] Sem exposição de dados de outros usuários
- [ ] Organização isolada por tenant

**Verificar:**

```
Supabase Dashboard → SQL Editor
SELECT * FROM roles_and_policies;
```

### Dados Sensíveis

- [ ] Sem passwords em logs
- [ ] Sem tokens em URLs
- [ ] Sem secrets em código
- [ ] Sem dados sensíveis no localStorage
- [ ] .env.local nunca commitado

**Verificar:**

```bash
grep -r "password=" .env
grep -r "token=" .env
grep -r "secret=" .env
```

### HTTPS & Headers

- [ ] HTTPS forçado
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security presente
- [ ] CSP (Content-Security-Policy) configurado

**Verificar:**

```bash
curl -I https://seu-app.vercel.app
```

---

## 🗄️ Seção 4: Banco de Dados

### Schema

- [ ] Migration aplicada (001_create_base_schema.sql)
- [ ] Tabelas criadas
- [ ] Indexes criados
- [ ] Foreign keys configuradas
- [ ] Constraints validadas

**Verificar:**

```
Supabase Dashboard → Database → Tables
Verificar: users, clinics, companies, employees
```

### RLS Policies

- [ ] Policy para public.users
- [ ] Policy para public.clinics (se existir)
- [ ] Policy para public.companies (se existir)
- [ ] Policy para public.employees (se existir)
- [ ] Enable RLS em todas as tabelas

**Verificar:**

```
Supabase Dashboard → SQL Editor
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'public.%'
```

### Data Integrity

- [ ] Sem data corruption
- [ ] Backups automáticos configurados
- [ ] Retention policy definida
- [ ] Recovery procedure documentada
- [ ] Teste de restore realizado

**Verificar:**

```
Supabase Dashboard → Backups
Verificar: Automático diário
```

---

## ⚙️ Seção 5: Configuração de Ambiente

### .env.local

- [ ] NEXT_PUBLIC_SUPABASE_URL definido
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY definido
- [ ] SUPABASE_SERVICE_ROLE_KEY definido
- [ ] NEXT_PUBLIC_APP_URL definido
- [ ] NEXT_PUBLIC_SENTRY_DSN (opcional)

**Verificar:**

```bash
test -f .env.local && echo "✅ .env.local existe"
grep "NEXT_PUBLIC_SUPABASE_URL" .env.local
```

### Produção

- [ ] Variáveis em Vercel/Netlify
- [ ] Valores corretos para produção
- [ ] Sem secrets de desenvolvimento
- [ ] Documentação de variáveis atualizada

**Verificar:**

```
Vercel/Netlify Dashboard → Settings → Environment Variables
Verificar: Todas as variáveis
```

---

## 🚀 Seção 6: Deployment

### Plataforma

- [ ] Vercel/Netlify conta criada
- [ ] Repository conectado
- [ ] Build command configurado
- [ ] Publish directory correto
- [ ] Auto-deploy ativado

**Verificar:**

```
Vercel/Netlify Dashboard → Settings
```

### Domain

- [ ] Domain registrado (opcional)
- [ ] DNS configurado corretamente
- [ ] SSL certificate válido
- [ ] Domain propagado (se aplicável)
- [ ] HTTPS forçado

**Verificar:**

```bash
dig seu-dominio.com
# Verificar apontamento
```

### Preview Deployment

- [ ] Deploy em staging funcionando
- [ ] Todos os testes passam em staging
- [ ] Performance aceitável
- [ ] Sem erros de console
- [ ] Funcionalidades validadas

**Verificar:**

```
1. Fazer deploy para staging
2. Testar em: https://staging-nexxohub.vercel.app
3. Validar: Login, Dashboard, Logout
```

---

## 📊 Seção 7: Performance

### Lighthouse

- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

**Verificar:**

```
Chrome DevTools → Lighthouse
Ou: https://pagespeed.web.dev/
```

### Métricas Vitais

- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3.5s

**Verificar:**

```
Chrome DevTools → Performance
Ou: https://web.dev/vitals/
```

### Bundle Size

- [ ] Next.js bundle < 100KB
- [ ] JavaScript total < 150KB
- [ ] CSS < 30KB
- [ ] Sem duplicate dependencies

**Verificar:**

```bash
npm run build
# Ver output do build
```

---

## 📱 Seção 8: Responsividade

### Desktop

- [ ] Layout correto em 1920x1080
- [ ] Layout correto em 1280x720
- [ ] Sem scroll horizontal
- [ ] Todos elementos visíveis

**Verificar:**

```
Chrome DevTools → Toggle device toolbar
Testar múltiplas resoluções
```

### Tablet

- [ ] Layout adaptável (iPad)
- [ ] Toque funciona
- [ ] Menu responsivo
- [ ] Sem overflow

**Verificar:**

```
DevTools → iPhone/iPad size
```

### Mobile

- [ ] Layout adaptável (iPhone)
- [ ] Toque funciona
- [ ] Menu mobile
- [ ] Legibilidade ok

**Verificar:**

```
DevTools → iPhone 12 Pro
```

---

## 🔔 Seção 9: Monitoramento & Alertas

### Sentry (Error Tracking)

- [ ] Conta criada
- [ ] DSN configurada
- [ ] Environment correto
- [ ] Alertas configurados
- [ ] Notifications testadas

**Verificar:**

```
https://sentry.io
Dashboard → Events
```

### Logs

- [ ] Logs estruturados
- [ ] Nível de log apropriado
- [ ] Sem exposição de dados
- [ ] Retention policy

**Verificar:**

```
Vercel/Netlify → Logs
Procurar por [ERROR], [WARN]
```

### Analytics (Optional)

- [ ] Google Analytics configurado
- [ ] Eventos rastreados
- [ ] Goals definidos
- [ ] Conversions monitoradas

**Verificar:**

```
Google Analytics Dashboard
```

---

## 📧 Seção 10: Integrações

### Email

- [ ] Supabase Email Auth funciona
- [ ] Emails sendo entregues
- [ ] Templates corretos
- [ ] Rate limiting ok

**Verificar:**

```
Testar: Forgot password
Verificar: Email recebido
```

### OAuth (Se Configurado)

- [ ] Google OAuth funcionando
- [ ] GitHub OAuth funcionando
- [ ] Redirect URLs corretas
- [ ] Credentials válidas

**Verificar:**

```
Testar: Login com Google
Testar: Login com GitHub
```

### Webhooks (Se Usado)

- [ ] Endpoints funcionando
- [ ] Payloads corretos
- [ ] Retries configurados
- [ ] Error handling ok

**Verificar:**

```
Logs: Verificar webhook calls
```

---

## 📋 Seção 11: Documentação

### Documentos

- [ ] README.md atualizado
- [ ] CONTRIBUTING.md presente
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

**Verificar:**

```bash
ls -la *.md
# Validar: Todos presentes
```

### Código

- [ ] Comentários em código complexo
- [ ] TypeScript types documentados
- [ ] API routes documentadas
- [ ] Componentes props documentados

**Verificar:**

```bash
grep -r "@param" src/
grep -r "@returns" src/
```

---

## 👥 Seção 12: Stakeholders & Sign-off

### Aprovações

- [ ] Product Manager aprova
- [ ] QA aprova
- [ ] DevOps aprova
- [ ] Security aprova (se aplicável)
- [ ] Legal aprova (se aplicável)

**Verificar:**

```
Email confirmations de aprovação
```

### Comunicação

- [ ] Stakeholders informados
- [ ] Usuarios finais notificados
- [ ] Status page atualizado
- [ ] Release notes preparadas

**Verificar:**

```
Email enviados
Slack messages
Status page atualizado
```

---

## 🎬 Seção 13: Plano de Contingência

### Rollback Plan

- [ ] Rollback procedure documentada
- [ ] Backup anterior testado
- [ ] Hotline ativada
- [ ] On-call schedule

**Verificar:**

```
1. Entender: Como fazer rollback
2. Praticar: Rollback em staging
3. Documentar: Steps exatos
```

### Incident Response

- [ ] Escalation path definido
- [ ] Communication plan
- [ ] Timeline de resolução
- [ ] Post-mortem process

**Verificar:**

```
Documento: Incident Response Plan
```

### Support Resources

- [ ] Support team treinado
- [ ] Documentation para support
- [ ] Runbook de troubleshooting
- [ ] Emergency contacts

**Verificar:**

```
Support team review
```

---

## ✅ Checklist Final

### Antes de Apertar o Botão Deploy

```
┌────────────────────────────────────────────┐
│ FINAL CHECKLIST ANTES DO DEPLOY           │
├────────────────────────────────────────────┤
│                                            │
│ Code & Build                               │
│ ✅ Lint: 0 errors                         │
│ ✅ TypeScript: 0 errors                   │
│ ✅ Build: Sucesso                         │
│                                            │
│ Testes                                     │
│ ✅ Unit: Passando                         │
│ ✅ E2E: 6/6 passando                      │
│ ✅ Manual: Validado                       │
│                                            │
│ Segurança                                  │
│ ✅ Auth: Funcionando                      │
│ ✅ RLS: Ativo                             │
│ ✅ HTTPS: Configurado                     │
│                                            │
│ Banco de Dados                             │
│ ✅ Schema: Criado                         │
│ ✅ Policies: Ativas                       │
│ ✅ Backups: Configurados                  │
│                                            │
│ Performance                                │
│ ✅ Lighthouse: > 80                       │
│ ✅ Bundle: < 100KB                        │
│ ✅ Response: < 200ms                      │
│                                            │
│ Monitoramento                              │
│ ✅ Sentry: Configurado                    │
│ ✅ Logs: Estruturados                     │
│ ✅ Alertas: Ativos                        │
│                                            │
│ Aprovações                                 │
│ ✅ PM: Aprovado                           │
│ ✅ QA: Aprovado                           │
│ ✅ DevOps: Aprovado                       │
│                                            │
│ ═════════════════════════════════════════ │
│ 🟢 PRONTO PARA DEPLOY                     │
│ ═════════════════════════════════════════ │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🚀 Comando de Deploy

**Quando tudo acima está ✅:**

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

**APÓS O DEPLOY:**

```
1. ✅ Verificar status page
2. ✅ Testar login em produção
3. ✅ Monitorar Sentry (1h)
4. ✅ Celebrar! 🎉
```

---

## 📞 Suporte Pós-Deploy (24h)

- 🔴 Crítico: Intervalo de 5 minutos
- 🟠 Alto: Intervalo de 15 minutos
- 🟡 Médio: Intervalo de 1 hora
- 🟢 Baixo: Intervalo de 8 horas

---

**Documento Preparado Por:** Claude Agent Team  
**Data:** 24 de junho de 2026  
**Status:** 🟢 **CHECKLIST PRONTO**

Use este checklist antes de QUALQUER deploy!
