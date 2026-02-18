# 🐳 Docker Deployment Guide - CrossFit Gym Management System

## Overview

Complete Docker deployment with:
- PostgreSQL database
- Node.js backend API
- Python PDF generator service
- Next.js frontend

All services communicate through a dedicated Docker network.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB free RAM minimum
- 10GB free disk space

## Quick Start

### 1. Clone and Setup

```bash
cd d:\crossfit gym
copy .env.example .env
# Edit .env with your values
```

### 2. Build and Start All Services

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL on port 5432
- Start Backend API on port 3001
- Start PDF Generator on port 3002
- Start Frontend on port 3000

### 3. Initialize Database

```bash
# Run migrations
docker-compose exec backend npm run prisma:migrate:deploy

# Seed database (optional)
docker-compose exec backend npm run prisma:seed
```

### 4. Access Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PDF API Docs: http://localhost:3002/docs
- Database: localhost:5432

## Service Details

### PostgreSQL (postgres)

```yaml
Container: crossfit_gym_db
Port: 5432
Volumes: postgres_data
Healthcheck: pg_isready
```

### Backend (backend)

```yaml
Container: crossfit_gym_backend
Port: 3001
Dependencies: postgres, pdf-generator
Volumes: ./backend/uploads
Environment:
  - DATABASE_URL
  - JWT_SECRET
  - USE_PYTHON_PDF_SERVICE
  - PYTHON_PDF_SERVICE_URL
```

### PDF Generator (pdf-generator)

```yaml
Container: crossfit_gym_pdf
Port: 3002
Features:
  - ReportLab PDF generation
  - QR code embedding
  - Professional layout
  - CORS enabled
Healthcheck: HTTP /health
```

### Frontend (frontend)

```yaml
Container: crossfit_gym_frontend
Port: 3000
Dependencies: backend
Environment:
  - NEXT_PUBLIC_API_URL
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f pdf-generator

# Last 50 lines
docker-compose logs --tail=50 backend
```

### Stop Services

```bash
# Stop all
docker-compose down

# Stop specific
docker-compose stop backend

# Stop and remove volumes (careful!)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart backend pdf-generator
```

### Execute Commands

```bash
# Backend commands
docker-compose exec backend npm run prisma:studio
docker-compose exec backend npm run prisma:migrate:dev
docker-compose exec backend npm test

# Frontend commands
docker-compose exec frontend npm run build
docker-compose exec frontend npm run lint

# Database access
docker-compose exec postgres psql -U user -d crossfit_gym
```

## Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)

### PDF Service
- `USE_PYTHON_PDF_SERVICE` - Enable Python PDF service (true/false)
- `PYTHON_PDF_SERVICE_URL` - URL to PDF service (internal: http://pdf-generator:3002)

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Health Checks

### Database
```bash
docker-compose exec postgres pg_isready -U user
```

### Backend
```bash
curl http://localhost:3001/api/health
```

### PDF Service
```bash
curl http://localhost:3002/health
```

### Frontend
```bash
curl http://localhost:3000
```

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Configure firewall rules
- [ ] Enable HTTPS/SSL
- [ ] Set up backup strategy
- [ ] Monitor logs and metrics

### Environment Configuration

```env
# Production settings
NODE_ENV=production
USE_PYTHON_PDF_SERVICE=true
JWT_SECRET=<generate-strong-secret>
DB_PASSWORD=<strong-password>
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### Backup Strategy

```bash
# Backup database
docker-compose exec postgres pg_dump -U user crossfit_gym > backup.sql

# Backup volumes
docker run --rm -v crossfit_gym_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db.tar.gz -C /data .

# Backup uploads
docker cp crossfit_gym_backend:/app/uploads ./uploads.backup
```

### Resource Limits

Update docker-compose.yml to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Failed
```bash
# Check database is running
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres pg_isready -U user
```

### PDF Service Not Responding
```bash
# Check health
curl http://localhost:3002/health

# View logs
docker-compose logs pdf-generator

# Restart service
docker-compose restart pdf-generator
```

### Out of Memory
```bash
# Check resource usage
docker stats

# Increase Docker memory limit or restart services
docker-compose restart
```

## Monitoring

### Real-time Stats
```bash
docker stats crossfit_gym_backend crossfit_gym_pdf crossfit_gym_db
```

### Container Logs with Timestamps
```bash
docker-compose logs --timestamps backend
```

### Log Aggregation (optional)
Consider using ELK stack or Datadog for production.

## Scaling

### Horizontal Scaling (Multiple Backend Instances)

```yaml
services:
  backend1:
    extends:
      service: backend
    container_name: backend1
    ports:
      - "3001:3001"
      
  backend2:
    extends:
      service: backend
    container_name: backend2
    ports:
      - "3002:3001"  # Note: nginx reverse proxy recommended
```

### Add Nginx Reverse Proxy

Create `nginx.conf`:
```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
}

server {
    listen 3001;
    location / {
        proxy_pass http://backend;
    }
}
```

## API Testing

### Health Checks
```bash
# Backend
curl -v http://localhost:3001/health

# PDF Service
curl -v http://localhost:3002/health
```

### Generate PDF
```bash
curl -X POST http://localhost:3002/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "amount": 1500.00,
    "member_name": "Teste Member",
    "plan_name": "Premium Monthly",
    "payment_method": "Cash",
    "receipt_number": "RCP001"
  }' \
  -o test.pdf
```

## Next Steps

1. **Backup Strategy**: Implement automated database backups
2. **Monitoring**: Add application monitoring (APM)
3. **CI/CD**: Set up GitHub Actions or GitLab CI
4. **Load Testing**: Test with production-like load
5. **Documentation**: Update team documentation
6. **Training**: Train team on Docker operations

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify network: `docker-compose exec backend ping pdf-generator`
3. Test services individually
4. Check Docker disk/memory usage

