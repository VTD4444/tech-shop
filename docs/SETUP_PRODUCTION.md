# Production setup (new features)

## Database migration

After pulling, apply password reset table:

```bash
# Option A: Prisma migrate
cd backend && npx prisma migrate dev --name password_reset_tokens

# Option B: SQL (existing Docker volume)
psql $DATABASE_URL -f ../init-scripts/003-password-reset.sql
```

## Environment variables

Copy [`backend/.env.example`](../backend/.env.example) and set:

- **Cloudinary** — `CLOUDINARY_*` for admin image upload
- **Resend** — `RESEND_API_KEY`, `MAIL_FROM` (verified domain)
- **VNPAY** — `VNPAY_ENV=production`, production TMN/hash, `VNPAY_RETURN_URL` → frontend `/vnpay/return`
- **Sentry** — `SENTRY_DSN` (backend), `NUXT_PUBLIC_SENTRY_DSN` (frontend)

## Tests

```bash
cd backend && npm test && npm run test:e2e
cd frontend && npm test
```
