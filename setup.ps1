# Setup Script for CrossFit Gym - Complete Installation
# Run this to set up everything: Docker, environment, databases

param(
    [string]$Mode = "docker", # docker, local-dev, or test
    [switch]$Fresh = $false    # Recreate everything from scratch
)

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   CrossFit Gym Management System - Setup & Deployment     ║
║   Mode: $Mode                                            ║
║   Fresh Install: $Fresh                                  ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ============================================================
# DOCKER MODE
# ============================================================
if ($Mode -eq "docker") {
    Write-Host "`n📦 Docker Setup Mode" -ForegroundColor Yellow
    
    # Check Docker
    Write-Host "✓ Checking Docker installation..." -ForegroundColor Cyan
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Docker not found! Install Docker Desktop: https://www.docker.com" -ForegroundColor Red
        exit 1
    }
    Write-Host "  $dockerVersion" -ForegroundColor Green
    
    # Check Docker Compose
    $composeVersion = docker-compose --version 2>$null
    Write-Host "  $composeVersion" -ForegroundColor Green
    
    # Setup environment
    if (!(Test-Path ".env")) {
        Write-Host "`n⚙️  Creating .env file..." -ForegroundColor Cyan
        copy .env.example .env
        Write-Host "✓ Created .env - Update with your values!" -ForegroundColor Green
    } else {
        Write-Host "✓ .env already exists - skipping" -ForegroundColor Green
    }
    
    # Fresh install
    if ($Fresh) {
        Write-Host "`n🔄 Fresh Docker install..." -ForegroundColor Yellow
        docker-compose down -v --remove-orphans
        Write-Host "✓ Cleaned up Docker resources" -ForegroundColor Green
    }
    
    # Build and start
    Write-Host "`n🚀 Starting Docker services..." -ForegroundColor Cyan
    docker-compose build
    Write-Host "✓ Services built" -ForegroundColor Green
    
    docker-compose up -d
    Write-Host "✓ Services started" -ForegroundColor Green
    
    # Wait for services
    Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Check health
    $psqlReady = $false
    $maxAttempts = 10
    $attempt = 0
    
    while (-not $psqlReady -and $attempt -lt $maxAttempts) {
        try {
            docker-compose exec postgres pg_isready -U user 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $psqlReady = $true
                Write-Host "✓ Database ready" -ForegroundColor Green
            }
        } catch {}
        
        if (-not $psqlReady) {
            $attempt++
            Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $psqlReady) {
        Write-Host "⚠️  Database took longer than expected - continuing anyway" -ForegroundColor Yellow
    }
    
    # Run migrations
    Write-Host "`n📊 Running database migrations..." -ForegroundColor Cyan
    docker-compose exec -T backend npm run prisma:migrate:deploy 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migrations completed" -ForegroundColor Green
    }
    
    # Display status
    Write-Host "`n✅ Docker Deployment Complete!" -ForegroundColor Green
    Write-Host @"
Services running on:
  🌐 Frontend:      http://localhost:3000
  🔌 Backend API:   http://localhost:3001
  📄 PDF Service:   http://localhost:3002
  💾 Database:      localhost:5432

Useful Commands:
  View logs:        docker-compose logs -f backend
  Stop services:    docker-compose down
  Restart service:  docker-compose restart backend
  Database shell:   docker-compose exec postgres psql -U user -d crossfit_gym

Next Steps:
  1. Open http://localhost:3000 in browser
  2. Login with test credentials
  3. Create payments and test invoice generation
  4. Check generated PDFs in preview modal
"@ -ForegroundColor Cyan
}

# ============================================================
# LOCAL DEVELOPMENT MODE
# ============================================================
elseif ($Mode -eq "local-dev") {
    Write-Host "`n💻 Local Development Mode" -ForegroundColor Yellow
    
    # Check Node.js
    Write-Host "✓ Checking Node.js..." -ForegroundColor Cyan
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Node.js not found! Install: https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
    Write-Host "  $nodeVersion" -ForegroundColor Green
    
    # Check Python
    Write-Host "✓ Checking Python..." -ForegroundColor Cyan
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Python not found! Install: https://www.python.org/" -ForegroundColor Red
        exit 1
    }
    Write-Host "  $pythonVersion" -ForegroundColor Green
    
    # Setup environment
    if (!(Test-Path ".env")) {
        Write-Host "`n⚙️  Creating .env file..." -ForegroundColor Cyan
        copy .env.example .env
        Write-Host "✓ Created .env" -ForegroundColor Green
    }
    
    # Install backend deps
    Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Cyan
    cd backend
    npm install
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    cd ..
    
    # Install frontend deps
    Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Cyan
    cd frontend
    npm install
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    cd ..
    
    # Setup Python venv
    Write-Host "`n🐍 Setting up Python virtual environment..." -ForegroundColor Cyan
    if (!(Test-Path "venv")) {
        python -m venv venv
        Write-Host "✓ Virtual environment created" -ForegroundColor Green
    }
    
    &".\venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green
    
    Write-Host "`n✅ Local Development Ready!" -ForegroundColor Green
    Write-Host @"
Start services in separate terminals:

Terminal 1 (PDF Service):
  python main.py

Terminal 2 (Backend):
  cd backend
  npm run dev

Terminal 3 (Frontend):
  cd frontend
  npm run dev

Services will run on:
  Frontend:  http://localhost:3000
  Backend:   http://localhost:3001
  PDF API:   http://localhost:3002

"@ -ForegroundColor Cyan
}

# ============================================================
# TEST MODE
# ============================================================
elseif ($Mode -eq "test") {
    Write-Host "`n🧪 Test Mode" -ForegroundColor Yellow
    
    Write-Host "`n📝 Running PDF Generation Tests..." -ForegroundColor Cyan
    python test_pdf_service.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Tests passed!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Tests failed" -ForegroundColor Red
    }
}

else {
    Write-Host "Invalid mode! Use: docker, local-dev, or test" -ForegroundColor Red
    exit 1
}

Write-Host "`n" -ForegroundColor Cyan
