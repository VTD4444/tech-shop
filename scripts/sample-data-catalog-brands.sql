-- =============================================================================
-- TechShop — Sample catalog by category × brand (append-only, safe to re-run)
--
-- Mục tiêu: mỗi danh mục (catalog) có nhiều sản phẩm; mỗi brand có ít nhất
-- vài sản phẩm gắn đúng category phù hợp.
--
-- Chạy SAU seed Prisma (hoặc sample-data-extended.sql):
--   psql "$DATABASE_URL" -f scripts/sample-data-catalog-brands.sql
-- DataGrip: Execute toàn bộ file.
-- =============================================================================

ROLLBACK;

-- -----------------------------------------------------------------------------
-- Categories (đầy đủ + phụ kiện)
-- -----------------------------------------------------------------------------
INSERT INTO categories (name, slug, created_at, updated_at) VALUES
  ('CPU', 'cpu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Mainboard', 'mainboard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('VGA', 'vga', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('RAM', 'ram', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Storage', 'storage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PSU', 'psu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Case', 'case', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Cooler', 'cooler', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Laptop', 'laptop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Monitor', 'monitor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Keyboard', 'keyboard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Mouse', 'mouse', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Headset', 'headset', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Webcam', 'webcam', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (name, slug, parent_id, created_at, updated_at)
SELECT 'Gaming Laptop', 'gaming-laptop', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories WHERE slug = 'laptop'
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (name, slug, parent_id, created_at, updated_at)
SELECT 'Office Laptop', 'office-laptop', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories WHERE slug = 'laptop'
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (name, slug, parent_id, created_at, updated_at)
SELECT 'Ultrabook', 'ultrabook', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories WHERE slug = 'laptop'
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, updated_at = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- Brands
-- -----------------------------------------------------------------------------
INSERT INTO brands (name, slug) VALUES
  ('Intel', 'intel'),
  ('AMD', 'amd'),
  ('NVIDIA', 'nvidia'),
  ('ASUS', 'asus'),
  ('MSI', 'msi'),
  ('Gigabyte', 'gigabyte'),
  ('ASRock', 'asrock'),
  ('Corsair', 'corsair'),
  ('Kingston', 'kingston'),
  ('TeamGroup', 'teamgroup'),
  ('Crucial', 'crucial'),
  ('Samsung', 'samsung'),
  ('Western Digital', 'western-digital'),
  ('Seagate', 'seagate'),
  ('Cooler Master', 'cooler-master'),
  ('be quiet!', 'be-quiet'),
  ('NZXT', 'nzxt'),
  ('Noctua', 'noctua'),
  ('Logitech', 'logitech'),
  ('Razer', 'razer'),
  ('LG', 'lg'),
  ('Dell', 'dell'),
  ('Lenovo', 'lenovo'),
  ('HP', 'hp'),
  ('Acer', 'acer'),
  ('Apple', 'apple'),
  ('Deepcool', 'deepcool'),
  ('Thermalright', 'thermalright'),
  ('G.Skill', 'gskill'),
  ('Patriot', 'patriot'),
  ('Lian Li', 'lian-li'),
  ('HyperX', 'hyperx')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- CPU — Intel + AMD (nhiều SKU / brand)
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('cpu', 'intel', 'Intel Core i9-14900K', 'intel-core-i9-14900k', 13990000, 25, ARRAY['cpu','intel','flagship','lga1700'], 'i9-14900K 24C/32T, LGA1700'),
  ('cpu', 'intel', 'Intel Core i5-14400F', 'intel-core-i5-14400f', 4490000, 70, ARRAY['cpu','intel','value','lga1700'], 'i5-14400F 10C/16T, no iGPU'),
  ('cpu', 'intel', 'Intel Core Ultra 7 265K', 'intel-core-ultra-7-265k', 11990000, 20, ARRAY['cpu','intel','arrow-lake','lga1851'], 'Core Ultra 7 265K, LGA1851'),
  ('cpu', 'intel', 'Intel Core i7-13700KF', 'intel-core-i7-13700kf', 8490000, 35, ARRAY['cpu','intel','gaming','lga1700'], 'i7-13700KF 16C/24T'),
  ('cpu', 'amd', 'AMD Ryzen 9 7950X3D', 'amd-ryzen-9-7950x3d', 15990000, 15, ARRAY['cpu','amd','x3d','am5'], '7950X3D 16C, 3D V-Cache'),
  ('cpu', 'amd', 'AMD Ryzen 7 7700', 'amd-ryzen-7-7700', 6990000, 45, ARRAY['cpu','amd','am5'], 'Ryzen 7 7700 8C/16T'),
  ('cpu', 'amd', 'AMD Ryzen 5 5600', 'amd-ryzen-5-5600', 2790000, 90, ARRAY['cpu','amd','am4','budget'], 'Ryzen 5 5600 6C/12T AM4'),
  ('cpu', 'amd', 'AMD Ryzen 9 9900X', 'amd-ryzen-9-9900x', 12990000, 18, ARRAY['cpu','amd','zen5','am5'], 'Ryzen 9 9900X 12C Zen 5')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, socket, ram_generation, power_consumption, updated_at)
SELECT p.id, 'CPU', v.socket, v.ram_gen, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('intel-core-i9-14900k', 'LGA1700', 'DDR5', 253),
  ('intel-core-i5-14400f', 'LGA1700', 'DDR5', 148),
  ('intel-core-ultra-7-265k', 'LGA1851', 'DDR5', 125),
  ('intel-core-i7-13700kf', 'LGA1700', 'DDR5', 190),
  ('amd-ryzen-9-7950x3d', 'AM5', 'DDR5', 120),
  ('amd-ryzen-7-7700', 'AM5', 'DDR5', 65),
  ('amd-ryzen-5-5600', 'AM4', 'DDR4', 65),
  ('amd-ryzen-9-9900x', 'AM5', 'DDR5', 120)
) AS v(slug, socket, ram_gen, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- MAINBOARD — ASUS / MSI / Gigabyte / ASRock
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('mainboard', 'asus', 'ASUS ROG Strix B650-A Gaming WiFi', 'asus-rog-strix-b650-a', 5890000, 28, ARRAY['mainboard','amd','b650','am5'], 'ATX B650 AM5 WiFi'),
  ('mainboard', 'asus', 'ASUS PRIME B760M-A WiFi', 'asus-prime-b760m-a-wifi', 3590000, 40, ARRAY['mainboard','intel','b760'], 'mATX B760 LGA1700'),
  ('mainboard', 'msi', 'MSI MAG Z790 Tomahawk WiFi', 'msi-mag-z790-tomahawk', 7490000, 20, ARRAY['mainboard','intel','z790'], 'ATX Z790 LGA1700'),
  ('mainboard', 'msi', 'MSI PRO B550M-A WiFi', 'msi-pro-b550m-a-wifi', 2490000, 50, ARRAY['mainboard','amd','b550','am4'], 'mATX B550 AM4'),
  ('mainboard', 'gigabyte', 'Gigabyte B650 AORUS Elite AX', 'gigabyte-b650-aorus-elite-ax', 4990000, 32, ARRAY['mainboard','amd','b650'], 'ATX B650 WiFi 6E'),
  ('mainboard', 'gigabyte', 'Gigabyte Z790 UD AC', 'gigabyte-z790-ud-ac', 5290000, 26, ARRAY['mainboard','intel','z790'], 'ATX Z790 value'),
  ('mainboard', 'asrock', 'ASRock B650M PG Riptide', 'asrock-b650m-pg-riptide', 3890000, 35, ARRAY['mainboard','amd','b650','matx'], 'mATX B650 AM5'),
  ('mainboard', 'asrock', 'ASRock Z790 Pro RS WiFi', 'asrock-z790-pro-rs-wifi', 5690000, 22, ARRAY['mainboard','intel','z790'], 'ATX Z790 WiFi')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, socket, chipset, ram_generation, ram_slots, max_ram_capacity, form_factor, power_consumption, max_gpu_length_mm, max_cpu_cooler_height_mm, updated_at)
SELECT p.id, 'MAINBOARD', v.socket, v.chipset, v.ram_gen, v.slots, v.max_ram, v.ff, v.watt, v.gpu_len, v.cooler_h, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('asus-rog-strix-b650-a', 'AM5', 'B650', 'DDR5', 4, 128, 'ATX', 40, 380, 175),
  ('asus-prime-b760m-a-wifi', 'LGA1700', 'B760', 'DDR5', 4, 128, 'Micro-ATX', 30, 340, 160),
  ('msi-mag-z790-tomahawk', 'LGA1700', 'Z790', 'DDR5', 4, 192, 'ATX', 45, 400, 180),
  ('msi-pro-b550m-a-wifi', 'AM4', 'B550', 'DDR4', 4, 128, 'Micro-ATX', 28, 320, 155),
  ('gigabyte-b650-aorus-elite-ax', 'AM5', 'B650', 'DDR5', 4, 128, 'ATX', 38, 370, 170),
  ('gigabyte-z790-ud-ac', 'LGA1700', 'Z790', 'DDR5', 4, 128, 'ATX', 40, 360, 170),
  ('asrock-b650m-pg-riptide', 'AM5', 'B650', 'DDR5', 4, 128, 'Micro-ATX', 32, 350, 165),
  ('asrock-z790-pro-rs-wifi', 'LGA1700', 'Z790', 'DDR5', 4, 192, 'ATX', 42, 380, 175)
) AS v(slug, socket, chipset, ram_gen, slots, max_ram, ff, watt, gpu_len, cooler_h) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- RAM — Corsair / Kingston / G.Skill / TeamGroup / Crucial / Patriot
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('ram', 'corsair', 'Corsair Dominator Platinum 64GB DDR5', 'corsair-dominator-64gb-ddr5', 7890000, 25, ARRAY['ram','ddr5','64gb','rgb'], '2x32GB DDR5 6000 CL30'),
  ('ram', 'kingston', 'Kingston Fury Renegade 32GB DDR5', 'kingston-fury-renegade-32gb-ddr5', 2890000, 80, ARRAY['ram','ddr5','32gb'], '2x16GB DDR5 6400'),
  ('ram', 'gskill', 'G.Skill Trident Z5 RGB 32GB', 'gskill-trident-z5-32gb', 3190000, 60, ARRAY['ram','ddr5','rgb'], '2x16GB DDR5 6000 CL36'),
  ('ram', 'gskill', 'G.Skill Ripjaws V 16GB DDR4', 'gskill-ripjaws-v-16gb-ddr4', 990000, 100, ARRAY['ram','ddr4','budget'], '2x8GB DDR4 3200'),
  ('ram', 'teamgroup', 'TeamGroup Vulcan 32GB DDR5', 'teamgroup-vulcan-32gb-ddr5', 2290000, 70, ARRAY['ram','ddr5'], '2x16GB DDR5 5600'),
  ('ram', 'crucial', 'Crucial Ballistix 16GB DDR4', 'crucial-ballistix-16gb-ddr4', 890000, 110, ARRAY['ram','ddr4'], '2x8GB DDR4 3200'),
  ('ram', 'patriot', 'Patriot Viper Venom 32GB DDR5', 'patriot-viper-venom-32gb-ddr5', 2490000, 55, ARRAY['ram','ddr5'], '2x16GB DDR5 6000'),
  ('ram', 'corsair', 'Corsair Vengeance 16GB DDR5', 'corsair-vengeance-16gb-ddr5', 1490000, 95, ARRAY['ram','ddr5','16gb'], '2x8GB DDR5 5600')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, ram_generation, ram_capacity, ram_bus, power_consumption, updated_at)
SELECT p.id, 'RAM', v.ram_gen, v.cap, v.bus, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('corsair-dominator-64gb-ddr5', 'DDR5', 64, 6000, 14),
  ('kingston-fury-renegade-32gb-ddr5', 'DDR5', 32, 6400, 10),
  ('gskill-trident-z5-32gb', 'DDR5', 32, 6000, 10),
  ('gskill-ripjaws-v-16gb-ddr4', 'DDR4', 16, 3200, 6),
  ('teamgroup-vulcan-32gb-ddr5', 'DDR5', 32, 5600, 9),
  ('crucial-ballistix-16gb-ddr4', 'DDR4', 16, 3200, 6),
  ('patriot-viper-venom-32gb-ddr5', 'DDR5', 32, 6000, 9),
  ('corsair-vengeance-16gb-ddr5', 'DDR5', 16, 5600, 8)
) AS v(slug, ram_gen, cap, bus, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- VGA — NVIDIA / AMD / MSI / ASUS / Gigabyte
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('vga', 'nvidia', 'NVIDIA RTX 4070 12GB Founders', 'nvidia-rtx-4070-12gb', 15990000, 20, ARRAY['vga','rtx','1440p'], 'RTX 4070 12GB GDDR6X'),
  ('vga', 'nvidia', 'NVIDIA RTX 4090 24GB', 'nvidia-rtx-4090-24gb', 45990000, 8, ARRAY['vga','rtx','4k','flagship'], 'RTX 4090 24GB'),
  ('vga', 'amd', 'AMD Radeon RX 7600', 'amd-radeon-rx-7600', 6990000, 35, ARRAY['vga','amd','1080p'], 'RX 7600 8GB'),
  ('vga', 'amd', 'AMD Radeon RX 7900 XTX', 'amd-radeon-rx-7900-xtx', 24990000, 12, ARRAY['vga','amd','4k'], 'RX 7900 XTX 24GB'),
  ('vga', 'asus', 'ASUS TUF RTX 4070 Super OC', 'asus-tuf-rtx-4070-super-oc', 18990000, 16, ARRAY['vga','asus','rtx'], 'TUF Gaming RTX 4070 Super'),
  ('vga', 'msi', 'MSI Gaming X Slim RTX 4060', 'msi-gaming-x-slim-rtx-4060', 8490000, 40, ARRAY['vga','msi','rtx'], 'RTX 4060 8GB slim'),
  ('vga', 'gigabyte', 'Gigabyte Windforce RTX 4060 Ti', 'gigabyte-windforce-rtx-4060-ti', 11490000, 28, ARRAY['vga','gigabyte','rtx'], 'RTX 4060 Ti 8GB Windforce'),
  ('vga', 'asus', 'ASUS Dual RX 7800 XT OC', 'asus-dual-rx-7800-xt', 13490000, 18, ARRAY['vga','asus','amd'], 'Dual RX 7800 XT 16GB')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, gpu_length_mm, power_consumption, pcie_version, updated_at)
SELECT p.id, 'VGA', v.len, v.watt, v.pcie, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('nvidia-rtx-4070-12gb', 285, 200, '4.0'),
  ('nvidia-rtx-4090-24gb', 336, 450, '4.0'),
  ('amd-radeon-rx-7600', 250, 165, '4.0'),
  ('amd-radeon-rx-7900-xtx', 320, 355, '4.0'),
  ('asus-tuf-rtx-4070-super-oc', 301, 220, '4.0'),
  ('msi-gaming-x-slim-rtx-4060', 242, 115, '4.0'),
  ('gigabyte-windforce-rtx-4060-ti', 261, 160, '4.0'),
  ('asus-dual-rx-7800-xt', 295, 263, '4.0')
) AS v(slug, len, watt, pcie) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- STORAGE — Samsung / WD / Crucial / Seagate / Kingston / Corsair
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('storage', 'samsung', 'Samsung 990 EVO Plus 1TB', 'samsung-990-evo-plus-1tb', 2490000, 65, ARRAY['ssd','nvme','1tb'], '990 EVO Plus 1TB PCIe 4.0/5.0'),
  ('storage', 'samsung', 'Samsung 870 EVO 1TB SATA', 'samsung-870-evo-1tb-sata', 2190000, 70, ARRAY['ssd','sata'], '2.5" SATA SSD 1TB'),
  ('storage', 'western-digital', 'WD Blue SN580 1TB', 'wd-blue-sn580-1tb', 1890000, 85, ARRAY['ssd','nvme','value'], 'SN580 1TB PCIe 4.0'),
  ('storage', 'western-digital', 'WD Red Plus 4TB HDD', 'wd-red-plus-4tb', 3290000, 40, ARRAY['hdd','nas'], '3.5" NAS HDD 4TB'),
  ('storage', 'crucial', 'Crucial T500 1TB', 'crucial-t500-1tb', 2690000, 50, ARRAY['ssd','nvme','pcie4'], 'T500 1TB Gen4'),
  ('storage', 'seagate', 'Seagate FireCuda 530 2TB', 'seagate-firecuda-530-2tb', 5990000, 30, ARRAY['ssd','nvme','gaming'], 'FireCuda 530 2TB'),
  ('storage', 'kingston', 'Kingston NV2 2TB', 'kingston-nv2-2tb', 2790000, 75, ARRAY['ssd','budget','2tb'], 'NV2 2TB PCIe 4.0'),
  ('storage', 'corsair', 'Corsair MP600 PRO LPX 2TB', 'corsair-mp600-pro-lpx-2tb', 5490000, 28, ARRAY['ssd','nvme','ps5'], 'MP600 PRO LPX 2TB')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, storage_interface, power_consumption, updated_at)
SELECT p.id, 'STORAGE', v.iface, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('samsung-990-evo-plus-1tb', 'M.2 NVMe', 6),
  ('samsung-870-evo-1tb-sata', 'SATA 2.5"', 4),
  ('wd-blue-sn580-1tb', 'M.2 NVMe', 5),
  ('wd-red-plus-4tb', 'SATA 3.5"', 7),
  ('crucial-t500-1tb', 'M.2 NVMe', 6),
  ('seagate-firecuda-530-2tb', 'M.2 NVMe', 8),
  ('kingston-nv2-2tb', 'M.2 NVMe', 5),
  ('corsair-mp600-pro-lpx-2tb', 'M.2 NVMe', 7)
) AS v(slug, iface, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- PSU
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('psu', 'corsair', 'Corsair RM1000e', 'corsair-rm1000e', 3890000, 30, ARRAY['psu','1000w','gold'], '1000W 80+ Gold ATX 3.0'),
  ('psu', 'corsair', 'Corsair CX650F RGB', 'corsair-cx650f-rgb', 1690000, 55, ARRAY['psu','650w','rgb'], '650W 80+ Bronze RGB'),
  ('psu', 'be-quiet', 'be quiet! Pure Power 12 M 750W', 'be-quiet-pure-power-12m-750w', 2790000, 35, ARRAY['psu','750w'], '750W 80+ Gold modular'),
  ('psu', 'cooler-master', 'Cooler Master V850 SFX Gold', 'cooler-master-v850-sfx', 3490000, 22, ARRAY['psu','sfx','850w'], 'SFX 850W for SFF'),
  ('psu', 'msi', 'MSI MAG A750GL PCIE5', 'msi-mag-a750gl', 2490000, 40, ARRAY['psu','750w','pcie5'], '750W ATX 3.0'),
  ('psu', 'gigabyte', 'Gigabyte UD850GM PG5', 'gigabyte-ud850gm-pg5', 2690000, 32, ARRAY['psu','850w'], '850W Gold PCIe 5'),
  ('psu', 'asus', 'ASUS ROG Strix 850W Gold', 'asus-rog-strix-850w', 3590000, 25, ARRAY['psu','asus','850w'], 'ROG Strix 850W'),
  ('psu', 'deepcool', 'Deepcool PX850G', 'deepcool-px850g', 2590000, 38, ARRAY['psu','850w','atx3'], 'PX850G 850W ATX 3.0')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, power_supply_watt, form_factor, updated_at)
SELECT p.id, 'PSU', v.watt, v.ff, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('corsair-rm1000e', 1000, 'ATX'),
  ('corsair-cx650f-rgb', 650, 'ATX'),
  ('be-quiet-pure-power-12m-750w', 750, 'ATX'),
  ('cooler-master-v850-sfx', 850, 'SFX'),
  ('msi-mag-a750gl', 750, 'ATX'),
  ('gigabyte-ud850gm-pg5', 850, 'ATX'),
  ('asus-rog-strix-850w', 850, 'ATX'),
  ('deepcool-px850g', 850, 'ATX')
) AS v(slug, watt, ff) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- CASE
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('case', 'nzxt', 'NZXT H7 Flow RGB', 'nzxt-h7-flow-rgb', 3490000, 25, ARRAY['case','mid-tower','rgb'], 'H7 Flow RGB mid-tower'),
  ('case', 'corsair', 'Corsair 4000D Airflow', 'corsair-4000d-airflow', 2490000, 40, ARRAY['case','airflow'], '4000D Airflow ATX'),
  ('case', 'cooler-master', 'Cooler Master NR200P', 'cooler-master-nr200p', 2790000, 30, ARRAY['case','itx','sff'], 'Mini-ITX NR200P'),
  ('case', 'be-quiet', 'be quiet! Shadow Base 800 FX', 'be-quiet-shadow-base-800', 4290000, 18, ARRAY['case','premium'], 'Shadow Base 800 FX'),
  ('case', 'lian-li', 'Lian Li O11 Dynamic EVO', 'lian-li-o11-dynamic-evo', 3990000, 22, ARRAY['case','showcase'], 'O11 Dynamic EVO'),
  ('case', 'asus', 'ASUS TUF Gaming GT502', 'asus-tuf-gt502', 3290000, 28, ARRAY['case','tuf'], 'TUF GT502 dual chamber'),
  ('case', 'msi', 'MSI MAG Forge 112R', 'msi-mag-forge-112r', 1590000, 45, ARRAY['case','budget','rgb'], 'Forge 112R ARGB'),
  ('case', 'deepcool', 'Deepcool CH560 Digital', 'deepcool-ch560-digital', 2890000, 30, ARRAY['case','digital'], 'CH560 Digital LCD')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, form_factor, max_gpu_length_mm, max_cpu_cooler_height_mm, updated_at)
SELECT p.id, 'CASE', v.ff, v.gpu, v.cooler, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('nzxt-h7-flow-rgb', 'ATX / Micro-ATX / Mini-ITX', 400, 185),
  ('corsair-4000d-airflow', 'ATX / Micro-ATX / Mini-ITX', 360, 170),
  ('cooler-master-nr200p', 'Mini-ITX', 330, 155),
  ('be-quiet-shadow-base-800', 'ATX / E-ATX', 420, 190),
  ('lian-li-o11-dynamic-evo', 'ATX / Micro-ATX / Mini-ITX', 420, 167),
  ('asus-tuf-gt502', 'ATX / Micro-ATX', 400, 165),
  ('msi-mag-forge-112r', 'ATX / Micro-ATX', 330, 160),
  ('deepcool-ch560-digital', 'ATX / Micro-ATX', 380, 170)
) AS v(slug, ff, gpu, cooler) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- COOLER — Noctua / Cooler Master / Corsair / be quiet / Deepcool / Thermalright
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('cooler', 'noctua', 'Noctua NH-U12A chromax', 'noctua-nh-u12a-chromax', 2490000, 30, ARRAY['cooler','air'], 'NH-U12A dual fan'),
  ('cooler', 'cooler-master', 'Cooler Master MasterLiquid 240L Core', 'cm-masterliquid-240l', 1890000, 45, ARRAY['cooler','aio','240mm'], '240mm AIO'),
  ('cooler', 'corsair', 'Corsair iCUE H100i RGB ELITE', 'corsair-h100i-rgb-elite', 3990000, 20, ARRAY['cooler','aio','240mm'], '240mm AIO RGB'),
  ('cooler', 'be-quiet', 'be quiet! Pure Loop 2 FX 360', 'be-quiet-pure-loop-2-fx-360', 4290000, 18, ARRAY['cooler','aio','360mm'], '360mm AIO ARGB'),
  ('cooler', 'deepcool', 'Deepcool AK620 Digital', 'deepcool-ak620-digital', 1690000, 50, ARRAY['cooler','air','digital'], 'Dual tower air cooler'),
  ('cooler', 'thermalright', 'Thermalright Peerless Assassin 120 SE', 'thermalright-pa120-se', 790000, 90, ARRAY['cooler','air','budget'], 'PA120 SE dual tower'),
  ('cooler', 'nzxt', 'NZXT Kraken 360 RGB', 'nzxt-kraken-360-rgb', 4990000, 15, ARRAY['cooler','aio','360mm'], 'Kraken 360 LCD/RGB'),
  ('cooler', 'msi', 'MSI MAG CoreLiquid 240R V2', 'msi-mag-coreliquid-240r', 2290000, 35, ARRAY['cooler','aio','240mm'], '240mm AIO ARGB')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, socket, cpu_cooler_height_mm, power_consumption, updated_at)
SELECT p.id, 'COOLER', v.socket, v.height, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('noctua-nh-u12a-chromax', 'LGA1700/AM5/AM4', 158, 2),
  ('cm-masterliquid-240l', 'LGA1700/AM5/AM4', 52, 12),
  ('corsair-h100i-rgb-elite', 'LGA1700/AM5/AM4', 52, 15),
  ('be-quiet-pure-loop-2-fx-360', 'LGA1700/AM5/AM4', 55, 18),
  ('deepcool-ak620-digital', 'LGA1700/AM5/AM4', 160, 3),
  ('thermalright-pa120-se', 'LGA1700/AM5/AM4', 155, 2),
  ('nzxt-kraken-360-rgb', 'LGA1700/AM5/AM4', 56, 20),
  ('msi-mag-coreliquid-240r', 'LGA1700/AM5/AM4', 52, 12)
) AS v(slug, socket, height, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- LAPTOPS — ASUS / MSI / Lenovo / Dell / HP / LG / Acer / Apple
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, false, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('gaming-laptop', 'asus', 'ASUS TUF A15 FA507', 'asus-tuf-a15-fa507', 24990000, 15, ARRAY['laptop','gaming'], 'Ryzen 7, RTX 4050, 16GB'),
  ('gaming-laptop', 'msi', 'MSI Stealth 16 Studio', 'msi-stealth-16-studio', 45990000, 8, ARRAY['laptop','gaming','thin'], 'i9, RTX 4070, 32GB'),
  ('gaming-laptop', 'acer', 'Acer Nitro V 15', 'acer-nitro-v-15', 19990000, 20, ARRAY['laptop','gaming','budget'], 'i5, RTX 4050, 16GB'),
  ('office-laptop', 'lenovo', 'Lenovo IdeaPad Slim 5', 'lenovo-ideapad-slim-5', 15990000, 28, ARRAY['laptop','office'], 'Ryzen 5, 16GB, 512GB'),
  ('office-laptop', 'dell', 'Dell Latitude 5440', 'dell-latitude-5440', 22990000, 18, ARRAY['laptop','business'], 'i5-1335U, 16GB, 512GB'),
  ('office-laptop', 'hp', 'HP ProBook 450 G10', 'hp-probook-450-g10', 18990000, 22, ARRAY['laptop','business'], 'i5, 16GB, 512GB'),
  ('ultrabook', 'lg', 'LG Gram 14 2024', 'lg-gram-14-2024', 24990000, 12, ARRAY['laptop','ultrabook'], 'Core Ultra 5, 16GB, 1TB'),
  ('ultrabook', 'asus', 'ASUS Zenbook 14 OLED', 'asus-zenbook-14-oled', 23990000, 14, ARRAY['laptop','oled'], 'Core Ultra 5, OLED 14"'),
  ('ultrabook', 'apple', 'MacBook Air M3 13"', 'macbook-air-m3-13', 27990000, 20, ARRAY['laptop','apple','m3'], 'M3, 8GB, 256GB'),
  ('laptop', 'acer', 'Acer Aspire 5', 'acer-aspire-5', 11990000, 35, ARRAY['laptop','student'], 'i5, 8GB, 512GB'),
  ('laptop', 'lenovo', 'Lenovo Yoga Slim 7', 'lenovo-yoga-slim-7', 21990000, 16, ARRAY['laptop','2in1'], 'Ryzen 7, 16GB, OLED'),
  ('laptop', 'hp', 'HP Envy x360 14', 'hp-envy-x360-14', 20990000, 18, ARRAY['laptop','convertible'], 'Ryzen 5, 16GB, touch')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_specs (product_id, cpu_brand, cpu_series, ram_capacity, ram_generation, storage_capacity, storage_type, gpu_model, screen_size, specs)
SELECT p.id, v.cpu_brand, v.cpu_series, v.ram, v.ram_gen, v.storage, v.storage_type, v.gpu, v.screen, v.specs::jsonb
FROM products p
JOIN (VALUES
  ('asus-tuf-a15-fa507', 'AMD', 'Ryzen 7 7735HS', 16, 'DDR5', 512, 'SSD', 'RTX 4050', 15.6, '{"refresh_rate":"144Hz"}'),
  ('msi-stealth-16-studio', 'Intel', 'Core i9-13900H', 32, 'DDR5', 1024, 'SSD', 'RTX 4070', 16.0, '{"refresh_rate":"240Hz"}'),
  ('acer-nitro-v-15', 'Intel', 'Core i5-13420H', 16, 'DDR5', 512, 'SSD', 'RTX 4050', 15.6, '{"refresh_rate":"144Hz"}'),
  ('lenovo-ideapad-slim-5', 'AMD', 'Ryzen 5 7530U', 16, 'DDR4', 512, 'SSD', 'Radeon Graphics', 14.0, '{}'),
  ('dell-latitude-5440', 'Intel', 'Core i5-1335U', 16, 'DDR4', 512, 'SSD', 'Intel Iris Xe', 14.0, '{"weight":"1.36kg"}'),
  ('hp-probook-450-g10', 'Intel', 'Core i5-1335U', 16, 'DDR4', 512, 'SSD', 'Intel Iris Xe', 15.6, '{}'),
  ('lg-gram-14-2024', 'Intel', 'Core Ultra 5', 16, 'DDR5', 1024, 'SSD', 'Intel Arc', 14.0, '{"weight":"0.99kg"}'),
  ('asus-zenbook-14-oled', 'Intel', 'Core Ultra 5', 16, 'DDR5', 512, 'SSD', 'Intel Arc', 14.0, '{"panel":"OLED"}'),
  ('macbook-air-m3-13', 'Apple', 'M3', 8, 'Unified', 256, 'SSD', 'Apple GPU', 13.6, '{"weight":"1.24kg"}'),
  ('acer-aspire-5', 'Intel', 'Core i5-1235U', 8, 'DDR4', 512, 'SSD', 'Intel Iris Xe', 15.6, '{}'),
  ('lenovo-yoga-slim-7', 'AMD', 'Ryzen 7 7730U', 16, 'LPDDR5', 512, 'SSD', 'Radeon Graphics', 14.0, '{"panel":"OLED"}'),
  ('hp-envy-x360-14', 'AMD', 'Ryzen 5 7530U', 16, 'DDR4', 512, 'SSD', 'Radeon Graphics', 14.0, '{"touch":true}')
) AS v(slug, cpu_brand, cpu_series, ram, ram_gen, storage, storage_type, gpu, screen, specs) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- MONITOR / KEYBOARD / MOUSE / HEADSET / WEBCAM
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, false, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('monitor', 'lg', 'LG UltraGear 32GS75Q 32" QHD 180Hz', 'lg-32gs75q', 7990000, 22, ARRAY['monitor','gaming','180hz'], '32" QHD 180Hz IPS'),
  ('monitor', 'asus', 'ASUS VG27AQ 27" QHD 165Hz', 'asus-vg27aq', 6490000, 28, ARRAY['monitor','gaming'], '27" IPS 165Hz G-Sync'),
  ('monitor', 'msi', 'MSI MAG 274QRF QD E2', 'msi-mag-274qrf', 6990000, 24, ARRAY['monitor','qd-oled'], '27" QHD Rapid IPS'),
  ('monitor', 'dell', 'Dell S2722QC 27" 4K USB-C', 'dell-s2722qc', 8990000, 20, ARRAY['monitor','4k','office'], '27" 4K USB-C'),
  ('monitor', 'samsung', 'Samsung Odyssey G5 32"', 'samsung-odyssey-g5-32', 5990000, 30, ARRAY['monitor','curved','1440p'], '32" VA 165Hz curved'),
  ('monitor', 'gigabyte', 'Gigabyte M27Q X 27"', 'gigabyte-m27q-x', 7490000, 18, ARRAY['monitor','kvm'], '27" QHD 240Hz KVM'),
  ('keyboard', 'logitech', 'Logitech MX Mechanical Mini', 'logitech-mx-mechanical-mini', 2990000, 40, ARRAY['keyboard','office','wireless'], 'Low-profile wireless'),
  ('keyboard', 'razer', 'Razer BlackWidow V4 Pro', 'razer-blackwidow-v4-pro', 5490000, 25, ARRAY['keyboard','gaming','rgb'], 'Full-size mechanical'),
  ('keyboard', 'corsair', 'Corsair K65 RGB Mini', 'corsair-k65-rgb-mini', 2790000, 35, ARRAY['keyboard','60','rgb'], '60% mechanical'),
  ('keyboard', 'asus', 'ASUS ROG Azoth', 'asus-rog-azoth', 5990000, 15, ARRAY['keyboard','gaming','wireless'], '75% gasket mount'),
  ('keyboard', 'msi', 'MSI Vigor GK50 Low Profile', 'msi-vigor-gk50', 1490000, 50, ARRAY['keyboard','budget'], 'Low-profile membrane/mech'),
  ('mouse', 'logitech', 'Logitech G Pro X Superlight 2', 'logitech-gpro-x-superlight-2', 3490000, 40, ARRAY['mouse','esports','wireless'], 'Ultra-light wireless'),
  ('mouse', 'razer', 'Razer DeathAdder V3 Pro', 'razer-deathadder-v3-pro', 3290000, 35, ARRAY['mouse','gaming','wireless'], 'Ergonomic wireless'),
  ('mouse', 'corsair', 'Corsair M65 RGB Ultra', 'corsair-m65-rgb-ultra', 1990000, 45, ARRAY['mouse','gaming'], 'Wired FPS mouse'),
  ('mouse', 'asus', 'ASUS ROG Gladius III Wireless', 'asus-rog-gladius-iii', 2490000, 30, ARRAY['mouse','gaming'], 'ROG Gladius III'),
  ('headset', 'logitech', 'Logitech G Pro X 2 Lightspeed', 'logitech-gpro-x2', 4490000, 28, ARRAY['headset','wireless','gaming'], 'Wireless gaming headset'),
  ('headset', 'razer', 'Razer BlackShark V2 Pro', 'razer-blackshark-v2-pro', 3990000, 32, ARRAY['headset','esports'], 'Esports wireless headset'),
  ('headset', 'corsair', 'Corsair HS80 RGB Wireless', 'corsair-hs80-rgb', 3490000, 30, ARRAY['headset','rgb'], 'HS80 RGB Wireless'),
  ('headset', 'hyperx', 'HyperX Cloud III', 'hyperx-cloud-iii', 1990000, 50, ARRAY['headset','wired'], 'Cloud III wired'),
  ('webcam', 'logitech', 'Logitech Brio 4K', 'logitech-brio-4k', 4990000, 25, ARRAY['webcam','4k'], 'Brio 4K Ultra HD'),
  ('webcam', 'logitech', 'Logitech C920s HD Pro', 'logitech-c920s', 1490000, 60, ARRAY['webcam','1080p'], 'C920s 1080p'),
  ('webcam', 'razer', 'Razer Kiyo Pro', 'razer-kiyo-pro', 3990000, 20, ARRAY['webcam','streaming'], 'Kiyo Pro adaptive light')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- Product images (placeholder CDN-style paths — replace with Cloudinary later)
-- =============================================================================
INSERT INTO product_images (product_id, image_url, is_main, sort_order)
SELECT p.id, 'https://placehold.co/600x600/png?text=' || replace(p.slug, '-', '+'), true, 0
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.is_main = true);

UPDATE products p
SET image_url = i.image_url
FROM product_images i
WHERE i.product_id = p.id AND i.is_main = true AND (p.image_url IS NULL OR p.image_url = '');

-- =============================================================================
-- Summary
-- =============================================================================
SELECT 'brands' AS entity, COUNT(*)::text AS count FROM brands
UNION ALL SELECT 'categories', COUNT(*)::text FROM categories
UNION ALL SELECT 'products', COUNT(*)::text FROM products
UNION ALL SELECT 'pc_components', COUNT(*)::text FROM pc_components
UNION ALL SELECT 'product_specs', COUNT(*)::text FROM product_specs;

SELECT c.slug AS category, COUNT(p.id) AS products
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.slug
ORDER BY products DESC, c.slug;

SELECT b.slug AS brand, COUNT(p.id) AS products
FROM brands b
LEFT JOIN products p ON p.brand_id = b.id
GROUP BY b.slug
ORDER BY products DESC, b.slug;
