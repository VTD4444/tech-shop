# Architecture

## System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                      Nuxt 3 (SSR) :3001                           │
│  ┌─────────┐ ┌────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Auth UI │ │ Product UI │ │ PC Builder UI│ │ AI Advisor Chat│  │
│  └────┬────┘ └─────┬──────┘ └──────┬───────┘ └────────┬───────┘  │
└───────┼────────────┼───────────────┼───────────────────┼──────────┘
        │            │               │                   │
        ▼            ▼               ▼                   ▼
┌───────────────────────────────────────────────────────────────┐
│                    NestJS API :3000 (BFF)                     │
│  ┌───┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐       │
│  │Auth│ │Users │ │Prod  │ │Cart  │ │Order │ │PC     │       │
│  │    │ │Addr  │ │Cat   │ │Wish  │ │Pay   │ │Builder│       │
│  └───┘ └──────┘ └──────┘ └──────┘ └──────┘ └───────┘       │
│                  │ Prisma ORM          │ Redis (cache)      │
└──────────────────┼─────────────────────┼────────────────────┘
                   │                     │
                   ▼                     ▼
┌───────────────────────────────────────────────────────────────┐
│          PostgreSQL 16 :5432          │  VNPay Sandbox        │
│  users │ products │ orders │ vnpay    │  (payment gateway)    │
└───────────────────────────────────────────────────────────────┘

Nuxt AI Advisor ──HTTP──> FastAPI AI Service :8000
  (dev: /api/ai proxy in Nuxt routeRules)
                              POST /advisor/recommend
                              POST /advisor/chat
                              POST /advisor/chat/stream (SSE)
                                   │
                                   ├──> NestJS catalog API (internal)
                                   └──> Gemini API (gemini-3.5-flash, external)
```

## Data Flow

### 1. Browsing (SSR)
```
Browser → Nuxt (server) → NestJS /products → PostgreSQL → HTML
```

### 2. Authentication
```
Login Form → Nuxt → POST /auth/login → NestJS validates → Set-Cookie (httpOnly)
Auto-sent on all subsequent requests via credentials: 'include'
```

### 3. Checkout (Atomic)
```
POST /orders/checkout
  → NestJS $transaction
    → SELECT ... FOR UPDATE (lock product rows, sorted by id)
    → Validate stock
    → UPDATE stock_quantity
    → CREATE order + order_items
    → DELETE cart_items
  → Return order
```

### 4. VNPAY Payment
```
User clicks "Pay with VNPAY"
  → NestJS generates signed URL → redirect to VNPAY Sandbox
  → User pays on VNPAY
  → VNPAY IPN (server-to-server POST) → NestJS verifies HMAC → updates DB
  → VNPAY redirect (browser GET) → Nuxt displays result
```

### 5. PC Builder Compatibility
```
User selects components → Vue modal
  → GET /pc-builder/components?selectedIds=1,2,3 (per-slot filtering)
  → POST /pc-builder/validate { componentIds[] }
  → NestJS queries pc_components JOIN products
  → Applies 6 rules: socket, RAM gen, form factor, GPU length, cooler height, PSU wattage
  → Returns { compatible, issues[], totalWattage, totalPrice }
```

### 6. AI Advisor — Recommend (RAG)
```
POST /ai-service/api/v1/advisor/recommend { budget, purpose }
  → FastAPI calls NestJS GET /pc-builder/components + GET /products
  → Builds prompt with product data
  → Calls Gemini (gemini-3.5-flash)
  → Parses JSON response
  → Returns { recommended_components[], total_price, explanation }
  → Falls back to rule-based recommendations on quota errors
```

### 7. AI Advisor — Chat (SSE)
```
User types in AdvisorChat → useAdvisorChat.sendMessage()
  → POST /api/ai/advisor/chat/stream (Nuxt proxy → FastAPI)
  → FastAPI streams Gemini tokens as SSE: data: {"token": "..."}
  → Frontend appends tokens to assistant message (markdown via marked + DOMPurify)
  → History persisted in localStorage (last 50 messages)
  → If stream fails or reply looks truncated → POST /advisor/chat (non-stream fallback)
```

## Communication Protocols

| From | To | Protocol | Auth |
|---|---|---|---|
| Nuxt | NestJS | HTTP REST | httpOnly JWT cookie |
| Nuxt | FastAPI | HTTP REST / SSE | None (dev proxy `/api/ai`) |
| FastAPI | NestJS | HTTP REST | None (internal Docker network) |
| FastAPI | Gemini | HTTPS | API Key |
| NestJS | VNPAY | HTTPS | HMAC-SHA512 |

## Frontend RBAC

Route middleware enforces role-based access without changing URL structure:

| Middleware | Routes | Behavior |
|---|---|---|
| `auth` | `/cart`, `/checkout`, `/orders`, `/profile`, `/wishlist`, `/admin/**` | Redirect to `/login` if unauthenticated |
| `customer` | `/cart`, `/checkout`, `/orders`, `/profile`, `/wishlist` | Same auth gate as `auth` (used together on customer routes) |
| `admin` | `/admin/**` | Redirect to `/` if `role !== 'admin'` |

Admin pages: `definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })`.  
SSR auth bootstrap: `plugins/auth.server.ts` hydrates session from cookies on `/admin` routes.

## Security

- **JWT**: Access (15m) + Refresh (7d) tokens stored in httpOnly, Secure cookies
- **VNPAY**: HMAC-SHA512 signature verification on both IPN and Return
- **Rate limiting**: `@nestjs/throttler` (60 req/min)
- **Helmet**: HTTP headers security
- **Validation**: `class-validator` with `whitelist: true` (strips unknown fields)
- **Prisma**: Parameterized queries (no SQL injection)
