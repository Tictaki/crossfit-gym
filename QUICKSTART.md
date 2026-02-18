# ⚡ Quick Start - 5 Minutes to Running System

## 🚀 Start Here

### Option 1: Docker (Recommended)
```powershell
# 1. Run setup
.\setup.ps1 -Mode docker

# 2. Wait for services to start (~2 minutes)

# 3. Open browser
Start-Process "http://localhost:3000"
```

### Option 2: Local Development
```powershell
# 1. Run setup (installs all dependencies)
.\setup.ps1 -Mode local-dev

# 2. In Terminal 1
python pdf_generator_v2.py

# 3. In Terminal 2
cd backend; npm run dev

# 4. In Terminal 3
cd frontend; npm run dev
```

---

## 📋 What You Get

✅ **Invoice Management System**
- Create and track payments
- Automatic receipt numbering
- Refund tracking
- Audit trails

✅ **Professional PDFs**
- Custom branding (#FF6B00 orange)
- QR code for verification
- Amount in Portuguese words
- Professional layout

✅ **Full Software Stack**
- PostgreSQL database
- Node.js backend API
- Python PDF generator service
- Next.js frontend

✅ **Production Ready**
- Docker containerization
- Health checks
- Error handling
- Security features

---

## 🔍 Verify Installation

### Check Services
```powershell
# Docker
docker-compose ps

# Or access endpoints
curl http://localhost:3000    # Frontend
curl http://localhost:3001    # Backend API
curl http://localhost:3002/health  # PDF Service
```

### Test PDF Generation
```powershell
curl -X POST http://localhost:3002/generate-pdf `
  -H "Content-Type: application/json" `
  -d '{"id":"test","amount":1500,"member_name":"Test","plan_name":"Premium","payment_method":"Cash","receipt_number":"RCP001"}' `
  -o test.pdf
```

---

## 📚 Documentation

- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - What was implemented
- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Docker guide
- **[PDF_GENERATOR_README.md](PDF_GENERATOR_README.md)** - PDF service details

---

## ⚙️ Configuration

### Environment Variables
Edit `.env` file before starting:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crossfit_gym

# Security (CHANGE THIS!)
JWT_SECRET=your-super-secret-key-12345

# Services
USE_PYTHON_PDF_SERVICE=true
PYTHON_PDF_SERVICE_URL=http://localhost:3002
```

---

## 🆘 Troubleshooting

### Services won't start
```powershell
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Check ports
netstat -ano | findstr ":3000\|:3001\|:3002"
```

### Docker issues
```powershell
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Full clean restart
docker-compose down -v
docker-compose up -d
```

### PDF generation fails
```powershell
# Check service
curl http://localhost:3002/health

# Restart
docker-compose restart pdf-generator
```

---

## 📞 Support

Each component has detailed documentation:
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- PDF Service: `PDF_GENERATOR_README.md`
- Docker: `DOCKER_DEPLOYMENT.md`

---

## ✅ Next Steps

1. **Run setup**
2. **Test PDF generation** (see "Verify Installation")
3. **Create a payment** in the system
4. **Download receipt** - should have QR code
5. **Scale to production** using Docker Compose

---

🎉 **Your CrossFit Gym Management System is ready!**
