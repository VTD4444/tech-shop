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
│                    NestJS API :3000                           │
│  ┌───┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐       │
│  │Auth│ │Users │ │Prod  │ │Cart  │ │Order │ │PC     │       │
│  │    │ │Addr  │ │Cat   │ │Wish  │ │Pay   │ │Builder│       │
│  └───┘ └──────┘ └──────┘ └──────┘ └──────┘ └───────┘       │
│                  │ Prisma ORM                                │
└──────────────────┼───────────────────────────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────────────────────────────┐
│          PostgreSQL 16 + pgvector :5432                       │
│  users │ products │ pc_components │ orders │ vnpay_txns      │
└───────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│   FastAPI AI Service :8000             │
│   POST /advisor/recommend              │
│   POST /advisor/chat                   │
│        │                               │
│        ▼                               │
│   Gemini 2.0 Flash API (external)      │
└────────────────────────────────────────┘
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
  → POST /pc-builder/validate { componentIds[] }
  → NestJS queries pc_components JOIN products
  → Applies 6 rules: socket, RAM gen, form factor, GPU length, cooler height, PSU wattage
  → Returns { compatible, issues[], totalWattage, totalPrice }
```

### 6. AI Advisor (RAG)
```
POST /ai-service/api/v1/advisor/recommend { budget, purpose }
  → FastAPI calls NestJS GET /pc-builder/components + GET /products
  → Builds prompt with product data
  → Calls Gemini 2.0 Flash
  → Parses JSON response
  → Returns { recommended_components[], total_price, explanation }
```

## Communication Protocols

| From | To | Protocol | Auth |
|---|---|---|---|
| Nuxt | NestJS | HTTP REST | httpOnly JWT cookie |
| Nuxt | FastAPI | HTTP REST | None (internal) |
| FastAPI | NestJS | HTTP REST | None (internal Docker network) |
| FastAPI | Gemini | HTTPS (gRPC/HTTP) | API Key |
| NestJS | VNPAY | HTTPS | HMAC-SHA512 |

## Security

- **JWT**: Access (15m) + Refresh (7d) tokens stored in httpOnly, Secure cookies
- **VNPAY**: HMAC-SHA512 signature verification on both IPN and Return
- **Rate limiting**: `@nestjs/throttler` (60 req/min)
- **Helmet**: HTTP headers security
- **Validation**: `class-validator` with `whitelist: true` (strips unknown fields)
- **Prisma**: Parameterized queries (no SQL injection)
