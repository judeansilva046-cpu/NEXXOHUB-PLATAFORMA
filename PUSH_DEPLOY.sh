#!/bin/bash

# Script para fazer commit e push para GitHub
# Executar na pasta raiz do projeto

echo "🚀 NexxoHub - Deploy Script"
echo "=================================="
echo ""

# Passo 1: Remover lock file se existir
echo "1️⃣ Limpando git lock file..."
rm -f .git/index.lock 2>/dev/null || true
sleep 1

# Passo 2: Verificar status
echo "2️⃣ Status atual:"
git status --short | head -10
echo ""

# Passo 3: Adicionar vercel.json
echo "3️⃣ Adicionando vercel.json (corrigido)..."
git add vercel.json
echo "✅ vercel.json adicionado"
echo ""

# Passo 4: Commit
echo "4️⃣ Fazendo commit..."
git commit -m "fix: Remove invalid env block from vercel.json - use Vercel panel instead"
echo "✅ Commit realizado"
echo ""

# Passo 5: Push para GitHub
echo "5️⃣ Enviando para GitHub..."
git push origin main
echo "✅ Push realizado"
echo ""

echo "=================================="
echo "✅ SUCESSO!"
echo "=================================="
echo ""
echo "Próximos passos:"
echo "1. GitHub Actions vai rodar automaticamente"
echo "2. Vercel vai fazer o build"
echo "3. Website vai ficar live"
echo ""
echo "Monitore em:"
echo "  • GitHub: https://github.com/judeansilva046-cpu/NEXXOHUB-PLATAFORMA/actions"
echo "  • Vercel: https://vercel.com/dashboard"
echo ""
