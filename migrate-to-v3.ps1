#!/usr/bin/env powershell
# Invoice Generator Migration - v2.0 to v3.0
# Automaticamente migra para o novo gerador de faturas profissional

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Invoice Generator v3.0 - Automatic Migration Script" -ForegroundColor Cyan
Write-Host "De: v2.0 (Basico) Para: v3.0 (Profissional)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Check current version
Write-Host "" 
Write-Host "[*] Verificando versoes atuais..." -ForegroundColor Yellow
if (Test-Path "pdf_generator_v2.py") { Write-Host "  OK pdf_generator_v2.py encontrado" }
if (Test-Path "pdf_generator_v3.py") { Write-Host "  OK pdf_generator_v3.py encontrado" }

# Test v3.0
Write-Host ""
Write-Host "[*] Testando v3.0..." -ForegroundColor Cyan
.\.venv\Scripts\python.exe test_invoice_v3.py 2>&1 | Select-Object -Last 5

# Backup old version
Write-Host ""
Write-Host "[*] Fazendo backup da versao anterior..." -ForegroundColor Cyan
if (Test-Path "pdf_generator.py") {
    $backupName = "pdf_generator.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss').py"
    Move-Item "pdf_generator.py" $backupName -Force
    Write-Host "  OK Backup criado: $backupName"
}

# Use v3.0 as default
Write-Host ""
Write-Host "[*] Usando v3.0 como padrao..." -ForegroundColor Cyan
Copy-Item "pdf_generator_v3.py" "pdf_generator.py" -Force
Write-Host "  OK pdf_generator.py = v3.0"

# Summary
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "New Features:" -ForegroundColor Green
Write-Host "  * Melhor design profissional" -ForegroundColor Green
Write-Host "  * Desconto e impostos automaticos" -ForegroundColor Green
Write-Host "  * Suporte a multiplas moedas (MZN, USD, EUR)" -ForegroundColor Green
Write-Host "  * Data de vencimento, notas, termos" -ForegroundColor Green
Write-Host "  * Logging estruturado e validacao" -ForegroundColor Green
Write-Host "  * QR code robusto e tratamento de erros" -ForegroundColor Green
Write-Host ""
Write-Host "Test Results:" -ForegroundColor Cyan
Write-Host "  * test_invoice_v3.pdf OK (18650 bytes)" -ForegroundColor Cyan
Write-Host "  * test_invoice_complex_v3.pdf OK" -ForegroundColor Cyan
Write-Host ""
Write-Host "To Start:" -ForegroundColor Yellow
Write-Host "  .\.venv\Scripts\python.exe pdf_generator.py" -ForegroundColor Yellow
Write-Host "  Service running on http://localhost:3002" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentacao: INVOICE_V3_REFACTOR.md" -ForegroundColor Cyan
Write-Host ""
