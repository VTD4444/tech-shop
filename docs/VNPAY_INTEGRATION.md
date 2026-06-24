# VNPAY Payment Integration

## Overview

VNPay is a Vietnamese payment gateway. TechShop uses **HMAC-SHA512** signature verification. Only the **IPN** webhook marks orders as `paid` and sends the payment confirmation email.

## Environment variables

| Variable | Description |
|----------|-------------|
| `VNPAY_ENV` | `sandbox` or `production` |
| `VNPAY_TMN_CODE` | Terminal / merchant code from VNPay portal |
| `VNPAY_HASH_SECRET` | Secret key for HMAC signing |
| `VNPAY_URL` | Payment page URL (optional; defaults per `VNPAY_ENV`) |
| `VNPAY_RETURN_URL` | **Frontend** URL after payment — `http://localhost:3001/vnpay/return` in dev |
| `VNPAY_IPN_WHITELIST` | Optional comma-separated IPs allowed for IPN (empty = allow all) |

### Example (`backend/.env`)

```env
VNPAY_ENV=sandbox
VNPAY_TMN_CODE=XXXXXX
VNPAY_HASH_SECRET=XXXXXXXXXXXXXXXX
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3001/vnpay/return
VNPAY_IPN_WHITELIST=
```

**Important:** `VNPAY_RETURN_URL` must point to the **Nuxt** page `/vnpay/return`, not the NestJS API.

---

## Sandbox registration (no custom domain required)

1. Open [VNPay Sandbox Merchant](https://sandbox.vnpayment.vn/merchantv2/) and register.
2. The registration form **does not accept** `http://localhost:...` (“Không đúng định dạng Url”).
3. Use a public-looking URL for registration only, for example:
   - A free Vercel deploy: `https://your-app.vercel.app`
   - An ngrok URL: `https://xxxx.ngrok-free.app`
   - A placeholder format: `https://techshop-demo.vercel.app` (only to pass the form)
4. The URL entered at registration is **metadata** for the merchant account. It does not have to match runtime config exactly.
5. After registration, copy **TMN Code** and **Hash Secret** into `backend/.env`.
6. Restart the backend after changing `.env`.

You do **not** need to buy a domain for sandbox testing. You also do **not** need a new sandbox account when deploying—keep the same credentials and **update IPN / return URLs** in the merchant portal.

---

## Local development: Return URL vs IPN

| URL type | Who calls it | Works on localhost? |
|----------|--------------|---------------------|
| **Return URL** | User’s browser after payment | Yes — `http://localhost:3001/vnpay/return` |
| **IPN URL** | VNPay servers (webhook) | **No** — needs a public HTTPS URL |

### IPN setup with ngrok

```bash
ngrok http 3000
```

Register in the VNPay sandbox merchant portal:

```text
https://<your-ngrok-host>/api/v1/payments/vnpay/ipn
```

Each time ngrok restarts and the host changes, update the IPN URL in the portal.

Without IPN, payment on VNPay may succeed but the app stays `unpaid` / shows “Payment Failed” because the database is never updated.

---

## Payment flow

```
1. User clicks "Pay with VNPAY" on order detail (/orders/:id)
2. Frontend: POST /api/v1/payments/vnpay/create-url?orderId=X
3. Backend builds signed URL → browser redirects to VNPay
4. User pays on VNPay (sandbox test card)
5. VNPay POST IPN → /api/v1/payments/vnpay/ipn  ← marks order paid (source of truth)
6. VNPay redirects browser → VNPAY_RETURN_URL (/vnpay/return)
7. Frontend: GET /api/v1/payments/vnpay/return-status?txnRef=... (read-only status)
```

---

## API endpoints

| Method | Path | Auth | Role |
|--------|------|------|------|
| `POST` | `/payments/vnpay/create-url?orderId=` | Yes | Create signed payment URL |
| `POST` | `/payments/vnpay/ipn` | Public | Webhook — updates DB |
| `GET` | `/payments/vnpay/return` | Public | Verify signature; read status |
| `GET` | `/payments/vnpay/return-status?txnRef=` | Public | Read transaction status from DB |

### Create payment URL

Creates `vnpay_transactions` with status `processing`. Key params:

- `vnp_TxnRef`: `{timestamp}_{orderId}`
- `vnp_Amount`: order total × 100 (VND, no decimals)
- `vnp_ReturnUrl`: from `VNPAY_RETURN_URL`
- `vnp_SecureHash`: HMAC-SHA512 of sorted params

### IPN handler

1. Verify HMAC-SHA512
2. Ensure transaction exists and status is `processing`
3. Validate amount matches
4. On `vnp_ResponseCode=00`: set transaction `success`, order `payment_status=paid`, send email

**Idempotent:** if already confirmed, return `RspCode: 02`.

### Return URL (browser)

Read-only verification for the frontend. **Does not** mark the order paid; IPN does.

---

## IPN response codes

| Code | Meaning |
|------|---------|
| `00` | Confirm success |
| `01` | Order not found |
| `02` | Order already confirmed |
| `04` | Amount mismatch |
| `97` | Invalid signature / IP |

---

## State transitions

```
Order.payment_status:    unpaid → paid / failed / refunded
VnpayTransaction.status: processing → success / failed
Order.status:            pending → confirmed → shipping → completed / cancelled
```

---

## Sandbox test card

From [VNPay Sandbox APIs](https://sandbox.vnpayment.vn/apis/):

| Field | Value |
|-------|--------|
| Bank | NCB |
| Card number | `9704198526191432198` |
| Card holder | NGUYEN VAN A |
| Issue date | 07/15 |
| OTP | `123456` (or as shown on sandbox page) |

---

## Deploy staging vs production

### Staging (still sandbox)

- Keep the **same** sandbox `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET`.
- Update `VNPAY_RETURN_URL` to your deployed frontend, e.g. `https://app.vercel.app/vnpay/return`.
- Update **IPN URL** in the VNPay sandbox portal to your public API, e.g. `https://api.example.com/api/v1/payments/vnpay/ipn`.

### Production (real payments)

1. Sign a **production** merchant contract with VNPay (separate from sandbox).
2. Set:

```env
VNPAY_ENV=production
VNPAY_TMN_CODE=<production_tmn>
VNPAY_HASH_SECRET=<production_secret>
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/vnpay/return
```

3. Register production IPN: `https://api.yourdomain.com/api/v1/payments/vnpay/ipn`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| Invalid signature on VNPay page | Wrong `HASH_SECRET` or `TMN_CODE` | Re-copy from merchant portal |
| Paid on VNPay but app shows failed | IPN never reached backend | Use ngrok; register IPN URL |
| Cannot create payment URL | Order not owned by user or not `unpaid` | Login as order owner; order must be `pending` |
| Registration rejects localhost | Form validation | Use Vercel/ngrok URL (see above) |
