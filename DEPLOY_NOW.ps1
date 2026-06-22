# Script PowerShell para fazer PUSH automático
# Executar no PowerShell como administrador

Write-Host "🚀 NexxoHub Deploy Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Ir para a pasta do projeto
cd C:\Users\User\NEXXOHUB-PLATAFORMA

# Passo 1: Remover lock file
Write-Host "1️⃣ Removendo lock files..." -ForegroundColor Yellow
Remove-Item -Path ".git\index.lock" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Passo 2: Verificar status
Write-Host "2️⃣ Status do repositório:" -ForegroundColor Yellow
git status --short | Select-Object -First 10
Write-Host ""

# Passo 3: Adicionar vercel.json
Write-Host "3️⃣ Adicionando vercel.json..." -ForegroundColor Yellow
git add vercel.json
Write-Host "✅ vercel.json adicionado" -ForegroundColor Green
Write-Host ""

# Passo 4: Fazer commit
Write-Host "4️⃣ Fazendo commit..." -ForegroundColor Yellow
git commit -m "fix: Remove invalid env block from vercel.json - use Vercel panel"
Write-Host "✅ Commit realizado" -ForegroundColor Green
Write-Host ""

# Passo 5: Push
Write-Host "5️⃣ Enviando para GitHub..." -ForegroundColor Yellow
git push origin main
Write-Host "✅ Push realizado" -ForegroundColor Green
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ SUCESSO!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. GitHub Actions vai rodar" -ForegroundColor White
Write-Host "2. Vercel vai fazer o build" -ForegroundColor White
Write-Host "3. Website vai ficar live" -ForegroundColor White
Write-Host ""
Write-Host "Monitore em:" -ForegroundColor Cyan
Write-Host "  • GitHub: https://github.com/judeansilva046-cpu/NEXXOHUB-PLATAFORMA/actions" -ForegroundColor Cyan
Write-Host "  • Vercel: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""

# Pausa para o usuário ver o resultado
Read-Host "Pressione ENTER para fechar"
