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

## 10. CI/CD (GitHub Actions)

Pipeline overview:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | PR + push `main` | Path-filtered test, migrate, build, Docker build check |
| [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) | push `main` | Push Docker images to GHCR, trigger Render deploy hooks |
| [`.github/workflows/uptime.yml`](../.github/workflows/uptime.yml) | cron 5 min | Ping production health URLs |

```mermaid
flowchart LR
  PR[PR_or_push] --> CI[CI_test_build]
  Main[push_main] --> CI
  CI --> CD[CD_GHCR_Render]
  Main --> Vercel[Vercel_auto_deploy]
```

### GitHub Secrets (repository Settings → Secrets)

| Secret | Required | Purpose |
|--------|----------|---------|
| `RENDER_DEPLOY_HOOK_BACKEND` | Recommended | POST after backend image push |
| `RENDER_DEPLOY_HOOK_AI` | Recommended | POST after AI image push |
| `UPTIME_URLS` | Optional | Pipe-separated URLs, e.g. `https://api.example.com/api/v1/health\|https://app.vercel.app` |
| `SENTRY_AUTH_TOKEN` | Optional | Sentry release tracking from CD |

`GITHUB_TOKEN` is provided automatically for GHCR push.

### Render (Docker from GHCR)

1. Create **Registry Credential** in Render: GitHub PAT with `read:packages`.
2. Switch each Web Service to **Deploy from image**: `ghcr.io/<github-user>/techshop-backend:latest` (and `techshop-ai`).
3. Health checks: backend `/api/v1/health`, AI `/api/v1/advisor/health` (timeout ≥ 30s on free tier).
4. Copy deploy hook URLs → GitHub Secrets above.
5. Optional: apply [`render.yaml`](../render.yaml) as Blueprint (replace `YOUR_GITHUB_USERNAME`).

Migrations run automatically on container start via [`backend/docker-entrypoint.sh`](../backend/docker-entrypoint.sh).

### Vercel (frontend)

1. Connect GitHub repo → **Root Directory**: `frontend`
2. **Production Branch**: `main`
3. Environment variables (Production):

```env
NUXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND.onrender.com/api/v1
NUXT_PUBLIC_AI_API_URL=https://YOUR-AI.onrender.com/api/v1
NUXT_PUBLIC_SENTRY_DSN=
```

Vercel deploys automatically on push to `main` when Git integration is enabled (no extra CD job required).

### Monitoring (Sentry)

Set on Render (backend) and Vercel (frontend):

| Service | Variable |
|---------|----------|
| Backend | `SENTRY_DSN`, `NODE_ENV=production` |
| Frontend | `NUXT_PUBLIC_SENTRY_DSN` |

### Branch protection (`main`)

In GitHub → Settings → Branches → Add rule:

- Require pull request before merging (recommended)
- Require status check: **ci-success** (job `Verify required jobs` in CI workflow)
- Do not allow bypassing for admins (optional)

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
| [FLOWS.md](./FLOWS.md) | Flowcharts: login, forgot-password, checkout, IPN |
| [RESEND_INTEGRATION.md](./RESEND_INTEGRATION.md) | Transactional email |
| [SETUP_PRODUCTION.md](./SETUP_PRODUCTION.md) | Production checklist |
| [API.md](./API.md) | REST API reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) | Manual test checklist |
| [BUG_REPORT.md](./BUG_REPORT.md) | Major bugs & fixes |
| [DEMO.md](./DEMO.md) | Demo video / slide outline |
| [COMPLIANCE.md](./COMPLIANCE.md) | Map to project requirements |
| [`render.yaml`](../render.yaml) | Render Docker Blueprint |
