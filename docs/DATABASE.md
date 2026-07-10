# Database Schema

## Entity Relationship

```
users ─── user_addresses
  │
  ├── cart_items ─── products
  ├── wishlists ─── products
  ├── product_reviews ─── products
  ├── orders ─── order_items ─── products
  │     └── payment_transactions
  └── saved_builds ─── saved_build_items ─── products

categories ─── products
brands ─── products
products ─── product_images
         ─── product_specs
         ─── pc_components
```

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | Auto-increment |
| username | VARCHAR(50) UNIQUE | |
| email | VARCHAR(100) UNIQUE | Indexed |
| password_hash | VARCHAR(255) | bcrypt |
| role | VARCHAR(20) | `customer` or `admin` |
| is_active | BOOLEAN | Default true |
| created_at / updated_at | TIMESTAMP | |

### `user_addresses`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| user_id | BIGINT FK → users | CASCADE delete |
| receiver_name | VARCHAR(100) | |
| phone | VARCHAR(20) | |
| address_line | TEXT | |
| ward / district / city | VARCHAR(100) | |
| is_default | BOOLEAN | |

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR(100) | |
| slug | VARCHAR(100) UNIQUE | |
| parent_id | BIGINT FK → self | SET NULL on delete |
| UNIQUE(name, parent_id) | | |

### `brands`
| Column | Type |
|---|---|
| id | BIGINT PK |
| name | VARCHAR(100) UNIQUE |
| slug | VARCHAR(100) UNIQUE |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| category_id | BIGINT FK | |
| brand_id | BIGINT FK | |
| name | VARCHAR(255) | |
| slug | VARCHAR(255) UNIQUE | |
| price | NUMERIC(12,2) | CHECK >= 0 |
| stock_quantity | INT | CHECK >= 0 |
| image_url | TEXT | |
| description | TEXT | |
| is_pc_component | BOOLEAN | Indexed |
| ai_tags | TEXT[] | GIN index |
| status | VARCHAR(20) | `active`, `inactive`, `out_of_stock`, `discontinued` |

### `product_images`
| Column | Type |
|---|---|
| id | BIGINT PK |
| product_id | BIGINT FK |
| image_url | TEXT |
| is_main | BOOLEAN |
| sort_order | INT |

### `product_specs`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| product_id | BIGINT FK UNIQUE | |
| cpu_brand / cpu_series / cpu_model | VARCHAR | Indexed on cpu_brand |
| ram_capacity / ram_generation | INT / VARCHAR | Indexed |
| storage_capacity / storage_type | INT / VARCHAR | |
| gpu_model | VARCHAR | Indexed |
| screen_size | NUMERIC(4,1) | |
| specs | JSONB | GIN index for arbitrary specs |

### `pc_components`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| product_id | BIGINT FK UNIQUE | |
| component_type | VARCHAR(50) | `CPU`, `MAINBOARD`, `RAM`, `VGA`, `PSU`, `CASE`, `STORAGE`, `COOLER` |
| socket | VARCHAR(50) | Indexed |
| chipset | VARCHAR(50) | |
| ram_generation | VARCHAR(20) | Indexed |
| ram_slots / max_ram_capacity / ram_capacity / ram_bus | INT | |
| form_factor | VARCHAR(50) | Indexed |
| gpu_length_mm / max_gpu_length_mm | INT | |
| cpu_cooler_height_mm / max_cpu_cooler_height_mm | INT | |
| power_consumption / power_supply_watt | INT | |
| pcie_version | VARCHAR(20) | |
| storage_interface | VARCHAR(50) | |
| detailed_specs | JSONB | GIN index |

### `cart_items`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| user_id | BIGINT FK | CASCADE |
| product_id | BIGINT FK | CASCADE |
| quantity | INT | CHECK > 0 |
| UNIQUE(user_id, product_id) | | |

### `wishlists`
| Column | Type |
|---|---|
| id | BIGINT PK |
| user_id | BIGINT FK |
| product_id | BIGINT FK |
| UNIQUE(user_id, product_id) | |

### `product_reviews`
| Column | Type |
|---|---|
| id | BIGINT PK |
| user_id | BIGINT FK (SET NULL) |
| product_id | BIGINT FK |
| rating | INT (1-5) |
| comment | TEXT |
| created_at | TIMESTAMP |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| user_id | BIGINT FK | SET NULL |
| total_amount | NUMERIC(12,2) | CHECK >= 0 |
| shipping_fee | NUMERIC(12,2) | Default 0 |
| shipping_address | TEXT | |
| customer_name / customer_phone | VARCHAR | |
| note | TEXT | |
| status | VARCHAR(50) | `pending` → `confirmed` → `shipping` → `delivered` (terminal); `cancelled` (terminal). Legacy `completed` migrated to `delivered`. |
| payment_status | VARCHAR(50) | `unpaid`, `paid`, `failed`, `refunded` |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| order_id | BIGINT FK | CASCADE |
| product_id | BIGINT FK | SET NULL |
| product_name / product_slug / product_image_url | VARCHAR | Snapshot at purchase time |
| quantity | INT | |
| price / subtotal | NUMERIC(12,2) | subtotal = GENERATED ALWAYS AS (quantity * price) |

### `payment_transactions`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| order_id | BIGINT FK UNIQUE | CASCADE |
| provider | VARCHAR(50) | Default `sepay` |
| invoice_number | VARCHAR(100) UNIQUE | SePay `order_invoice_number` |
| external_txn_id | VARCHAR(100) | SePay transaction id |
| amount | NUMERIC(12,2) | |
| status | VARCHAR(50) | `processing`, `success`, `failed`, `cancelled` |
| raw_response | JSONB | Full IPN payload |
| payment_date | TIMESTAMP | |

### `saved_builds`
| Column | Type |
|---|---|
| id | BIGINT PK |
| user_id | BIGINT FK |
| name | VARCHAR(100) |
| total_price | NUMERIC(12,2) |

### `saved_build_items`
| Column | Type |
|---|---|
| id | BIGINT PK |
| build_id | BIGINT FK |
| product_id | BIGINT FK |
| component_type | VARCHAR(50) |

## Key Indexes

| Table | Index | Type |
|---|---|---|
| products | `idx_products_ai_tags` | GIN |
| product_specs | `idx_product_specs_jsonb` | GIN |
| pc_components | `idx_pc_components_detailed_specs` | GIN |
| payment_transactions | — | raw_response is JSONB |
| products | `idx_products_category_id`, `brand_id`, `price`, `status`, `is_pc_component` | B-tree |
| pc_components | `idx_pc_components_type`, `socket`, `ram_generation`, `form_factor` | B-tree |
| product_specs | `idx_product_specs_cpu_brand`, `ram_capacity`, `gpu_model` | B-tree |

## JSONB Query Patterns

```sql
-- GIN index match (find DDR5 mainboards)
SELECT * FROM pc_components
WHERE component_type = 'MAINBOARD'
  AND detailed_specs @> '{"memory_support": "DDR5"}';

-- Path access
SELECT detailed_specs->>'memory_support' FROM pc_components;

-- Prisma raw query
await prisma.$queryRaw`
  SELECT * FROM pc_components
  WHERE detailed_specs @> ${JSON.stringify({ key: 'value' })}
`;
```

## Schema source of truth

**Prisma migrations** (`backend/prisma/migrations/`) define the database schema. Do not run legacy `002-schema.sql` on new databases.

Docker Postgres first boot only runs `init-scripts/001-init.sql` (extensions). Schema is applied when the backend container runs `prisma migrate deploy`.

## Sample data

### Prisma seed (minimal)

```bash
cd backend && npx prisma db seed
```

Creates admin, 1 customer, ~8 PC components, 1 laptop. Skips if `admin@techshop.com` exists unless `SEED_FORCE=1`.

### Extended SQL sample (large dataset)

File: [`scripts/sample-data-extended.sql`](../scripts/sample-data-extended.sql)

Catalog-heavy sample (nhiều SP theo từng category/brand): [`scripts/sample-data-catalog-brands.sql`](../scripts/sample-data-catalog-brands.sql)

**Append-only** — does not delete existing data. Adds:

| Entity | ~Count added |
|--------|----------------|
| Brands | 18 |
| Categories | monitor, keyboard, mouse, laptop sub-categories |
| PC products | 32 components (CPU→Cooler) |
| Laptops | 6 |
| Peripherals | 6 |
| Users | 3 (`shopper2@test.com`, `gamer@test.com`, `office@test.com`) |
| Reviews, cart, wishlist, orders, saved builds | yes |

**New user passwords:** `shopper123`, `gamer123`, `office123` (same hash as `customer123` for `office@test.com`).

```bash
# Docker Postgres
docker exec -i techshop-db psql -U techshop -d techshop < scripts/sample-data-extended.sql
docker exec -i techshop-db psql -U techshop -d techshop < scripts/sample-data-catalog-brands.sql

# Or with connection string / Neon
psql "$DATABASE_URL" -f scripts/sample-data-extended.sql
psql "$DATABASE_URL" -f scripts/sample-data-catalog-brands.sql
```

`sample-data-catalog-brands.sql` thêm ~80+ sản phẩm (CPU, mainboard, RAM, VGA, storage, PSU, case, cooler, laptop, monitor, keyboard, mouse, headset, webcam) gắn đúng category/brand; kèm `pc_components` / `product_specs` / ảnh placeholder. Chạy lại an toàn (`ON CONFLICT DO NOTHING`).

Script ends with a row count summary per table.
