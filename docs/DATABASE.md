# Database Schema

## Entity Relationship

```
users ─── user_addresses
  │
  ├── cart_items ─── products
  ├── wishlists ─── products
  ├── product_reviews ─── products
  ├── orders ─── order_items ─── products
  │     └── vnpay_transactions
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
| status | VARCHAR(50) | `pending`, `confirmed`, `shipping`, `completed`, `cancelled` |
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

### `vnpay_transactions`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| order_id | BIGINT FK UNIQUE | CASCADE |
| vnpay_txn_ref | VARCHAR(100) UNIQUE | |
| vnpay_transaction_no | VARCHAR(100) | From VNPAY |
| amount | NUMERIC(12,2) | |
| bank_code | VARCHAR(20) | |
| response_code | VARCHAR(10) | |
| status | VARCHAR(50) | `processing`, `success`, `failed` |
| secure_hash | VARCHAR(255) | HMAC-SHA512 |
| raw_response | JSONB | Full VNPAY response |
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
| vnpay_transactions | — | raw_response is JSONB |
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
