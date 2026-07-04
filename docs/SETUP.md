# Setup Guide

## Prerequisites

- Node.js 22+
- Python 3.12+
- Docker Desktop (PostgreSQL; optional Redis)
- npm

## 1. Clone & install

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../ai-service && python -m venv .venv && .venv\Scripts\pip install -r requirements.txt
```

On macOS/Linux, use `source .venv/bin/activate` and `pip install -r requirements.txt`.

## 2. Environment variables

Copy examples and fill in secrets:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env
```

### `backend/.env` (main)

```env
DATABASE_URL=postgresql://techshop:techshop_pass@localhost:5433/techshop
JWT_SECRET=change-me-in-production-jwt-secret
JWT_REFRESH_SECRET=change-me-in-production-refresh-secret
FRONTEND_URL=http://localhost:3001
PORT=3000

# SePay — see docs/SEPAY_INTEGRATION.md
SEPAY_ENV=sandbox
SEPAY_MERCHANT_ID=
SEPAY_SECRET_KEY=
SEPAY_CHECKOUT_URL=https://pay-sandbox.sepay.vn/v1/checkout/init
SEPAY_SUCCESS_URL=http://localhost:3001/payments/return?status=success
SEPAY_ERROR_URL=http://localhost:3001/payments/return?status=error
SEPAY_CANCEL_URL=http://localhost:3001/payments/return?status=cancel

# Resend — see docs/RESEND_INTEGRATION.md
RESEND_API_KEY=re_your_api_key
MAIL_FROM=TechShop <onboarding@resend.dev>

# Cloudinary (admin image upload)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

AI_SERVICE_URL=http://localhost:8000/api/v1
```

PostgreSQL in Docker maps host port **5433** → container `5432` (see `docker-compose.yml`).

### `frontend/.env`

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
# Recommended local dev: Nuxt proxies /api/ai → http://127.0.0.1:8000/api/v1
NUXT_PUBLIC_AI_API_URL=/api/ai
```

Proxy is configured in `frontend/nuxt.config.ts`:
```ts
routeRules: {
  '/api/ai/**': { proxy: 'http://127.0.0.1:8000/api/v1/**' },
}
```

`$aiApi` (non-stream) and `fetch` for `/advisor/chat/stream` both use `NUXT_PUBLIC_AI_API_URL`.

### `ai-service/.env`

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash
BACKEND_API_URL=http://localhost:3000/api/v1
```

The AI service reads **`ai-service/.env` first**. If Windows has an old `GEMINI_API_KEY` system variable, remove it or it may override the file. New Google keys may start with `AQ.` instead of `AIza`.

See also: [AI Advisor health check](http://localhost:8000/api/v1/advisor/health/gemini) after starting the AI service.

## 3. Start database

```bash
docker compose up -d postgres
```

Optional Redis (product cache; app falls back to DB if unavailable):

```bash
docker compose up -d redis
```

## 4. Database migration & seed

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

**Seed accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@techshop.com` | `admin123` |
| Customer | `customer@test.com` | `customer123` |

## 5. Run development servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend && npm run start:dev

# Terminal 2 — Frontend (http://localhost:3001)
cd frontend && npm run dev

# Terminal 3 — AI Service (http://localhost:8000)
cd ai-service && uvicorn app.main:app --reload --port 8000
```

## 6. Docker full stack

```bash
docker compose up --build
```

| Service | Port |
|---------|------|
| postgres | 5433 (host) |
| backend | 3000 |
| frontend | 3001 |
| ai-service | 8000 |

## 7. SePay sandbox

Full guide: **[SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md)**

Quick checklist:

1. Register at [my.sepay.vn](https://my.sepay.vn/register) → Payment Gateway → Sandbox.
2. Copy MERCHANT ID + SECRET KEY → `backend/.env`
3. Set callback URLs to `http://localhost:3001/payments/return?status=success|error|cancel`
4. For orders to become **paid** locally, expose backend with **ngrok** and register IPN:
   `https://<ngrok-host>/api/v1/payments/sepay/ipn`
5. Test: login as customer → checkout → **Thanh toán bằng SePay**.

## 8. Resend email

Full guide: **[RESEND_INTEGRATION.md](./RESEND_INTEGRATION.md)**

1. Create API key at [resend.com](https://resend.com)
2. Set `RESEND_API_KEY` and `MAIL_FROM=TechShop <onboarding@resend.dev>` in `backend/.env`
3. Restart backend
4. Test: `/forgot-password` (dev: use your Resend account email)

## 9. Gemini AI Advisor

1. Create key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Set `GEMINI_API_KEY` in `ai-service/.env`
3. Restart uvicorn (not just `--reload` for `.env` changes)
4. Open `http://localhost:3001/advisor` — tabs **Recommend** (RAG) and **Chat** (SSE streaming)
5. Health: `GET http://localhost:8000/api/v1/advisor/health/gemini`

Free tier is limited by RPM/TPM/RPD (not dollars). `max_output_tokens` is a per-response ceiling (8192); billing/quota counts **actual tokens used**. Recommend falls back to rule-based suggestions when Gemini quota is exceeded; Chat shows an error or falls back to non-stream `/advisor/chat`.

## npm scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile TypeScript |
| `npm run start:prod` | Run compiled JS |
| `npm run test` | Unit tests |
| `npx prisma migrate dev` | Run migrations |
| `npx prisma db seed` | Seed database |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on :3001 |
| `npm run build` | Production build |

## Related docs

| Doc | Topic |
|-----|--------|
| [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md) | Payments, IPN, ngrok, sandbox vs production |
| [RESEND_INTEGRATION.md](./RESEND_INTEGRATION.md) | Transactional email |
| [SETUP_PRODUCTION.md](./SETUP_PRODUCTION.md) | Production checklist |
| [API.md](./API.md) | REST API reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
