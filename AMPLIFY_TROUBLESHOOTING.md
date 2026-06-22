# 🔧 AWS Amplify - Troubleshooting

## ❌ Erro: "The dependency install command failed"

### 🔍 Causa
Falta `package-lock.json` no repositório. AWS Amplify precisa dele para instalar dependências com segurança.

---

## ✅ Solução Rápida (Recomendada)

### No seu computador local:

```bash
# 1. Abra PowerShell ou CMD
cd C:\Users\User\NEXXOHUB-PLATAFORMA

# 2. Instale as dependências (cria package-lock.json automaticamente)
npm install

# 3. Faça commit e push
git add package-lock.json
git commit -m "chore: Add package-lock.json for Amplify"
git push origin main

# 4. Volte ao Amplify Console e clique em "Redeploy this version"
```

**Isso vai resolver o problema em 100% dos casos! ✅**

---

## ⚙️ O que foi mudado

### amplify.yml atualizado
- Mudou de `npm ci` para `npm install` (mais flexível)
- Adicionado cache do npm
- Mantém as configurações de build

### Próxima ação no Amplify
```
1. Vá em "Deployments"
2. Encontre o deploy que falhou
3. Clique em "Redeploy this version"
4. Agora com package-lock.json, vai funcionar!
```

---

## 📊 Checklist de Deploy AWS Amplify

- [ ] Repositório GitHub conectado ao Amplify
- [ ] Branch "main" selecionado
- [ ] **package-lock.json** adicionado ao repositório ← IMPORTANTE!
- [ ] Variáveis de ambiente configuradas:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] NODE_ENV = production
- [ ] Node version: 18.x ou superior
- [ ] amplify.yml no root do repositório

---

## 🚀 Se ainda der erro após adicionar package-lock.json

### Verifique:

1. **Node Version no Amplify**
   ```
   1. Vá em "Build settings"
   2. Clique em "Edit"
   3. Defina: Node version = 18 ou superior
   4. Clique "Save"
   ```

2. **Limpar cache do Amplify**
   ```
   1. Build settings
   2. Clique em "Clear cache"
   3. Faça novo deploy
   ```

3. **Verificar package.json localmente**
   ```bash
   npm audit
   npm ls
   ```

4. **Se houver conflitos de dependências**
   ```bash
   npm install --legacy-peer-deps
   git add package-lock.json
   git commit -m "chore: Update package-lock with legacy deps"
   git push origin main
   ```

---

## 📋 Logs do Amplify - Como ler

No Amplify Console, durante o build:

```
✅ SUCCESS = verde
⏳ IN PROGRESS = azul
❌ FAILED = vermelho
⚠️  WARNING = amarelo
```

Para ver os erros:
```
1. Clique no deployment que falhou
2. Vá em "Logs"
3. Procure por linhas em vermelho
4. Leia a mensagem de erro
5. Use as soluções acima
```

---

## 🎯 Resumo - 3 Passos Finais

### Passo 1: No seu computador
```bash
cd C:\Users\User\NEXXOHUB-PLATAFORMA
npm install
git add package-lock.json
git commit -m "chore: Add package-lock.json"
git push origin main
```

### Passo 2: No Amplify Console
```
1. Vá em "Deployments"
2. Clique em "Redeploy this version"
3. Aguarde 5-10 minutos
```

### Passo 3: Testar
```
1. Acesse a URL do Amplify
2. Teste login, criar dados, etc
3. Verifique no console do navegador se há erros
```

---

## ✅ Sucesso!

Se seguir esses passos, seu NexxoHub vai estar rodando no AWS Amplify! 🚀

---

## 📞 Precisa de mais ajuda?

- Verifique os **logs em tempo real** no Amplify Console
- Consulte AWS Amplify docs: https://docs.amplify.aws/
- Verque Next.js deployment: https://nextjs.org/docs/deployment
