# SePay Payment Integration

## Overview

TechShop uses [SePay Payment Gateway](https://developer.sepay.vn/vi/cong-thanh-toan/gioi-thieu) for online payments (VietQR bank transfer, NAPAS, cards depending on merchant config).

- Checkout is a **POST HTML form** to SePay `checkout/init` with **HMAC-SHA256** (base64) signature.
- Only the **IPN** webhook marks orders as `paid` and sends the payment confirmation email.
- Browser redirect to `/payments/return` is **display-only** — the frontend reads status from the database.

## Environment variables

| Variable | Description |
|----------|-------------|
| `SEPAY_ENV` | `sandbox` or `production` |
| `SEPAY_MERCHANT_ID` | Merchant ID from SePay portal |
| `SEPAY_SECRET_KEY` | Secret key for form signing |
| `SEPAY_CHECKOUT_URL` | Optional override; defaults per `SEPAY_ENV` |
| `SEPAY_SUCCESS_URL` | Frontend URL after success — `http://localhost:3001/payments/return?status=success` |
| `SEPAY_ERROR_URL` | Frontend URL after error |
| `SEPAY_CANCEL_URL` | Frontend URL after cancel |
| `SEPAY_IPN_WHITELIST` | Optional comma-separated IPs allowed for IPN (empty = allow all) |

### Example (`backend/.env`)

```env
SEPAY_ENV=sandbox
SEPAY_MERCHANT_ID=
SEPAY_SECRET_KEY=
SEPAY_CHECKOUT_URL=https://pay-sandbox.sepay.vn/v1/checkout/init
SEPAY_SUCCESS_URL=http://localhost:3001/payments/return?status=success
SEPAY_ERROR_URL=http://localhost:3001/payments/return?status=error
SEPAY_CANCEL_URL=http://localhost:3001/payments/return?status=cancel
SEPAY_IPN_WHITELIST=
```

Backend appends `&invoice=TS-...` to success/error/cancel URLs automatically.

**Important:** Callback URLs must point to the **Nuxt** page `/payments/return`, not the NestJS API.

---

## Sandbox registration

1. Register at [https://my.sepay.vn/register](https://my.sepay.vn/register).
2. Open **Payment Gateway** → **Đăng ký** → enable **Quét mã QR chuyển khoản** → **Bắt đầu tích hợp**.
3. Choose **Sandbox** and copy **MERCHANT ID** + **SECRET KEY**.
4. Paste into `backend/.env` and restart the backend.

Sandbox does not move real money. You can test the full checkout + IPN flow.

---

## Local development: Return URL vs IPN

| URL | Who calls it | Works on localhost? |
|-----|--------------|---------------------|
| **success / error / cancel** | User’s browser after payment | Yes — `http://localhost:3001/payments/return?...` |
| **IPN URL** | SePay servers (webhook) | **No** — needs a public HTTPS URL |

### IPN with ngrok (required to mark orders `paid` locally)

```bash
ngrok http 3000
```

In the SePay portal (Payment Gateway integration screen), set **IPN URL**:

```text
https://<your-ngrok-host>/api/v1/payments/sepay/ipn
```

Without IPN, payment on SePay may succeed but the app stays `unpaid` / shows “đang xử lý” because the database is never updated.

---

## Payment flow

```
1. User clicks "Thanh toán bằng SePay" (checkout or order detail)
2. Frontend: POST /api/v1/payments/sepay/init?orderId=X
3. Backend creates PaymentTransaction + signed form fields
4. Frontend builds hidden form and POST-submits to SePay checkout/init
5. User pays on SePay (QR / card per merchant config)
6. SePay POST IPN → /api/v1/payments/sepay/ipn  ← marks order paid (source of truth)
7. SePay redirects browser → success_url / error_url / cancel_url
8. Frontend: GET /api/v1/payments/sepay/status?invoice=... (read-only status)
```

### API endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/payments/sepay/init?orderId=` | Yes | Create signed checkout form payload |
| `POST` | `/payments/sepay/ipn` | Public | Webhook — updates DB |
| `GET` | `/payments/sepay/status?invoice=` | Public | Read transaction status from DB |

### Init response

```json
{
  "success": true,
  "data": {
    "actionUrl": "https://pay-sandbox.sepay.vn/v1/checkout/init",
    "fields": {
      "merchant": "...",
      "currency": "VND",
      "order_amount": "100000",
      "operation": "PURCHASE",
      "order_description": "Thanh toan don hang #1",
      "order_invoice_number": "TS-1-1710000000000",
      "customer_id": "1",
      "success_url": "http://localhost:3001/payments/return?status=success&invoice=TS-1-...",
      "error_url": "...",
      "cancel_url": "...",
      "signature": "base64..."
    },
    "invoiceNumber": "TS-1-1710000000000"
  }
}
```

Creates/updates `payment_transactions` with status `processing`. `order_invoice_number` is unique per payment attempt (`TS-{orderId}-{timestamp}-{hex}`).

### Signature

HMAC-SHA256 over `field=value` pairs joined by commas, only for SePay’s whitelist fields, in fixed order (not alphabetical). Digest is **base64**. See `backend/src/common/utils/sepay.util.ts`.

### IPN payload (success)

```json
{
  "notification_type": "ORDER_PAID",
  "order": {
    "order_status": "CAPTURED",
    "order_amount": "100000.00",
    "order_invoice_number": "TS-1-1710000000000"
  },
  "transaction": {
    "id": "...",
    "transaction_date": "2025-09-29 15:31:22"
  }
}
```

Handler requirements:

- Respond **HTTP 200** with body exactly `{"success": true}` within 30 seconds.
- Idempotent: already-paid transactions still return success.
- Verify amount matches `payment_transactions.amount`.

---

## Staging / production

### Staging (sandbox credentials, public URLs)

1. Keep sandbox `SEPAY_MERCHANT_ID` / `SEPAY_SECRET_KEY`.
2. Update callback URLs to the deployed frontend, e.g. `https://app.vercel.app/payments/return?status=success`.
3. Update **IPN URL** in the SePay portal to the public API, e.g. `https://api.example.com/api/v1/payments/sepay/ipn`.

### Production (real money)

1. Link a **real bank account** on [my.sepay.vn](https://my.sepay.vn).
2. Payment Gateway → **Chuyển sang Production**.
3. Copy production MERCHANT ID + SECRET KEY.

```env
SEPAY_ENV=production
SEPAY_MERCHANT_ID=<production_merchant>
SEPAY_SECRET_KEY=<production_secret>
SEPAY_CHECKOUT_URL=https://pay.sepay.vn/v1/checkout/init
SEPAY_SUCCESS_URL=https://yourdomain.com/payments/return?status=success
SEPAY_ERROR_URL=https://yourdomain.com/payments/return?status=error
SEPAY_CANCEL_URL=https://yourdomain.com/payments/return?status=cancel
```

4. Register production IPN: `https://api.yourdomain.com/api/v1/payments/sepay/ipn`.
5. Deploy backend on public HTTPS (Railway/Render/VPS). Frontend can stay on Vercel.

SePay production requires **public** success/error/cancel domains — localhost only works for sandbox + local UI; IPN always needs a public URL.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| “SePay is not configured” | Empty merchant/secret | Set `SEPAY_MERCHANT_ID` and `SEPAY_SECRET_KEY`, restart backend |
| Invalid signature on SePay page | Wrong secret or field order | Re-copy credentials; do not reorder signed fields |
| Paid on SePay but app shows pending | IPN never reached backend | Use ngrok; register IPN URL |
| Amount mismatch in logs | Order total changed after init | Re-initiate payment from order detail |
| Duplicate invoice error | Reused invoice number | App generates `TS-{id}-{timestamp}` per attempt |

---

## Fees (merchant)

SePay charges per successful production transaction and may charge a monthly plan. Sandbox is free. See [sepay.vn/bang-gia.html](https://sepay.vn/bang-gia.html) and your merchant portal for current rates.
