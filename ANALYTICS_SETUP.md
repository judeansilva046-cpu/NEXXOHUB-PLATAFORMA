# 📊 Analytics - Google Analytics + Vercel Analytics

## Por que Analytics?

Você consegue entender:

```
📈 Quantas pessoas usam seu app
👥 Quem são (país, dispositivo, browser)
⏱️ Quanto tempo ficam
🔗 Quais páginas visitam mais
📍 De onde vêm (referrer)
⚙️ Performance real do site
```

---

## 🚀 Setup Rápido - 2 Plataformas

### #1: Google Analytics (5 min)

#### Passo 1: Criar conta Google Analytics

```
1. Acesse: https://analytics.google.com
2. Clique em "Start measuring"
3. Nome: NexxoHub
4. Clique em "Create"
```

#### Passo 2: Criar Property

```
1. Website name: NexxoHub
2. Website URL: https://seu-site.netlify.app
3. Timezone: (America/Sao_Paulo)
4. Currency: BRL
5. Clique em "Create"
```

#### Passo 3: Copiar Measurement ID

```
Você verá:
Measurement ID: G-XXXXXXXXXX

Copie este valor!
```

#### Passo 4: Adicionar ao Netlify

```
1. Vá em Netlify → Site settings → Build & deploy → Environment
2. Adicione nova variável:

   Key: NEXT_PUBLIC_GA_MEASUREMENT_ID
   Value: (cole G-XXXXXXXXXX)

3. Clique em "Save"
4. Clique em "Trigger deploy"
```

---

### #2: Vercel Analytics (Automático!)

Vercel Analytics já vem incluído! Você só precisa:

```
1. Abra seu site em produção
2. Vá no Vercel Dashboard
3. Clique no seu projeto
4. Vá em "Analytics"
5. Pronto! Dados começam a aparecer em ~1 hora
```

---

## ✅ Testar Analytics

Após 5-10 minutos do deploy:

### Google Analytics:

```
1. Acesse: https://analytics.google.com
2. Vá em "Realtime"
3. Abra seu site em outra aba
4. Navegue pelo site
5. Você deve ver sua atividade em tempo real!
```

### Vercel Analytics:

```
1. Acesse Vercel Dashboard
2. Clique em seu projeto
3. Vá em "Analytics"
4. Veja:
   - Total pageviews
   - Core Web Vitals
   - Real User Analytics (RUM)
```

---

## 📊 Métricas Importantes

### Google Analytics mostra:

```
✅ Session count - Quantas sessões
✅ Users - Quantas pessoas únicas
✅ Pageviews - Total de pages vistas
✅ Duration - Tempo médio por sessão
✅ Bounce rate - % que saem sem interagir
✅ Device category - Desktop/Mobile/Tablet
✅ Country - Países
✅ Browser - Chrome/Firefox/Safari
```

### Vercel Analytics mostra:

```
✅ Web Vitals:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

✅ Pageviews
✅ Status codes
✅ Response times
```

---

## 🎯 Dashboards que você vai usar

### Google Analytics:

```
1. "Realtime" - Ver atividade ao vivo
2. "Overview" - Resumo geral
3. "Pages" - Quais páginas são visitadas
4. "Traffic sources" - De onde vêm os usuários
5. "Device" - Que dispositivos usam
```

### Vercel Analytics:

```
1. "Analytics" - Overview geral
2. "Web Vitals" - Performance do site
3. "Usage" - Consumo de recursos
```

---

## 💡 Eventos Customizados (Avançado)

Você pode rastrear eventos específicos do seu app:

```typescript
// No seu código React
import { useEffect } from 'react';

export function MyComponent() {
  useEffect(() => {
    // Quando criar uma Clinic
    window.gtag?.event('clinic_created', {
      event_category: 'engagement',
      event_label: 'user_created_clinic',
      value: 1,
    });
  }, []);

  return <>...</>;
}
```

Depois você vê em Google Analytics → "Conversions" → "Audience"

---

## 🔒 Privacidade & GDPR

### Google Analytics já está:

```
✅ Configurado para anonimizar IP
✅ Sem tracking de senhas/dados sensíveis
✅ Respeitando Do Not Track
✅ GDPR compliant
```

### Boas práticas:

```
1. Adicione cookie banner (LGPD)
2. Avise sobre Google Analytics na política de privacidade
3. Permita aos usuários opt-out
4. Não rastreie dados sensíveis
```

---

## 📱 Mobile Analytics

Ambos rastreiam:

```
✅ iOS (Safari)
✅ Android (Chrome)
✅ Desktop
✅ Tablets

Você verá quebra por device type em "Device" → "Device category"
```

---

## 🎓 Exemplos de Relatórios Úteis

### Descobrir:

```
1. "Qual página tem mais tempo de permanência?"
   → Google Analytics → Behavior → Site content → Pages

2. "Que hora do dia tem mais tráfego?"
   → Google Analytics → Users → Overview → por hora

3. "De qual país vêm meus usuários?"
   → Google Analytics → Audience → Geo → Location

4. "Qual é meu Web Vitals score?"
   → Vercel → Analytics → Web Vitals
```

---

## 💰 Pricing

```
Google Analytics: ✅ Gratuito
Vercel Analytics:
  - Basic (Free) - Limitado
  - Pro (incluído com Pro) - Completo
```

---

## 🎯 Checklist Analytics

- [ ] Conta Google Analytics criada
- [ ] Property criada
- [ ] Measurement ID copiado
- [ ] NEXT_PUBLIC_GA_MEASUREMENT_ID adicionado ao Netlify
- [ ] npm install executado
- [ ] Commit e push feito
- [ ] Deploy executado
- [ ] Google Analytics mostrando dados
- [ ] Vercel Analytics mostrando dados
- [ ] Testei evento customizado (opcional)

---

## 📞 Próximos Passos

Você agora tem **visibilidade completa do seu app**! 🎉

```
✅ Sentry → Saber quando algo quebra
✅ Backups → Não perder dados
✅ Analytics → Entender como está sendo usado
```

Seus 3 pilares de produção estão prontos!
