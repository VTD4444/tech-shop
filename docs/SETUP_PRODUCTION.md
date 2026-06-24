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

### VNPay

See [VNPAY_INTEGRATION.md](./VNPAY_INTEGRATION.md).

```env
VNPAY_ENV=production
VNPAY_TMN_CODE=<from VNPay contract>
VNPAY_HASH_SECRET=<from VNPay contract>
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/vnpay/return
```

Register IPN in the VNPay merchant portal:

```text
https://api.yourdomain.com/api/v1/payments/vnpay/ipn
```

Optional: `VNPAY_IPN_WHITELIST` with VNPay server IPs.

**Note:** Sandbox credentials are for testing only. Production requires a separate VNPay merchant agreement.

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
| VNPay credentials | Same sandbox TMN/secret | Production TMN/secret |
| VNPay return URL | `https://staging.app/vnpay/return` | `https://yourdomain.com/vnpay/return` |
| VNPay IPN URL | Update in sandbox portal | Register on production portal |
| Resend `MAIL_FROM` | `onboarding@resend.dev` or verified domain | Verified domain only |
| `FRONTEND_URL` | Staging frontend URL | Production frontend URL |
| HTTPS | Required for public IPN | Required |

## Tests

```bash
cd backend && npm test && npm run test:e2e
cd frontend && npm test
```
