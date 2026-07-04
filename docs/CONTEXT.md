# TechShop — Project Context (Fast-load)

> File này cung cấp overview ngắn gọn để opencode hiểu context mà không cần quét toàn bộ codebase.

## Stack

| Layer | Công nghệ | Version |
|---|---|---|
| Frontend | Nuxt 3 + Tailwind CSS + Pinia | Nuxt ^3.16 |
| Main API | NestJS + TypeScript | ^11.0 |
| ORM | Prisma (v7, adapter-pg) | ^7.0 |
| Database | PostgreSQL 16 + pgvector | 16-alpine |
| AI Service | Python FastAPI + Gemini | FastAPI ^0.115 |
| Auth | JWT (httpOnly cookie + Bearer) | — |
| Payment | SePay Sandbox (HMAC-SHA256 form + IPN) | — |
| Email | Resend | — |

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
| Payments | `backend/src/modules/payments/` | SePay form init, IPN, status |
| Mail | `backend/src/modules/mail/` | Resend — order + reset password emails |
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
| `/wishlist` | `pages/wishlist.vue` | Yes | Yes |
| `/pc-builder` | `pages/pc-builder/index.vue` | No | Yes |
| `/advisor` | `pages/advisor/index.vue` | No | ClientOnly (Recommend + Chat tabs) |
| `/payments/return` | `pages/payments/return.vue` | No | Yes |
| `/admin` | `pages/admin/index.vue` | Admin | No (SSR off) |
| `/admin/orders` | `pages/admin/orders/index.vue` | Admin | No |
| `/admin/products` | `pages/admin/products/index.vue` | Admin | No |
| `/admin/categories` | `pages/admin/categories/index.vue` | Admin | No |
| `/admin/brands` | `pages/admin/brands/index.vue` | Admin | No |
| `/forgot-password` | `pages/forgot-password.vue` | No | ClientOnly |
| `/reset-password` | `pages/reset-password.vue` | No | ClientOnly |
| `/profile` | `pages/profile.vue` | Yes | Yes |
| `/login` | `pages/login.vue` | No | Blank layout |
| `/register` | `pages/register.vue` | No | Blank layout |

## AI Service Endpoints

| Method | Path | Chức năng |
|---|---|---|
| POST | `/api/v1/advisor/recommend` | Recommend PC build by budget + purpose (RAG) |
| POST | `/api/v1/advisor/chat` | Conversational Q&A (non-stream) |
| POST | `/api/v1/advisor/chat/stream` | Chat SSE streaming (`data: {"token": "..."}`) |
| GET | `/api/v1/advisor/health` | Health check |
| GET | `/api/v1/advisor/health/gemini` | Gemini API key / quota probe |

Frontend AI client: `$aiApi` + `useAdvisorChat` composable. Dev proxy: `NUXT_PUBLIC_AI_API_URL=/api/ai`.

## Key Frontend Pieces

| Piece | Path | Chức năng |
|---|---|---|
| Auth store | `stores/auth.ts` | Session, refresh, admin role |
| Wishlist store | `stores/wishlist.ts` | Sync with `/wishlist` API |
| Advisor chat | `composables/useAdvisorChat.ts` | SSE stream, localStorage history, fallback |
| Advisor UI | `components/advisor/AdvisorChat.vue` | Chat tab with markdown rendering |
| User menu | `components/layout/AppUserMenu.vue` | Profile dropdown (orders, wishlist, admin, logout) |
| Middleware | `middleware/admin.ts`, `middleware/customer.ts` | RBAC route guards |

## Key Design Decisions

1. **Auth**: httpOnly cookie (`Set-Cookie: access_token=...`), Nuxt `credentials: 'include'`
2. **RBAC**: `admin` / `customer` middleware on routes; URLs unchanged (`/orders`, not `/customer/orders`)
3. **Checkout atomicity**: `$transaction` + `SELECT ... FOR UPDATE` (sorted IDs to prevent deadlock)
4. **Checkout payment**: Review order → **Thanh toán bằng SePay** (form POST) or **Thanh toán sau** (pending order)
5. **PC Builder rules**: Server-side NestJS service (6 rules) + `selectedIds` pre-filter in component picker
6. **SePay**: HMAC-SHA256 form signature, idempotent IPN handler; callbacks → `/payments/return`
7. **AI RAG**: FastAPI fetches live product data from NestJS → builds prompt → Gemini parses JSON
8. **AI Chat**: SSE streaming with non-stream fallback; history in `localStorage` (50 messages)

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
const { $api } = useNuxtApp();      // NestJS API client (credentials: include)
const { $aiApi } = useNuxtApp();    // AI service client (proxy /api/ai in dev)
const config = useRuntimeConfig();  // Runtime config
