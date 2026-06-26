# 🚀 Guia Completo - Deploy NexxoHub no Netlify

## ✨ Por que Netlify?

- ✅ Simples e rápido de configurar
- ✅ Free tier generoso
- ✅ Suporte excelente a Next.js
- ✅ Previews automáticos de PRs
- ✅ Deploy automático em cada push
- ✅ Muito similar ao Vercel mas mais flexível

---

## 📋 Pré-requisitos

- ✅ Conta Netlify (criar em https://netlify.com)
- ✅ GitHub conectado à Netlify
- ✅ Repositório: `judeansilva046-cpu/NEXXOHUB-PLATAFORMA`
- ✅ package.json e package-lock.json no repositório

---

## 🔧 Passo 1: Preparar Variáveis de Ambiente

### Variáveis que você vai precisar:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Como encontrar no Supabase:

1. Acesse **Supabase Dashboard**
2. Vá em **Settings** → **API**
3. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🌐 Passo 2: Conectar ao Netlify

### 2.1 - Acessar Netlify

```
1. Vá para: https://app.netlify.com
2. Faça login ou crie conta
3. Clique em "Add new site" → "Import an existing project"
```

### 2.2 - Conectar GitHub

```
1. Selecione "GitHub"
2. Clique em "Authorize Netlify"
3. Faça login no GitHub se necessário
4. Selecione o repositório: NEXXOHUB-PLATAFORMA
```

### 2.3 - Selecionar Branch

```
1. Branch to deploy: main
2. Clique em "Next"
```

---

## ⚙️ Passo 3: Configurar Build Settings

### Na tela "Build settings and deploy":

```
Build command: npm run build
Publish directory: .next
Functions directory: (deixar vazio)
```

✅ Netlify vai detectar automaticamente que é um projeto Next.js!

---

## 🔐 Passo 4: Adicionar Variáveis de Ambiente

### No Netlify:

```
1. Clique em "Advanced"
2. Em "Build environment variables", clique "New variable"
3. Adicione cada variável:

   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://seu-project.supabase.co

   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOi...

   Key: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOi...

4. Clique em "Deploy site"
```

---

## ✅ Passo 5: Deploy Automático

```
1. Netlify iniciará o build automaticamente
2. Você pode acompanhar em tempo real
3. Após ~3-5 minutos, receberá uma URL:
   https://seu-site-xxxxx.netlify.app
```

---

## 📊 Monitorar Deploy

### Durante o Build:

```
1. Vá em "Deploys"
2. Clique no deploy em progresso
3. Veja logs em tempo real
```

### Status esperado:

```
✅ Building
✅ Deploying
✅ Publish
✅ Ready
```

---

## 🎯 Configurações Pós-Deploy

### 1. Preview de Pull Requests (Automático!)

```
Netlify cria URLs de preview automaticamente para cada PR
Ótimo para testar antes de mergear para main
```

### 2. Domain Customizado

```
1. Vá em "Site settings" → "Domain management"
2. Clique em "Add custom domain"
3. Digite seu domínio
4. Configure DNS apontando para Netlify
```

### 3. HTTPS (Automático!)

```
Netlify fornece SSL/TLS grátis para todos os domínios
Renova automaticamente
```

---

## 📱 Testes Pós-Deploy

Após o deploy estar "Ready":

```
✅ Acesse a URL do Netlify
✅ Teste login com Supabase
✅ Crie uma Clinic, Company, Employee
✅ Teste filtros e busca
✅ Verifique em mobile
✅ Abra DevTools (F12) e procure por erros
```

---

## 🚀 Configurar Deploy Automático

### Já está habilitado por padrão!

```
Cada push para "main" triggers novo deploy
Se houver erro, o deploy anterior permanece ativo
Você pode reverter com 1 clique em "Deploys"
```

---

## 📈 Performance & Analytics

No **Netlify Dashboard**:

```
1. Vá em "Analytics"
2. Veja:
   - Requisições por dia
   - Tempo de deploy
   - Bandwidth usado
   - Logs de erro
```

---

## 🔧 netlify.toml - O que foi configurado

```toml
[build]
  command = "npm run build"      # Build Next.js
  publish = ".next"               # Diretório de saída

[build.environment]
  NODE_VERSION = "18.17.0"       # Node version
  NPM_VERSION = "9.6.0"          # NPM version

[[headers]]                        # Headers de segurança
  X-Content-Type-Options
  X-Frame-Options
  X-XSS-Protection

[[plugins]]
  @netlify/plugin-nextjs         # Otimizações Next.js
```

---

## ❓ Troubleshooting

### Build falha com "Cannot find module"

```
Solução:
1. Certifique-se que package-lock.json está no Git
2. Execute localmente: npm install && npm run build
3. Faça commit e push
4. Netlify refará o build
```

### Variáveis não são lidas

```
Solução:
1. Certifique-se que começa com NEXT_PUBLIC_
2. Vá em "Site settings" → "Build & deploy" → "Environment"
3. Verifique se as variáveis estão lá
4. Triggerizze novo deploy com "Trigger deploy"
```

### Erro 500 no site

```
Solução:
1. Abra DevTools (F12)
2. Veja a aba "Console"
3. Procure por mensagens de erro
4. Verifique se Supabase está acessível
```

### Timeout no build

```
Solução:
1. Vá em "Build settings"
2. Aumente o timeout (padrão é 15 min)
3. Verifique se package.json tem dependências muito pesadas
```

---

## 🎉 Comparação: Netlify vs Vercel vs AWS Amplify

| Aspecto         | Netlify                  | Vercel              | AWS Amplify          |
| --------------- | ------------------------ | ------------------- | -------------------- |
| Setup           | ⭐⭐⭐ Muito fácil       | ⭐⭐⭐ Muito fácil  | ⭐⭐ Moderado        |
| Performance     | ⭐⭐⭐⭐ Excelente       | ⭐⭐⭐⭐⭐ Perfeito | ⭐⭐⭐⭐ Muito bom   |
| Free Tier       | ⭐⭐⭐⭐ Generoso        | ⭐⭐ Limitado       | ⭐⭐⭐ Bom           |
| Suporte Next.js | ⭐⭐⭐⭐ Plugin dedicado | ⭐⭐⭐⭐⭐ Nativo   | ⭐⭐⭐ Bom           |
| Preview PRs     | ⭐⭐⭐⭐⭐ Automático    | ⭐⭐⭐⭐ Automático | ⭐⭐⭐ Requer config |
| Customização    | ⭐⭐⭐⭐ Muito           | ⭐⭐⭐ Moderada     | ⭐⭐⭐⭐⭐ Total     |
| Preço           | ⭐⭐⭐⭐ Transparente    | ⭐⭐⭐ Justo        | ⭐⭐ Pode crescer    |

---

## 📞 Próximos Passos

1. **Adicionar package-lock.json** (se não tiver)

   ```bash
   npm install
   git add package-lock.json
   git commit -m "chore: Add package-lock.json"
   git push origin main
   ```

2. **Abrir Netlify Console** e conectar repositório

3. **Adicionar variáveis de ambiente** do Supabase

4. **Iniciar deploy** (automático)

5. **Testar a aplicação**

---

## ✅ Checklist Final

- [ ] package-lock.json no repositório
- [ ] netlify.toml no root do projeto
- [ ] Repositório GitHub conectado ao Netlify
- [ ] Variáveis de ambiente configuradas:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] Deploy completado com sucesso
- [ ] Site respondendo corretamente
- [ ] Supabase conectando
- [ ] Testes funcionando

---

**Você está pronto para fazer deploy no Netlify!** 🚀

Boa sorte! Se tiver dúvidas, consulte este guia ou a documentação oficial do Netlify.
