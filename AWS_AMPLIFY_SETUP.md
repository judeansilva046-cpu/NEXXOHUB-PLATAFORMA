# 🚀 Guia Completo - Deploy NexxoHub no AWS Amplify

## 📋 Pré-requisitos

- ✅ Conta AWS (criar em https://aws.amazon.com)
- ✅ GitHub conectado à AWS
- ✅ Repositório GitHub: `judeansilva046-cpu/NEXXOHUB-PLATAFORMA`
- ✅ Variáveis Supabase prontas

---

## 🔧 Passo 1: Preparar Variáveis de Ambiente

### Variáveis que você vai precisar:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-amplify-url.amplifyapp.com
```

### Como encontrar:
1. Acesse **Supabase Dashboard**
2. Vá em **Settings** → **API**
3. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🌐 Passo 2: Conectar ao AWS Amplify

### 2.1 - Acessar AWS Amplify Console
```
1. Vá para: https://console.aws.amazon.com/amplify/
2. Clique em "Create app" → "Host web app"
3. Selecione: GitHub
4. Clique em "Continue"
```

### 2.2 - Autorizar GitHub
```
1. Clique em "Authorize AWS Amplify on GitHub"
2. Faça login na sua conta GitHub
3. Selecione o repositório: NEXXOHUB-PLATAFORMA
4. Clique em "Connect branch"
```

### 2.3 - Selecionar Branch
```
1. Selecione branch: main
2. Clique em "Next"
```

---

## ⚙️ Passo 3: Configurar Build Settings

### 3.1 - Build Configuration
```
1. Na tela "Configure build settings":
2. Build command: npm run build
3. Base directory: .next
4. Clique em "Edit"
```

### 3.2 - Editar amplify.yml
Já foi criado na raiz do seu projeto com as configurações corretas.

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - 'node_modules/**/*'
      - '.next/cache/**/*'
```

---

## 🔐 Passo 4: Configurar Variáveis de Ambiente

### Na AWS Amplify Console:

```
1. Acesse "Environment variables"
2. Clique em "Add variable"
3. Adicione cada variável:

   Nome: NEXT_PUBLIC_SUPABASE_URL
   Valor: https://seu-project.supabase.co

   Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Valor: eyJhbGciOi...

   Nome: SUPABASE_SERVICE_ROLE_KEY
   Valor: eyJhbGciOi...

   Nome: NODE_ENV
   Valor: production

4. Clique em "Save"
```

---

## ✅ Passo 5: Revisar e Deploy

```
1. Clique em "Save and deploy"
2. Amplify iniciará o build automaticamente
3. Aguarde o deploy completar (5-10 minutos)
4. Você receberá uma URL: amplify-xxxxx.amplifyapp.com
```

---

## 📊 Monitorar Deploy

### Durante o Build:
```
1. Vá em "Deployments"
2. Clique no deploy em progresso
3. Veja logs em tempo real
4. Status esperado:
   ✅ Provisioning
   ✅ Build
   ✅ Deploy
   ✅ Verify
```

### Se houver erro:
1. Clique na etapa que falhou
2. Leia os logs
3. Erros comuns:
   - Missing env variables → Adicionar no Amplify console
   - Node modules not found → Verificar `package.json`
   - Build failed → Rodar `npm run build` localmente para debug

---

## 🔄 Passo 6: Configurar Domain Personalizado (Opcional)

```
1. Vá em "Domain management"
2. Clique em "Add domain"
3. Adicione seu domínio customizado
4. Configure DNS apontando para Amplify
5. Aguarde SSL certificate (pode levar 24h)
```

---

## 📱 Passo 7: Testes Pós-Deploy

Após o deploy estar "Live":

```
✅ Acesse a URL do Amplify
✅ Teste login com Supabase
✅ Crie uma Clinic, Company, Employee
✅ Teste filtros e busca
✅ Verifique responsive design
✅ Teste em mobile
```

---

## 🚀 Configurar CI/CD Automático

### Deploys automáticos em cada push:

```
1. Já está configurado por padrão!
2. Cada push para "main" triggers novo build
3. Se houver erro, o deploy anterior permanece ativo
4. Você pode reverter facilmente no console
```

---

## 📈 Monitorar Performance

No **Amplify Console**:

```
1. Vá em "Monitoring"
2. Veja:
   - Build time
   - Deployment duration
   - Error rates
   - Performance metrics
```

---

## 🔧 Variáveis de Ambiente - Checklist

- [ ] NEXT_PUBLIC_SUPABASE_URL adicionada
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY adicionada
- [ ] SUPABASE_SERVICE_ROLE_KEY adicionada
- [ ] NODE_ENV = production
- [ ] Todas as variáveis começadas com `NEXT_PUBLIC_` são visíveis no browser
- [ ] Variáveis sem `NEXT_PUBLIC_` são server-only

---

## ❓ Troubleshooting

### Build falha com "Cannot find module"
```
Solução:
1. Execute localmente: npm run build
2. Corrija erros
3. Faça commit e push
4. Amplify refará o build
```

### Variáveis não são lidas no frontend
```
Solução:
1. Certifique-se que começa com NEXT_PUBLIC_
2. Reinicie o build
3. Limpe cache do browser (Ctrl+Shift+Delete)
```

### Supabase não conecta
```
Solução:
1. Verifique NEXT_PUBLIC_SUPABASE_URL
2. Verifique NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Teste com curl:
   curl https://seu-project.supabase.co/
4. Deve retornar resposta do Supabase
```

### Timeout no build
```
Solução:
1. Verifique se npm ci está no preBuild
2. Aumente timeout em amplify.yml
3. Considere usar cache
```

---

## 🎉 Sucesso!

Seu NexxoHub estará disponível em:
```
https://main.xxxxx.amplifyapp.com
```

Você terá:
- ✅ Deploy automático em cada push para main
- ✅ Preview de PRs antes de mergear
- ✅ Logs detalhados
- ✅ Rollback fácil
- ✅ Performance monitoring
- ✅ HTTPS automático

---

## 📞 Próximos Passos

1. **Fazer commit e push** do arquivo `amplify.yml`
2. **Abrir AWS Amplify Console** e conectar repositório
3. **Adicionar variáveis de ambiente**
4. **Iniciar deploy**
5. **Testar a aplicação**

Boa sorte! 🚀
