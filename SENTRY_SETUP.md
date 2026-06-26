# 🔴 Sentry - Error Tracking em Produção

## O que é Sentry?

Sentry monitora **erros em produção** e alerta você automaticamente:

- ❌ Erros JavaScript capturados em tempo real
- 📍 Stack traces completas
- 📊 Performance monitoring
- 🎥 Session replays (opcional)
- 🚨 Alertas automáticos via email/Slack

---

## 🚀 Setup Rápido (5 minutos)

### Passo 1: Criar conta Sentry

```
1. Acesse: https://sentry.io
2. Clique em "Sign up"
3. Crie conta com email
4. Verifique seu email
```

### Passo 2: Criar Projeto

```
1. Clique em "Projects" → "Create Project"
2. Selecione: Next.js
3. Platform: JavaScript/TypeScript
4. Nome: nexxohub-plataforma
5. Clique em "Create Project"
```

### Passo 3: Copiar DSN

```
Você verá uma tela com um DSN parecido com:
https://xxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxxxx

Copie este valor!
```

### Passo 4: Adicionar ao Netlify

No **Netlify Console**:

```
1. Vá em "Site settings" → "Build & deploy" → "Environment"
2. Adicione nova variável:

   Key: NEXT_PUBLIC_SENTRY_DSN
   Value: (cole o DSN que copiou)

3. Clique em "Save"
4. Clique em "Trigger deploy"
```

### Passo 5: Atualizar package.json

```bash
# Execute no seu computador
npm install @sentry/nextjs

# Commit e push
git add package.json package-lock.json
git commit -m "feat: Add Sentry error tracking"
git push origin main
```

---

## ✅ Testar Sentry

### No seu site em produção:

```javascript
// Abra DevTools (F12) → Console
// Cole este comando:

Sentry.captureException(new Error('Teste de erro Sentry'));

// Vá em Sentry.io → Issues
// Você deve ver o erro aparecer em tempo real!
```

---

## 📊 Depois que estiver funcionando

### No Sentry Dashboard:

```
1. Vá em "Issues" para ver todos os erros
2. Clique em um erro para ver detalhes:
   - Stack trace
   - User info
   - Browser/Device
   - Timestamp

3. Vá em "Transactions" para performance
4. Vá em "Replays" para ver sessões do usuário
```

### Criar Alertas

```
1. Vá em "Alerts"
2. Clique em "Create Alert Rule"
3. Configure:
   - Quando: X erros em Y minutos
   - Enviar para: seu email
   - Ou integre com Slack
```

---

## 🔧 Customizações (Opcional)

### Ignorar certos erros

No `app/providers.tsx`:

```typescript
ignoreErrors: [
  // Browser extensions
  'top.GLOBALS',
  // Ad blockers
  'window.adsbygoogle',
  // Seu app específico
  'MinhaClasse',
],
```

### Capturar user info

No seu código:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

### Custom tags

```typescript
Sentry.captureException(error, {
  tags: {
    section: 'clinics',
    action: 'create',
  },
});
```

---

## 💰 Pricing

```
Free tier (gratuito):
- Até 5.000 eventos/mês
- 30 dias de retenção
- Perfeito para começar!

Pago:
- $29/mês para mais eventos
- 90 dias retenção
```

---

## 🔗 Integração com Slack (Bônus)

```
1. Em Sentry, vá em "Integrations"
2. Procure por "Slack"
3. Clique em "Install"
4. Autorize no Slack
5. Configure qual canal recebe alertas
6. Pronto! Erros chegam no Slack em tempo real
```

---

## 📱 Monitorar Mobile

```
Sentry também monitora erros em mobile:
- iOS (Swift)
- Android (Java/Kotlin)
- React Native

Seu Next.js é web, então está coberto!
```

---

## 🎯 Checklist Sentry

- [ ] Conta Sentry criada
- [ ] Projeto criado
- [ ] DSN copiado
- [ ] NEXT_PUBLIC_SENTRY_DSN adicionado no Netlify
- [ ] npm install @sentry/nextjs executado
- [ ] Commit e push feito
- [ ] Deploy executado
- [ ] Sentry respondendo com erros
- [ ] Alertas configurados (email ou Slack)

---

## 📞 Próximos Passos

Você agora tem **monitoramento em tempo real**! 🎉

Próximo: Vamos configurar **Backups Automatizados** no Supabase
