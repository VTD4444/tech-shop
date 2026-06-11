# Setup Guide

## Prerequisites

- Node.js 22+
- Python 3.12+
- Docker Desktop (for PostgreSQL)
- npm or yarn

## 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# AI Service
cd ../ai-service
pip install -r requirements.txt
```

## 2. Environment Variables

### `backend/.env`

```env
DATABASE_URL=postgresql://techshop:techshop_pass@localhost:5432/techshop
JWT_SECRET=change-me-in-production-jwt-secret
JWT_REFRESH_SECRET=change-me-in-production-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/v1/payments/vnpay/return
AI_SERVICE_URL=http://localhost:8000/api/v1
PORT=3000
```

### `frontend/.env`

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NUXT_PUBLIC_AI_API_URL=http://localhost:8000/api/v1
```

### `ai-service/.env`

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://techshop:techshop_pass@localhost:5432/techshop
BACKEND_API_URL=http://localhost:3000/api/v1
```

## 3. Start Database

```bash
docker compose up -d postgres
```

## 4. Database Migration & Seed

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migration
npx prisma migrate dev --name init

# Seed sample data
npx prisma db seed
```

**Seed data includes:**
- Admin: `admin@techshop.com` / `admin123`
- Customer: `customer@test.com` / `customer123`
- 9 categories (CPU, Mainboard, VGA, RAM, Storage, PSU, Case, Cooler, Laptop)
- 5 brands (Intel, AMD, NVIDIA, Corsair, Samsung)
- 8 products with pc_components and product_specs

## 5. Run Development Servers

```bash
# Terminal 1: Backend (http://localhost:3000)
cd backend && npm run start:dev

# Terminal 2: Frontend (http://localhost:3001)
cd frontend && npm run dev

# Terminal 3: AI Service (http://localhost:8000)
cd ai-service && uvicorn app.main:app --reload --port 8000
```

## 6. Docker Full Stack

```bash
docker compose up --build
```

This starts:
- `postgres` on `:5432`
- `backend` on `:3000`
- `frontend` on `:3001`
- `ai-service` on `:8000`

## 7. VNPAY Sandbox Setup

1. Register at https://sandbox.vnpayment.vn/merchantv2/
2. Get `TMN_CODE` and `HASH_SECRET`
3. Set in `backend/.env`:
   ```env
   VNPAY_TMN_CODE=your_code
   VNPAY_HASH_SECRET=your_secret
   VNPAY_RETURN_URL=http://localhost:3000/api/v1/payments/vnpay/return
   ```
4. Test cards: https://sandbox.vnpayment.vn/apis/

## 8. Gemini API Setup

1. Get API key from https://aistudio.google.com/apikey
2. Set in `ai-service/.env`:
   ```env
   GEMINI_API_KEY=your_key
   ```

## npm Scripts

### Backend

| Script | Description |
|---|---|
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile TypeScript |
| `npm run start:prod` | Run compiled JS |
| `npm run test` | Unit tests (Jest) |
| `npm run lint` | ESLint |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma migrate dev` | Run pending migrations |
| `npx prisma db seed` | Seed database |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Dev server on :3001 |
| `npm run build` | Production build |
| `npm run generate` | Static generation |
| `npm run preview` | Preview production build |
