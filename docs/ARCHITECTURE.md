# Architecture

> Flowcharts chi tiết từng luồng: [FLOWS.md](./FLOWS.md)

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
│          PostgreSQL 16 :5432          │  SePay Sandbox        │
│  users │ products │ orders │ payment  │  (payment gateway)    │
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
Login Form → Nuxt → POST /auth/login → NestJS validates → Set-Cookie (httpOnly access + refresh)
Subsequent API calls: credentials: 'include' only (no localStorage / Bearer header)
Login response body: { user } — tokens are not returned in JSON
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

### 4. SePay Payment
```
User clicks "Thanh toán bằng SePay"
  → NestJS builds signed form fields → frontend POST form to SePay checkout
  → User pays on SePay
  → SePay IPN (server-to-server POST JSON) → NestJS marks order paid
  → SePay redirect (browser) → Nuxt /payments/return reads DB status
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
| NestJS | SePay | HTTPS | HMAC-SHA256 (form) + IPN webhook |

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

- **JWT**: Access (15m) + Refresh (7d) in httpOnly cookies; cookie-only on API (no Bearer)
- **Config**: `@nestjs/config` + Joi validates env at startup (`backend/src/config/`)
- **SePay**: HMAC-SHA256 form signature; IPN is source of truth for `paid`
- **Rate limiting**: `@nestjs/throttler` (60 req/min)
- **Helmet**: HTTP headers security
- **Validation**: `class-validator` with `whitelist: true` (strips unknown fields)
- **Prisma**: Parameterized queries (no SQL injection)
