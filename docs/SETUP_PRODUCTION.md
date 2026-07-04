# Production setup

## Database migration

After pulling, apply any pending migrations:

```bash
cd backend && npx prisma migrate deploy
```

Password reset tokens (if missing on an old database):

```bash
psql $DATABASE_URL -f ../init-scripts/003-password-reset.sql
```

## Environment variables

Copy [`backend/.env.example`](../backend/.env.example) and set production values.

### Cloudinary

Admin product image upload:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

### Resend

See [RESEND_INTEGRATION.md](./RESEND_INTEGRATION.md).

- `RESEND_API_KEY` — production API key
- `MAIL_FROM` — verified domain, e.g. `TechShop <noreply@yourdomain.com>`
- `FRONTEND_URL` — public frontend URL for email links

### SePay

See [SEPAY_INTEGRATION.md](./SEPAY_INTEGRATION.md).

```env
SEPAY_ENV=production
SEPAY_MERCHANT_ID=<production_merchant>
SEPAY_SECRET_KEY=<production_secret>
SEPAY_CHECKOUT_URL=https://pay.sepay.vn/v1/checkout/init
SEPAY_SUCCESS_URL=https://yourdomain.com/payments/return?status=success
SEPAY_ERROR_URL=https://yourdomain.com/payments/return?status=error
SEPAY_CANCEL_URL=https://yourdomain.com/payments/return?status=cancel
```

Register IPN in the SePay merchant portal:

```text
https://api.yourdomain.com/api/v1/payments/sepay/ipn
```

Optional: `SEPAY_IPN_WHITELIST` with SePay server IPs.

**Note:** Sandbox credentials are for testing only. Production requires a linked bank account and production merchant keys from SePay.

### AI service

- `GEMINI_API_KEY` — enable billing or use a paid tier for stable quota (free tier: RPM/TPM/RPD limits)
- `GEMINI_MODEL` — default `gemini-3.5-flash`
- `BACKEND_API_URL` — internal or public NestJS API URL
- `NUXT_PUBLIC_AI_API_URL` on frontend — public AI service base URL (e.g. `https://ai.yourdomain.com/api/v1`); in dev use Nuxt proxy `/api/ai`
- Chat streaming: ensure reverse proxy does not buffer SSE (`X-Accel-Buffering: no` is set by FastAPI)

### Observability

- `SENTRY_DSN` (backend)
- `NUXT_PUBLIC_SENTRY_DSN` (frontend)
- `LOG_LEVEL=info`

## Deploy checklist

| Item | Staging (sandbox) | Production |
|------|-------------------|------------|
| SePay credentials | Sandbox merchant/secret | Production merchant/secret |
| SePay return URLs | `https://staging.app/payments/return?...` | `https://yourdomain.com/payments/return?...` |
| SePay IPN URL | Update in sandbox portal | Register on production portal |
| Resend `MAIL_FROM` | `onboarding@resend.dev` or verified domain | Verified domain only |
| `FRONTEND_URL` | Staging frontend URL | Production frontend URL |
| HTTPS | Required for public IPN | Required |

## Tests

```bash
cd backend && npm test && npm run test:e2e
cd frontend && npm test
```
