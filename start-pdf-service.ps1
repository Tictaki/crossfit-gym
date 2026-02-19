# Script para instalar e executar o serviço de PDF em Python
# Executar: .\start-pdf-service.ps1

Write-Host "🔧 Configurando PDF Generator Service..." -ForegroundColor Cyan

# Verificar se Python está instalado
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Python não encontrado! Instale Python 3.10+" -ForegroundColor Red
    Write-Host "Baixe em: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Diretório do projeto
$projectDir = "d:\crossfit gym"
Set-Location $projectDir

# Verificar/criar ambiente virtual
if (-not (Test-Path "venv")) {
    Write-Host "📦 Criando ambiente virtual..." -ForegroundColor Cyan
    python -m venv venv
}

# Ativar ambiente virtual
Write-Host "🔌 Ativando ambiente virtual..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Instalar/atualizar dependências
Write-Host "📥 Instalando dependências..." -ForegroundColor Cyan
pip install -r pdf-service\requirements.txt --quiet

# Verificar se foi bem instalado
$reportlab = pip show reportlab 2>$null
if ($reportlab) {
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Problema ao instalar dependências. Tente:" -ForegroundColor Yellow
    Write-Host "   pip install -r requirements.txt" -ForegroundColor Yellow
}

# Verificar porta
Write-Host "🔍 Verificando porta 3002..." -ForegroundColor Cyan
$port = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "⚠️  Porta 3002 já está em uso! Encerrando processos antigos..." -ForegroundColor Yellow
    Stop-Process -Id $port.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Executar serviço
Write-Host "🚀 Iniciando PDF Generator Service..." -ForegroundColor Green
Write-Host "   URL: http://localhost:3002" -ForegroundColor Cyan
Write-Host "   Health: http://localhost:3002/health" -ForegroundColor Cyan
Write-Host "   Docs: http://localhost:3002/docs" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Pressione Ctrl+C para parar o serviço" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

python pdf-service\main.py
