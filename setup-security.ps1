# 🔒 SCRIPT DE CONFIGURAÇÃO DE SEGURANÇA - TASKORA
# Instala e configura o sistema de detecção de segredos e pre-commit hooks

Write-Host "🔒 CONFIGURANDO SISTEMA DE SEGURANÇA TASKORA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Verificar se Python está instalado
Write-Host "🐍 Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python não encontrado! Instale Python 3.7+ primeiro." -ForegroundColor Red
    Write-Host "📥 Download: https://www.python.org/downloads/" -ForegroundColor Blue
    exit 1
}

# Verificar se pip está disponível
Write-Host "📦 Verificando pip..." -ForegroundColor Yellow
try {
    $pipVersion = pip --version 2>&1
    Write-Host "✅ pip encontrado: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pip não encontrado!" -ForegroundColor Red
    exit 1
}

# Instalar pre-commit
Write-Host "🔧 Instalando pre-commit..." -ForegroundColor Yellow
try {
    pip install pre-commit
    Write-Host "✅ pre-commit instalado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar pre-commit!" -ForegroundColor Red
    exit 1
}

# Instalar detect-secrets
Write-Host "🔍 Instalando detect-secrets..." -ForegroundColor Yellow
try {
    pip install detect-secrets
    Write-Host "✅ detect-secrets instalado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar detect-secrets!" -ForegroundColor Red
    exit 1
}

# Verificar se Node.js está instalado (para ESLint)
Write-Host "🟢 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    
    # Instalar dependências do ESLint
    Write-Host "📦 Instalando dependências ESLint..." -ForegroundColor Yellow
    npm install --save-dev eslint eslint-plugin-security
    Write-Host "✅ Dependências ESLint instaladas!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Node.js não encontrado. ESLint não será configurado." -ForegroundColor Yellow
    Write-Host "📥 Download Node.js: https://nodejs.org/" -ForegroundColor Blue
}

# Instalar hooks do pre-commit
Write-Host "🪝 Instalando pre-commit hooks..." -ForegroundColor Yellow
try {
    pre-commit install
    Write-Host "✅ Pre-commit hooks instalados!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar pre-commit hooks!" -ForegroundColor Red
    exit 1
}

# Executar primeira verificação
Write-Host "🔍 Executando primeira verificação de segurança..." -ForegroundColor Yellow
try {
    pre-commit run --all-files
    Write-Host "✅ Verificação inicial concluída!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Alguns problemas foram encontrados. Verifique os logs acima." -ForegroundColor Yellow
}

# Atualizar baseline de segredos
Write-Host "📝 Atualizando baseline de segredos..." -ForegroundColor Yellow
try {
    detect-secrets scan --baseline .secrets.baseline
    Write-Host "✅ Baseline atualizado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao atualizar baseline. Continuando..." -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 CONFIGURAÇÃO DE SEGURANÇA CONCLUÍDA!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. ✅ Configure suas chaves reais no arquivo .env" -ForegroundColor White
Write-Host "2. ✅ Teste um commit para verificar os hooks" -ForegroundColor White
Write-Host "3. ✅ Execute 'pre-commit run --all-files' periodicamente" -ForegroundColor White
Write-Host "4. ✅ Revise a documentação em docs/configuracao/" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔒 COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host "• pre-commit run --all-files    # Executar todas as verificações" -ForegroundColor White
Write-Host "• detect-secrets scan           # Escanear por novos segredos" -ForegroundColor White
Write-Host "• pre-commit autoupdate         # Atualizar hooks" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "⚠️ IMPORTANTE: Sempre teste os hooks antes de commits importantes!" -ForegroundColor Yellow