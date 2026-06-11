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
{ "username": "john", "email": "john@test.com", "password": "123456" }
// Returns: { accessToken, refreshToken, user }
// Sets httpOnly cookies
```

### `POST /auth/login`
```json
{ "email": "john@test.com", "password": "123456" }
// Returns: { accessToken, refreshToken, user }
```

### `POST /auth/refresh`
```json
{ "refreshToken": "..." }
```

### `POST /auth/logout`
Clears cookies.

---

## Users

### `GET /users/profile` [Auth]
### `PATCH /users/profile` [Auth]
```json
{ "username": "new_name", "email": "new@email.com" }
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
### `GET /orders/:id` [Auth] — Detail with items + VNPAY status
### `PATCH /orders/:id/cancel` [Auth] — Only if status = 'pending'

---

## Payments (VNPAY)

### `POST /payments/vnpay/create-url?orderId=1` [Auth]
Returns: `{ paymentUrl: "https://sandbox.vnpayment.vn/...", txnRef: "..." }`

### `GET /payments/vnpay/return?` — Browser redirect endpoint, verifies HMAC
### `POST /payments/vnpay/ipn?` — Server-to-server Instant Payment Notification

---

## PC Builder

### `GET /pc-builder/components?type=CPU`
Returns all PC components, optionally filtered by `componentType`.

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

---

## AI Service

Base URL: `http://localhost:8000/api/v1`

### `POST /advisor/recommend`
```json
{
  "budget_total": 20000000,
  "purpose": "gaming",
  "preferences": ["Intel", "NVIDIA"],
  "current_cart_ids": []
}
```

### `POST /advisor/chat`
```json
{
  "message": "Tôi cần build PC 20 triệu cho đồ họa",
  "history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
}
```

### `GET /advisor/health`
Returns: `{ "status": "ok", "service": "ai-advisor" }`
