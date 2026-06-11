# VNPAY Payment Integration

## Overview

VNPAY is a Vietnamese payment gateway. Integration uses HMAC-SHA512 signature verification.

## Environment

| Variable | Description |
|----------|-------------|
| `VNPAY_ENV` | `sandbox` or `production` |
| `VNPAY_URL` | Payment page URL (auto-default per env if omitted) |
| `VNPAY_RETURN_URL` | Browser return URL — use frontend: `http://localhost:3001/vnpay/return` |
| `VNPAY_IPN_WHITELIST` | Optional comma-separated IPs allowed for IPN |

**Production go-live checklist**

1. Obtain production `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET` from VNPAY.
2. Set `VNPAY_ENV=production` and production `VNPAY_URL`.
3. Register IPN URL in merchant portal: `https://your-api.com/api/v1/payments/vnpay/ipn`
4. Set `VNPAY_RETURN_URL` to your Nuxt page `/vnpay/return`.
5. Only IPN marks orders as `paid` and sends confirmation email.

## Flow

```
1. User clicks "Pay with VNPAY" on order detail page
2. Frontend calls POST /payments/vnpay/create-url?orderId=X
3. NestJS generates signed URL → redirects user to VNPAY
4. User enters card info on VNPAY
5. VNPAY sends IPN (server-to-server POST) to NestJS — source of truth for paid status
6. VNPAY redirects browser (GET) to frontend /vnpay/return
7. Frontend calls GET /payments/vnpay/return-status?txnRef=... (read-only)
```

## API Endpoints

### Create Payment URL
`POST /payments/vnpay/create-url?orderId=1`

Generates VNPAY URL with required params:
- `vnp_Version`, `vnp_Command`, `vnp_TmnCode`
- `vnp_TxnRef`: Unique (timestamp + orderId)
- `vnp_Amount`: price × 100 (VND, no decimals)
- `vnp_CreateDate`: yyyyMMddHHmmss
- `vnp_IpAddr`: client IP
- `vnp_ReturnUrl`: VNPAY return endpoint
- `vnp_SecureHash`: HMAC-SHA512 of sorted params

Creates `vnpay_transactions` record with status `processing`.

### IPN (Instant Payment Notification)
`POST /payments/vnpay/ipn?vnp_TxnRef=...&vnp_ResponseCode=00&vnp_SecureHash=...`

Server-to-server webhook from VNPAY. Must:
1. Verify HMAC-SHA512 signature
2. Check transaction exists & is still `processing`
3. Validate amount matches
4. Update: `vnpay_transactions.status` + `orders.payment_status`

**Idempotent**: If status is already `success`/`failed`, return code `02`.

### Return URL
`GET /payments/vnpay/return?vnp_TxnRef=...&vnp_ResponseCode=00&vnp_SecureHash=...`

Browser redirect. Verifies signature, updates DB, returns success/failure JSON.

## Signature Verification

```typescript
const params = { ...query };
delete params.vnp_SecureHash;
delete params.vnp_SecureHashType;

const sortedKeys = Object.keys(params).sort();
const signData = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
const hmac = crypto.createHmac('sha512', secretKey);
const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

if (secureHash !== checkHash) {
  return { RspCode: '97', Message: 'Invalid signature' };
}
```

## IPN Response Codes

| Code | Meaning |
|---|---|
| `00` | Confirm success |
| `01` | Order not found |
| `02` | Order already confirmed |
| `04` | Amount mismatch |
| `97` | Invalid signature |

## State Transitions

```
Order.payment_status:    unpaid → paid / failed / refunded
VnpayTransaction.status: processing → success / failed
Order.status:            pending → confirmed → shipping → completed / cancelled
```

## Test Cards (Sandbox)

From VNPAY Sandbox:
- Ngân hàng: NCB
- Số thẻ: 9704198526191432198
- Tên chủ thẻ: NGUYEN VAN A
- Ngày phát hành: 07/15
- Mật khẩu OTP: OTP

## Configuration

```env
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/v1/payments/vnpay/return
```
