# TechShop — Tech E-commerce Platform

Monorepo with Nuxt 3 frontend, NestJS API, FastAPI AI advisor, and PostgreSQL.

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Backend
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run start:dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev

# 4. AI Service (new terminal)
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Default Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techshop.com | admin123 |
| Customer | customer@test.com | customer123 |

## Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| API | http://localhost:3000/api/v1 |
| AI Advisor | http://localhost:8000/api/v1 |
| PostgreSQL | localhost:5433 |

## Documentation

| Doc | Topic |
|-----|--------|
| [docs/SETUP.md](docs/SETUP.md) | Local setup |
| [docs/VNPAY_INTEGRATION.md](docs/VNPAY_INTEGRATION.md) | VNPay payments |
| [docs/RESEND_INTEGRATION.md](docs/RESEND_INTEGRATION.md) | Email (Resend) |
| [docs/SETUP_PRODUCTION.md](docs/SETUP_PRODUCTION.md) | Production checklist |

See [docs/SETUP.md](docs/SETUP.md) for full configuration.
