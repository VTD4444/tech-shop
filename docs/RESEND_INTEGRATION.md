# Resend Email Integration

## Overview

TechShop uses [Resend](https://resend.com) for transactional email via `backend/src/modules/mail/mail.service.ts`.

| Trigger | Email |
|---------|--------|
| Forgot password | Reset link (`/reset-password?token=...`) |
| Order placed | Order created confirmation |
| SePay IPN success | Payment received confirmation |

If `RESEND_API_KEY` or `MAIL_FROM` is missing, forgot-password returns **503** with a Vietnamese message (dev: reset link logged when Resend sandbox blocks).

---

## Environment variables (`backend/.env`)

```env
RESEND_API_KEY=re_your_api_key
MAIL_FROM=TechShop <onboarding@resend.dev>
FRONTEND_URL=http://localhost:3001
```

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key from Resend dashboard (`re_...`) |
| `MAIL_FROM` | Sender address. Format: `Display Name <email@domain.com>` |
| `FRONTEND_URL` | Base URL for links in emails (reset password, order detail) |

Restart the backend after editing `.env` (`npm start` / `npm run start:dev`).

---

## Setup steps

### 1. Create API key

1. Sign up at [resend.com](https://resend.com)
2. **API Keys** → **Create API Key**
3. Copy the key (`re_...`) into `RESEND_API_KEY`

### 2. Local development (no domain)

```env
MAIL_FROM=TechShop <onboarding@resend.dev>
```

**Limitation:** Resend only delivers to the **email address of your Resend account** when using `onboarding@resend.dev`.

To test forgot-password locally, use your Resend account email as the TechShop user email (or register a new user with that email).

### 3. Production (custom domain)

1. Resend → **Domains** → add your domain
2. Add DNS records (SPF, DKIM) until status is **Verified**
3. Update:

```env
MAIL_FROM=TechShop <noreply@yourdomain.com>
```

The address must use a verified domain.

---

## Testing

### Forgot password

1. Open `http://localhost:3001/forgot-password`
2. Enter an email that exists in the database
3. Check backend logs for:
   - `Resend configured (from: ...)` on startup
   - `Email sent: Đặt lại mật khẩu TechShop -> ...` on success
   - `Email skipped (Resend not configured): ...` if `.env` is wrong

### API

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{ "email": "user@example.com" }
```

- Registered email: `{ "message": "Đã gửi liên kết đặt lại mật khẩu đến email của bạn" }`
- Unknown email: **404** `{ "message": "Email chưa được đăng ký trong hệ thống" }`
- Mail not configured: **503** with Vietnamese error message

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| `Email skipped (Resend not configured)` | Empty `RESEND_API_KEY` or invalid `MAIL_FROM` | Fill `.env`; restart backend |
| Works on Resend dashboard but not in app | Key only in dashboard, not in `.env` | Paste key into `backend/.env` |
| `You can only send testing emails to your own email` | Dev sender + wrong recipient | Use Resend account email as recipient |
| `Domain not verified` | `MAIL_FROM` uses unverified domain | Verify domain or use `onboarding@resend.dev` |
