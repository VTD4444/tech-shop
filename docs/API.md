# API Reference

Base URL: `http://localhost:3000/api/v1`

## Response Format

```json
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "success": false, "message": "Error description" }
```

Auth: JWT via `Authorization: Bearer <token>` or `httpOnly` cookie `access_token`

---

## Auth

### `POST /auth/register`
```json
{
  "fullName": "Nguyen Van A",
  "email": "john@test.com",
  "phone": "0901234567",
  "password": "123456",
  "confirmPassword": "123456"
}
// Returns: { user: { id, username, fullName, email, phone, role } }
// Sets httpOnly cookies: access_token (15m), refresh_token (7d)
```

### `POST /auth/login`
```json
{ "email": "john@test.com", "password": "123456" }
// Returns: { user }
// Sets httpOnly cookies: access_token, refresh_token
// Frontend sends credentials: 'include' on all API calls
```

### `GET /auth/google`
Redirects to Google OAuth consent screen. On success, callback sets cookies and redirects to `FRONTEND_URL/?auth=google`.

### `GET /auth/google/callback`
Google OAuth callback (handled by backend). Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` in `backend/.env`.

### `POST /auth/refresh`
```json
{}
// Uses refresh_token cookie (or optional body.refreshToken)
// Returns: { user }; rotates access_token + refresh_token cookies
```

### `POST /auth/logout`
Clears cookies.

---

## Users

### `GET /users/profile` [Auth]
### `PATCH /users/profile` [Auth]
```json
{ "fullName": "Nguyen Van A", "email": "new@email.com", "phone": "0901234567" }
```

### `GET /users/addresses` [Auth]
### `POST /users/addresses` [Auth]
```json
{ "receiverName": "Nguyen Van A", "phone": "0901234567", "addressLine": "123 ABC", "ward": "Ward 1", "district": "District 1", "city": "HCMC", "isDefault": true }
```

### `PATCH /users/addresses/:id` [Auth]
### `DELETE /users/addresses/:id` [Auth]

---

## Categories

### `GET /categories` — Tree (parent → children)
### `GET /categories/:slug`
### `POST /categories` [Admin]
```json
{ "name": "CPU", "slug": "cpu", "parentId": null }
```
### `PATCH /categories/:id` [Admin]
### `DELETE /categories/:id` [Admin]

---

## Brands

### `GET /brands`
### `GET /brands/:slug`
### `POST /brands` [Admin] — `{ "name": "Intel", "slug": "intel" }`
### `PATCH /brands/:id` [Admin]
### `DELETE /brands/:id` [Admin]

---

## Products

### `GET /products`
Query params:
| Param | Type | Description |
|---|---|---|
| `page` | int | Default 1 |
| `limit` | int | Max 100, default 20 |
| `category` | string | Category slug |
| `brand` | string | Brand slug |
| `minPrice` | number | Minimum price (VND) |
| `maxPrice` | number | Maximum price (VND) |
| `search` | string | Full-text search on name + description |
| `isPcComponent` | bool | Filter PC components |
| `sort` | string | `price_asc`, `price_desc`, `name_asc`, `created_at` |

### `GET /products/:slug` — Full detail with specs + pc_component
### `GET /products/:slug/specs`
### `GET /products/:slug/reviews?page=1&limit=10`
### `POST /products/:slug/reviews` [Auth]
```json
{ "rating": 5, "comment": "Great product!" }
```

### `POST /products` [Admin]
```json
{ "name": "...", "slug": "...", "price": 1000000, "stockQuantity": 10, "categoryId": "1", "brandId": "1", "isPcComponent": true, "description": "...", "imageUrl": "..." }
```
### `PATCH /products/:id` [Admin]
### `DELETE /products/:id` [Admin] — Sets status = 'discontinued'

---

## Cart

### `GET /cart` [Auth]
Returns items plus pricing summary:
```json
{
  "items": [ { "productId": "1", "quantity": 2, "product": { ... } } ],
  "summary": { "subtotal": 1000000, "shipping": 0, "total": 1000000 }
}
```
### `POST /cart` [Auth] — `{ "productId": "1", "quantity": 2 }`
### `PATCH /cart/:productId` [Auth] — `{ "quantity": 3 }`
### `DELETE /cart/:productId` [Auth]
### `DELETE /cart` [Auth] — Clear all

---

## Wishlist

### `GET /wishlist` [Auth]
### `POST /wishlist/:productId` [Auth]
### `DELETE /wishlist/:productId` [Auth]

---

## Orders

### `POST /orders/checkout` [Auth]
```json
{ "shippingAddressId": "1", "note": "Giao nhanh" }
```
Atomic transaction: locks product rows → validates stock → deducts → creates order → clears cart.

### `GET /orders` [Auth] — Paginated history
### `GET /orders/:id` [Auth] — Detail with items + payment transaction status
### `PATCH /orders/:id/cancel` [Auth] — Only if status = 'pending'

---

## Payments (SePay)

### `POST /payments/sepay/init?orderId=1` [Auth]
Returns: `{ actionUrl, fields, invoiceNumber }` — frontend POSTs `fields` to `actionUrl`.

### `GET /payments/sepay/status?invoice=TS-1-...` [Public]
Read-only payment status from DB (used by `/payments/return`).

### `POST /payments/sepay/ipn` [Public]
Server-to-server Instant Payment Notification. Body JSON (`ORDER_PAID`). Responds `{"success": true}`.

---

## PC Builder

### `GET /pc-builder/components?type=CPU&selectedIds=1,2,3`
Returns all PC components, optionally filtered by `componentType`.

When `selectedIds` is provided (comma-separated product/component IDs already in the build), each item includes compatibility against the current selection:
```json
{
  "id": "5",
  "componentType": "VGA",
  "compatible": false,
  "incompatibilityReasons": ["GPU length exceeds case limit"],
  "product": { "name": "...", "price": 8990000 }
}
```

Without `selectedIds`, all items return `compatible: true` and `incompatibilityReasons: []`.

### `POST /pc-builder/validate`
```json
{ "componentIds": ["1", "2", "3", "4", "5", "6", "7"] }
```
Returns:
```json
{
  "compatible": true,
  "issues": [],
  "totalWattage": 601,
  "totalPrice": 33900000,
  "psuWattage": 750
}
```

### `POST /pc-builder/build` [Auth]
```json
{ "name": "My Build", "componentIds": ["1", "2", "3"] }
```

### `GET /pc-builder/builds` [Auth]
### `GET /pc-builder/builds/:id`
### `DELETE /pc-builder/builds/:id`

---

## Admin

### `GET /admin/orders?page=1&limit=20&status=pending` [Admin]
### `PATCH /admin/orders/:id/status?status=confirmed` [Admin]
### `GET /admin/products/inventory` [Admin]
### `GET /admin/analytics/summary` [Admin]
Returns dashboard totals (orders, revenue, low-stock count).

### `GET /admin/analytics/revenue-by-month?months=12` [Admin]
Returns monthly revenue for charts:
```json
{ "data": [ { "month": "2026-01", "revenue": 15000000, "orderCount": 12 } ] }
```

---

## AI Service

Base URL (direct): `http://localhost:8000/api/v1`
Frontend dev proxy: `http://localhost:3001/api/ai` → `http://127.0.0.1:8000/api/v1` (see `frontend/nuxt.config.ts` `routeRules`)

### NestJS catalog for AI (internal)

`GET /api/v1/internal/ai/catalog`

Returns all **active** products with compact fields for the Advisor prompt:

```json
{
  "success": true,
  "data": [
    {
      "id": "12",
      "name": "Logitech G Pro X",
      "slug": "logitech-g-pro-x",
      "price": 2490000,
      "category": "headphone",
      "brand": "Logitech",
      "componentType": null,
      "pcComponentId": null
    }
  ],
  "meta": { "total": 1 }
}
```

Auth: header `X-AI-Internal-Key` must match `AI_INTERNAL_API_KEY` when that env is set. In production, the key is required (requests without a configured key are rejected).

### `POST /advisor/recommend`
```json
{
  "budget_total": 20000000,
  "purpose": "gaming",
  "preferences": ["Intel", "NVIDIA"],
  "current_cart_ids": []
}
```
Returns RAG-based component list from live catalog. Falls back to rule-based recommendations when Gemini quota is exceeded.

### `POST /advisor/chat`
Non-streaming conversational Q&A (fallback when SSE fails or response is truncated):
```json
{
  "message": "Tôi cần build PC 20 triệu cho đồ họa",
  "history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
}
```
Returns: `{ "success": true, "data": { "reply": "...", "suggested_products": [] } }`

### `POST /advisor/chat/stream`
Server-Sent Events (SSE) streaming chat. Same request body as `/advisor/chat`.

Response (`Content-Type: text/event-stream`):
```
data: {"token": "Hello"}
data: {"token": " world"}
data: {"done": true}
```

On error: `data: {"error": "message"}`

Frontend (`useAdvisorChat.ts`): parses SSE by `\n\n` delimiters, flushes buffer on stream end, auto-falls back to `/advisor/chat` if the reply looks truncated.

LLM `max_output_tokens`: **8192** (actual quota usage is based on tokens generated, not this ceiling).

### `GET /advisor/health`
Returns: `{ "status": "ok", "service": "ai-advisor" }`

### `GET /advisor/health/gemini`
Probes Gemini API key. Returns `{ "ok": true|false, "reason": "...", "key_source": "..." }`
