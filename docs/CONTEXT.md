# TechShop — Project Context (Fast-load)

> File này cung cấp overview ngắn gọn để opencode hiểu context mà không cần quét toàn bộ codebase.

## Stack

| Layer | Công nghệ | Version |
|---|---|---|
| Frontend | Nuxt 3 + Tailwind CSS + Pinia | Nuxt ^3.16 |
| Main API | NestJS + TypeScript | ^11.0 |
| ORM | Prisma (v7, adapter-pg) | ^7.0 |
| Database | PostgreSQL 16 + pgvector | 16-alpine |
| AI Service | Python FastAPI + Gemini 2.0 Flash | FastAPI ^0.115 |
| Auth | JWT (httpOnly cookie + Bearer) | — |
| Payment | VNPAY Sandbox (HMAC-SHA512) | — |

## Cấu trúc thư mục

```
tech-shop/
├── backend/       # NestJS API (54+ source files)
├── frontend/      # Nuxt 3 (29+ source files)
├── ai-service/    # FastAPI (20+ source files)
├── docs/          # Tài liệu dự án
├── init-scripts/  # SQL init (pgvector extension)
├── docker-compose.yml
└── .gitignore
```

## Backend Modules

| Module | Path | Chức năng |
|---|---|---|
| Common | `backend/src/common/` | Guards, decorators, filters, interceptors, DTOs |
| Prisma | `backend/src/modules/prisma/` | PrismaService wrapper |
| Auth | `backend/src/modules/auth/` | JWT login/register/refresh, cookie-based |
| Users | `backend/src/modules/users/` | Profile + address CRUD |
| Categories | `backend/src/modules/categories/` | Tree categories |
| Brands | `backend/src/modules/brands/` | Brand CRUD |
| Products | `backend/src/modules/products/` | Filter/search/specs/reviews |
| Cart | `backend/src/modules/cart/` | Cart with stock validation |
| Wishlist | `backend/src/modules/wishlist/` | Wishlist CRUD |
| Orders | `backend/src/modules/orders/` | Checkout (atomic), history, cancel |
| Payments | `backend/src/modules/payments/` | VNPAY url gen, IPN, return |
| PC Builder | `backend/src/modules/pc-builder/` | 6 compatibility rules engine |
| Admin | `backend/src/modules/admin/` | Order mgmt, inventory, analytics |

## Frontend Pages

| Route | File | Auth | SSR |
|---|---|---|---|
| `/` | `pages/index.vue` | No | Yes |
| `/products` | `pages/products/index.vue` | No | Yes |
| `/products/:slug` | `pages/products/[slug].vue` | No | Yes |
| `/cart` | `pages/cart.vue` | Yes | Yes |
| `/checkout` | `pages/checkout.vue` | Yes | Yes |
| `/orders` | `pages/orders/index.vue` | Yes | Yes |
| `/orders/:id` | `pages/orders/[id].vue` | Yes | Yes |
| `/pc-builder` | `pages/pc-builder/index.vue` | No | Yes |
| `/advisor` | `pages/advisor/index.vue` | No | ClientOnly |
| `/vnpay/return` | `pages/vnpay/return.vue` | No | Yes |
| `/profile` | `pages/profile.vue` | Yes | Yes |
| `/login` | `pages/login.vue` | No | Blank layout |
| `/register` | `pages/register.vue` | No | Blank layout |

## AI Service Endpoints

| Method | Path | Chức năng |
|---|---|---|
| POST | `/api/v1/advisor/recommend` | Recommend PC build by budget + purpose |
| POST | `/api/v1/advisor/chat` | Conversational Q&A |
| GET | `/api/v1/advisor/health` | Health check |

## Key Design Decisions

1. **Auth**: httpOnly cookie (`Set-Cookie: access_token=...`), Nuxt `credentials: 'include'`
2. **Checkout atomicity**: `$transaction` + `SELECT ... FOR UPDATE` (sorted IDs to prevent deadlock)
3. **PC Builder rules**: Server-side NestJS service (6 rules: socket, RAM gen, form factor, GPU length, cooler height, PSU wattage)
4. **VNPAY**: HMAC-SHA512 signature, idempotent IPN handler
5. **AI RAG**: FastAPI fetches live product data from NestJS → builds prompt → Gemini parses JSON

## File Naming Conventions

- **NestJS**: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.guard.ts`
- **Prisma**: `schema.prisma`, `seed.ts`
- **Nuxt**: `*.vue` (PascalCase for components, kebab-case for pages)
- **FastAPI**: `*.py` (snake_case)

## Common Patterns

```typescript
// Error response format (all APIs)
{ success: false, message: "..." }

// Success response format
{ success: true, data: { ... }, meta?: { page, limit, total, totalPages } }

// Pagination params
?page=1&limit=20

// Reactivity (Nuxt)
const store = useXxxStore();        // Pinia
const { $api } = useNuxtApp();      // API client
const config = useRuntimeConfig();  // Runtime config
