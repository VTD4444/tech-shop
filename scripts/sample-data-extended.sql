-- =============================================================================
-- TechShop — Extended sample data (append-only, safe to re-run)
--
-- DataGrip / DBeaver: Run ENTIRE file (Ctrl+Shift+Enter or Execute).
-- Do NOT run old snippets without updated_at — see categories block below.
--
-- psql:
--   psql "postgresql://techshop:techshop_pass@localhost:5433/techshop" -f init-scripts/004-sample-data-extended.sql
-- =============================================================================

-- Clear aborted transaction if a previous run failed mid-script
ROLLBACK;

-- Prisma @updatedAt: always set created_at AND updated_at (no DB default).

-- -----------------------------------------------------------------------------
-- Categories (sub-categories for laptops)
-- -----------------------------------------------------------------------------
INSERT INTO categories (name, slug, parent_id, created_at, updated_at)
SELECT 'Gaming Laptop', 'gaming-laptop', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories WHERE slug = 'laptop'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (name, slug, parent_id, created_at, updated_at)
SELECT 'Office Laptop', 'office-laptop', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories WHERE slug = 'laptop'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (name, slug, created_at, updated_at) VALUES
  ('Monitor', 'monitor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Keyboard', 'keyboard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Mouse', 'mouse', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- Brands
-- -----------------------------------------------------------------------------
INSERT INTO brands (name, slug) VALUES
  ('ASUS', 'asus'),
  ('MSI', 'msi'),
  ('Gigabyte', 'gigabyte'),
  ('Kingston', 'kingston'),
  ('Western Digital', 'western-digital'),
  ('Seagate', 'seagate'),
  ('Cooler Master', 'cooler-master'),
  ('be quiet!', 'be-quiet'),
  ('NZXT', 'nzxt'),
  ('Noctua', 'noctua'),
  ('Logitech', 'logitech'),
  ('ASRock', 'asrock'),
  ('TeamGroup', 'teamgroup'),
  ('Crucial', 'crucial'),
  ('LG', 'lg'),
  ('Dell', 'dell'),
  ('Lenovo', 'lenovo'),
  ('HP', 'hp')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Extra users (password: shopper123 / gamer123 / office123)
-- -----------------------------------------------------------------------------
INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES
  ('shopper2', 'shopper2@test.com', '$2a$10$obGp4h/28U68./nPTclZkeaBEDRL6l5pFIm1nqKsRF32OB243//5y', 'customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gamer_pro', 'gamer@test.com', '$2a$10$xF7jfEN8/K/gOBdIAAKa1uDIaHNsGILZiz9cPQVfgwcRRv7OqjWd2', 'customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('office_user', 'office@test.com', '$2a$10$7c2Uy8U5LTq0kKB877PVCOwNQoa0ppTmsvw9XvT8T0Nmrs49qOtRm', 'customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- User addresses
-- -----------------------------------------------------------------------------
INSERT INTO user_addresses (user_id, receiver_name, phone, address_line, ward, district, city, is_default)
SELECT u.id, 'Nguyen Van A', '0901234567', '123 Nguyen Hue', 'Ben Nghe', 'Quan 1', 'Ho Chi Minh', true
FROM users u WHERE u.email = 'customer@test.com'
  AND NOT EXISTS (SELECT 1 FROM user_addresses a WHERE a.user_id = u.id AND a.is_default = true);

INSERT INTO user_addresses (user_id, receiver_name, phone, address_line, ward, district, city, is_default)
SELECT u.id, 'Tran Thi B', '0912345678', '45 Le Loi', 'Hang Bac', 'Hoan Kiem', 'Ha Noi', true
FROM users u WHERE u.email = 'gamer@test.com'
  AND NOT EXISTS (SELECT 1 FROM user_addresses a WHERE a.user_id = u.id);

-- =============================================================================
-- PRODUCTS — CPU (AMD + Intel)
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, status, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c
CROSS JOIN brands b
JOIN (VALUES
  ('cpu', 'amd', 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d', 10990000, 35, ARRAY['cpu','amd','gaming','am5'], 'Ryzen 7 7800X3D 8C/16T, AM5, 3D V-Cache'),
  ('cpu', 'amd', 'AMD Ryzen 5 7600', 'amd-ryzen-5-7600', 4990000, 60, ARRAY['cpu','amd','budget','am5'], 'Ryzen 5 7600 6C/12T, AM5'),
  ('cpu', 'intel', 'Intel Core i7-14700K', 'intel-core-i7-14700k', 9990000, 40, ARRAY['cpu','intel','high-end','lga1700'], 'Core i7-14700K 20 cores, LGA1700'),
  ('cpu', 'intel', 'Intel Core i3-14100', 'intel-core-i3-14100', 2990000, 80, ARRAY['cpu','intel','office','lga1700'], 'Core i3-14100 4C/8T, office builds')
) AS v(cat, brand, name, slug, price, stock, tags, descr)
  ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, socket, ram_generation, power_consumption, updated_at)
SELECT p.id, 'CPU', v.socket, v.ram_gen, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('amd-ryzen-7-7800x3d', 'AM5', 'DDR5', 120),
  ('amd-ryzen-5-7600', 'AM5', 'DDR5', 65),
  ('intel-core-i7-14700k', 'LGA1700', 'DDR5', 125),
  ('intel-core-i3-14100', 'LGA1700', 'DDR5', 60)
) AS v(slug, socket, ram_gen, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- MAINBOARD
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('mainboard', 'msi', 'MSI B650 Tomahawk WiFi', 'msi-b650-tomahawk-wifi', 5200000, 25, ARRAY['mainboard','amd','b650','am5'], 'ATX B650, AM5, DDR5, WiFi 6E'),
  ('mainboard', 'asus', 'ASUS TUF B760M-PLUS WiFi', 'asus-tuf-b760m-plus-wifi', 4100000, 30, ARRAY['mainboard','intel','b760','matx'], 'Micro-ATX B760, LGA1700'),
  ('mainboard', 'gigabyte', 'Gigabyte X670E AORUS Master', 'gigabyte-x670e-aorus-master', 12500000, 10, ARRAY['mainboard','amd','x670e','premium'], 'E-ATX X670E flagship'),
  ('mainboard', 'asrock', 'ASRock B550M Pro4', 'asrock-b550m-pro4', 2800000, 45, ARRAY['mainboard','amd','b550','budget'], 'Micro-ATX B550 AM4 DDR4')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, socket, chipset, ram_generation, ram_slots, max_ram_capacity, form_factor, power_consumption, max_gpu_length_mm, max_cpu_cooler_height_mm, updated_at)
SELECT p.id, 'MAINBOARD', v.socket, v.chipset, v.ram_gen, v.slots, v.max_ram, v.ff, v.watt, v.gpu_len, v.cooler_h, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('msi-b650-tomahawk-wifi', 'AM5', 'B650', 'DDR5', 4, 128, 'ATX', 35, 360, 170),
  ('asus-tuf-b760m-plus-wifi', 'LGA1700', 'B760', 'DDR5', 2, 96, 'Micro-ATX', 30, 330, 165),
  ('gigabyte-x670e-aorus-master', 'AM5', 'X670E', 'DDR5', 4, 192, 'E-ATX', 45, 400, 185),
  ('asrock-b550m-pro4', 'AM4', 'B550', 'DDR4', 4, 128, 'Micro-ATX', 25, 300, 155)
) AS v(slug, socket, chipset, ram_gen, slots, max_ram, ff, watt, gpu_len, cooler_h) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- RAM
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('ram', 'kingston', 'Kingston Fury Beast 16GB DDR5 6000', 'kingston-fury-beast-16gb-ddr5', 1590000, 120, ARRAY['ram','ddr5','16gb'], '2x8GB DDR5 6000MHz CL36'),
  ('ram', 'teamgroup', 'TeamGroup T-Force Delta 64GB DDR5', 'teamgroup-tforce-delta-64gb-ddr5', 5200000, 40, ARRAY['ram','ddr5','64gb','rgb'], '2x32GB DDR5 6000MHz RGB'),
  ('ram', 'corsair', 'Corsair Vengeance LPX 32GB DDR4', 'corsair-vengeance-32gb-ddr4', 1890000, 90, ARRAY['ram','ddr4','32gb'], '2x16GB DDR4 3200MHz'),
  ('ram', 'crucial', 'Crucial Pro 48GB DDR5', 'crucial-pro-48gb-ddr5', 3890000, 55, ARRAY['ram','ddr5','48gb'], '2x24GB DDR5 5600MHz')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, ram_generation, ram_capacity, ram_bus, power_consumption, updated_at)
SELECT p.id, 'RAM', v.ram_gen, v.cap, v.bus, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('kingston-fury-beast-16gb-ddr5', 'DDR5', 16, 6000, 8),
  ('teamgroup-tforce-delta-64gb-ddr5', 'DDR5', 64, 6000, 12),
  ('corsair-vengeance-32gb-ddr4', 'DDR4', 32, 3200, 8),
  ('crucial-pro-48gb-ddr5', 'DDR5', 48, 5600, 10)
) AS v(slug, ram_gen, cap, bus, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- VGA
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('vga', 'nvidia', 'NVIDIA RTX 4060 Ti 8GB', 'nvidia-rtx-4060-ti-8gb', 10990000, 30, ARRAY['vga','rtx','mid-range'], 'RTX 4060 Ti 8GB, DLSS 3'),
  ('vga', 'nvidia', 'NVIDIA RTX 4080 Super 16GB', 'nvidia-rtx-4080-super-16gb', 28990000, 12, ARRAY['vga','rtx','4k'], 'RTX 4080 Super flagship'),
  ('vga', 'amd', 'AMD Radeon RX 7800 XT', 'amd-radeon-rx-7800-xt', 12990000, 22, ARRAY['vga','amd','1440p'], 'RX 7800 XT 16GB GDDR6'),
  ('vga', 'msi', 'MSI RTX 4070 Ti Super Ventus', 'msi-rtx-4070-ti-super-ventus', 21990000, 18, ARRAY['vga','msi','gaming'], 'RTX 4070 Ti Super custom cooler')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, gpu_length_mm, power_consumption, pcie_version, updated_at)
SELECT p.id, 'VGA', v.len, v.watt, v.pcie, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('nvidia-rtx-4060-ti-8gb', 240, 160, '4.0'),
  ('nvidia-rtx-4080-super-16gb', 320, 320, '4.0'),
  ('amd-radeon-rx-7800-xt', 290, 263, '4.0'),
  ('msi-rtx-4070-ti-super-ventus', 305, 285, '4.0')
) AS v(slug, len, watt, pcie) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- STORAGE
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('storage', 'samsung', 'Samsung 990 Pro 2TB', 'samsung-990-pro-2tb', 5490000, 50, ARRAY['ssd','nvme','2tb'], '990 Pro 2TB PCIe 4.0'),
  ('storage', 'western-digital', 'WD Black SN850X 1TB', 'wd-black-sn850x-1tb', 2890000, 70, ARRAY['ssd','nvme','gaming'], 'SN850X 1TB heatsink'),
  ('storage', 'crucial', 'Crucial P3 Plus 500GB', 'crucial-p3-plus-500gb', 1290000, 100, ARRAY['ssd','budget'], 'P3 Plus 500GB NVMe'),
  ('storage', 'seagate', 'Seagate Barracuda 2TB HDD', 'seagate-barracuda-2tb-hdd', 1590000, 80, ARRAY['hdd','storage'], '3.5" SATA 7200RPM 2TB')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, storage_interface, power_consumption, updated_at)
SELECT p.id, 'STORAGE', v.iface, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('samsung-990-pro-2tb', 'M.2 NVMe', 7),
  ('wd-black-sn850x-1tb', 'M.2 NVMe', 7),
  ('crucial-p3-plus-500gb', 'M.2 NVMe', 5),
  ('seagate-barracuda-2tb-hdd', 'SATA 3.5"', 8)
) AS v(slug, iface, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- PSU
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('psu', 'corsair', 'Corsair RM850x', 'corsair-rm850x', 2890000, 35, ARRAY['psu','850w','gold'], 'RM850x 850W 80+ Gold modular'),
  ('psu', 'be-quiet', 'be quiet! Straight Power 11 650W', 'be-quiet-straight-power-11-650w', 2490000, 40, ARRAY['psu','650w','silent'], '650W 80+ Gold'),
  ('psu', 'cooler-master', 'Cooler Master MWE 550W', 'cooler-master-mwe-550w', 1290000, 60, ARRAY['psu','budget','550w'], 'MWE 550W 80+ Bronze'),
  ('psu', 'msi', 'MSI MPG A1000G PCIE5', 'msi-mpg-a1000g-pcie5', 4590000, 20, ARRAY['psu','1000w','atx3'], '1000W ATX 3.0 PCIe 5.0')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, power_supply_watt, form_factor, updated_at)
SELECT p.id, 'PSU', v.watt, 'ATX', CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('corsair-rm850x', 850),
  ('be-quiet-straight-power-11-650w', 650),
  ('cooler-master-mwe-550w', 550),
  ('msi-mpg-a1000g-pcie5', 1000)
) AS v(slug, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- CASE
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('case', 'nzxt', 'NZXT H5 Flow', 'nzxt-h5-flow', 2490000, 30, ARRAY['case','mid-tower','airflow'], 'H5 Flow tempered glass'),
  ('case', 'cooler-master', 'Cooler Master MasterBox Q300L', 'cooler-master-q300l', 990000, 50, ARRAY['case','matx','budget'], 'Micro-ATX budget case'),
  ('case', 'be-quiet', 'be quiet! Pure Base 500DX', 'be-quiet-pure-base-500dx', 2790000, 25, ARRAY['case','silent'], 'ATX silent case with mesh'),
  ('case', 'corsair', 'Corsair 5000D Airflow', 'corsair-5000d-airflow', 3990000, 20, ARRAY['case','full-tower'], '5000D full tower airflow')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, form_factor, max_gpu_length_mm, max_cpu_cooler_height_mm, updated_at)
SELECT p.id, 'CASE', v.ff, v.gpu, v.cooler, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('nzxt-h5-flow', 'ATX / Micro-ATX / Mini-ITX', 365, 165),
  ('cooler-master-q300l', 'Micro-ATX / Mini-ITX', 360, 159),
  ('be-quiet-pure-base-500dx', 'ATX / Micro-ATX', 369, 190),
  ('corsair-5000d-airflow', 'ATX / E-ATX', 420, 170)
) AS v(slug, ff, gpu, cooler) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- COOLER
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, true, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('cooler', 'noctua', 'Noctua NH-D15 chromax.black', 'noctua-nh-d15-chromax', 3290000, 25, ARRAY['cooler','air','premium'], 'Dual tower air cooler'),
  ('cooler', 'cooler-master', 'Cooler Master Hyper 212 Black', 'cooler-master-hyper-212', 890000, 80, ARRAY['cooler','budget'], 'Hyper 212 single tower'),
  ('cooler', 'corsair', 'Corsair H150i ELITE LCD', 'corsair-h150i-elite-lcd', 5490000, 15, ARRAY['cooler','aio','360mm'], '360mm AIO liquid cooler'),
  ('cooler', 'be-quiet', 'be quiet! Dark Rock Pro 5', 'be-quiet-dark-rock-pro-5', 2890000, 30, ARRAY['cooler','silent'], 'High-end air cooler')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pc_components (product_id, component_type, socket, cpu_cooler_height_mm, power_consumption, updated_at)
SELECT p.id, 'COOLER', v.socket, v.height, v.watt, CURRENT_TIMESTAMP
FROM products p
JOIN (VALUES
  ('noctua-nh-d15-chromax', 'LGA1700/AM5/AM4', 165, 2),
  ('cooler-master-hyper-212', 'LGA1700/AM5/AM4', 159, 2),
  ('corsair-h150i-elite-lcd', 'LGA1700/AM5/AM4', 55, 15),
  ('be-quiet-dark-rock-pro-5', 'LGA1700/AM5/AM4', 168, 2)
) AS v(slug, socket, height, watt) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- LAPTOPS
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, false, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('gaming-laptop', 'asus', 'ASUS ROG Strix G16 RTX 4060', 'asus-rog-strix-g16-rtx4060', 32990000, 12, ARRAY['laptop','gaming','rtx'], 'i7-13650HX, 16GB, 512GB, RTX 4060'),
  ('gaming-laptop', 'msi', 'MSI Katana 15', 'msi-katana-15', 21990000, 18, ARRAY['laptop','gaming','budget'], 'i5-12450H, 16GB, RTX 4050'),
  ('office-laptop', 'lenovo', 'Lenovo ThinkPad E14 Gen 5', 'lenovo-thinkpad-e14-gen5', 16990000, 25, ARRAY['laptop','office','thinkpad'], 'Ryzen 5 7530U, 16GB, 512GB'),
  ('office-laptop', 'dell', 'Dell Inspiron 15 3530', 'dell-inspiron-15-3530', 14990000, 30, ARRAY['laptop','office'], 'i5-1335U, 16GB, 512GB'),
  ('laptop', 'hp', 'HP Pavilion 14', 'hp-pavilion-14', 12990000, 22, ARRAY['laptop','student'], 'Ryzen 5 7520U, 8GB, 512GB'),
  ('laptop', 'lg', 'LG Gram 16 2024', 'lg-gram-16-2024', 27990000, 10, ARRAY['laptop','ultrabook','light'], 'Core Ultra 5, 16GB, 1TB, 16" OLED')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_specs (product_id, cpu_brand, cpu_series, ram_capacity, ram_generation, storage_capacity, storage_type, gpu_model, screen_size, specs)
SELECT p.id, v.cpu_brand, v.cpu_series, v.ram, v.ram_gen, v.storage, v.storage_type, v.gpu, v.screen, v.specs::jsonb
FROM products p
JOIN (VALUES
  ('asus-rog-strix-g16-rtx4060', 'Intel', 'Core i7-13650HX', 16, 'DDR5', 512, 'SSD', 'RTX 4060', 16.0, '{"refresh_rate":"165Hz","weight":"2.3kg"}'),
  ('msi-katana-15', 'Intel', 'Core i5-12450H', 16, 'DDR4', 512, 'SSD', 'RTX 4050', 15.6, '{"refresh_rate":"144Hz"}'),
  ('lenovo-thinkpad-e14-gen5', 'AMD', 'Ryzen 5 7530U', 16, 'DDR4', 512, 'SSD', 'Radeon Graphics', 14.0, '{"weight":"1.59kg"}'),
  ('dell-inspiron-15-3530', 'Intel', 'Core i5-1335U', 16, 'DDR4', 512, 'SSD', 'Intel Iris Xe', 15.6, '{}'),
  ('hp-pavilion-14', 'AMD', 'Ryzen 5 7520U', 8, 'DDR4', 512, 'SSD', 'Radeon Graphics', 14.0, '{}'),
  ('lg-gram-16-2024', 'Intel', 'Core Ultra 5', 16, 'DDR5', 1024, 'SSD', 'Intel Arc', 16.0, '{"weight":"1.19kg","panel":"OLED"}')
) AS v(slug, cpu_brand, cpu_series, ram, ram_gen, storage, storage_type, gpu, screen, specs) ON p.slug = v.slug
ON CONFLICT (product_id) DO NOTHING;

-- =============================================================================
-- PERIPHERALS (non PC component)
-- =============================================================================
INSERT INTO products (category_id, brand_id, name, slug, price, stock_quantity, is_pc_component, ai_tags, description, created_at, updated_at)
SELECT c.id, b.id, v.name, v.slug, v.price, v.stock, false, v.tags, v.descr, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM categories c CROSS JOIN brands b
JOIN (VALUES
  ('monitor', 'lg', 'LG 27GP850-B 27" QHD 165Hz', 'lg-27gp850-b', 8990000, 20, ARRAY['monitor','gaming','165hz'], '27" Nano IPS 165Hz'),
  ('monitor', 'dell', 'Dell U2723QE 27" 4K', 'dell-u2723qe', 15990000, 15, ARRAY['monitor','4k','office'], '27" 4K USB-C hub'),
  ('keyboard', 'logitech', 'Logitech G Pro X TKL', 'logitech-g-pro-x-tkl', 3490000, 40, ARRAY['keyboard','gaming','tkl'], 'Tenkeyless mechanical'),
  ('keyboard', 'corsair', 'Corsair K70 RGB PRO', 'corsair-k70-rgb-pro', 4290000, 35, ARRAY['keyboard','rgb'], 'Full-size mechanical'),
  ('mouse', 'logitech', 'Logitech G502 X Plus', 'logitech-g502-x-plus', 2790000, 50, ARRAY['mouse','gaming','wireless'], 'Wireless gaming mouse'),
  ('mouse', 'logitech', 'Logitech MX Master 3S', 'logitech-mx-master-3s', 2490000, 45, ARRAY['mouse','office'], 'Productivity wireless mouse')
) AS v(cat, brand, name, slug, price, stock, tags, descr) ON c.slug = v.cat AND b.slug = v.brand
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- PRODUCT RATINGS & COMMENTS
-- =============================================================================
INSERT INTO product_ratings (user_id, product_id, order_id, rating, images, created_at, updated_at)
SELECT u.id, p.id, o.id, v.rating, ARRAY[]::text[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
JOIN orders o ON o.user_id = u.id AND o.status = 'completed' AND o.payment_status = 'paid'
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN (VALUES
  ('customer@test.com', '2025-11-10 14:30:00', 'intel-core-i5-14600k', 5)
) AS v(email, created, slug, rating)
  ON u.email = v.email AND o.created_at = v.created::timestamp AND p.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_ratings r WHERE r.order_id = o.id AND r.product_id = p.id
);

INSERT INTO product_comments (user_id, product_id, parent_id, content, images, status, created_at, updated_at)
SELECT u.id, p.id, NULL, v.comment, ARRAY[]::text[], 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
CROSS JOIN products p
JOIN (VALUES
  ('customer@test.com', 'intel-core-i5-14600k', 'CPU rat tot cho gaming 1080p/1440p'),
  ('customer@test.com', 'nvidia-rtx-4070-super', 'Chay moi game max setting rat muot'),
  ('gamer@test.com', 'amd-ryzen-7-7800x3d', 'FPS cao nhat trong phan khuc'),
  ('gamer@test.com', 'corsair-4000d-airflow', 'Case dep, airflow tot, hoi kho cable management'),
  ('shopper2@test.com', 'samsung-990-pro-1tb', 'SSD nhanh, boot Windows duoi 10 giay'),
  ('office@test.com', 'lenovo-thinkpad-e14-gen5', 'Laptop van phong on dinh, pin lau'),
  ('gamer@test.com', 'logitech-g502-x-plus', 'Chuot gaming tot nhat trong tam gia')
) AS v(email, slug, comment) ON u.email = v.email AND p.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_comments c WHERE c.user_id = u.id AND c.product_id = p.id AND c.content = v.comment AND c.parent_id IS NULL
);

-- =============================================================================
-- CART ITEMS
-- =============================================================================
INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
SELECT u.id, p.id, v.qty, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u CROSS JOIN products p
JOIN (VALUES
  ('customer@test.com', 'amd-ryzen-5-7600', 1),
  ('customer@test.com', 'kingston-fury-beast-16gb-ddr5', 2),
  ('gamer@test.com', 'nvidia-rtx-4080-super-16gb', 1),
  ('gamer@test.com', 'corsair-rm850x', 1),
  ('shopper2@test.com', 'logitech-mx-master-3s', 1)
) AS v(email, slug, qty) ON u.email = v.email AND p.slug = v.slug
ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP;

-- =============================================================================
-- WISHLISTS
-- =============================================================================
INSERT INTO wishlists (user_id, product_id)
SELECT u.id, p.id
FROM users u CROSS JOIN products p
JOIN (VALUES
  ('customer@test.com', 'asus-rog-strix-g16-rtx4060'),
  ('customer@test.com', 'lg-27gp850-b'),
  ('gamer@test.com', 'noctua-nh-d15-chromax'),
  ('gamer@test.com', 'msi-mpg-a1000g-pcie5'),
  ('office@test.com', 'dell-u2723qe'),
  ('shopper2@test.com', 'samsung-galaxy-book-4-pro')
) AS v(email, slug) ON u.email = v.email AND p.slug = v.slug
ON CONFLICT (user_id, product_id) DO NOTHING;

-- =============================================================================
-- SAMPLE ORDERS
-- =============================================================================
INSERT INTO orders (user_id, total_amount, shipping_fee, shipping_address, customer_name, customer_phone, note, status, payment_status, created_at, updated_at)
SELECT u.id, v.total, v.fee, v.addr, v.name, v.phone, v.note, v.status, v.pay, v.created::timestamp, v.created::timestamp
FROM users u
JOIN (VALUES
  ('customer@test.com', 9700000, 30000, '123 Nguyen Hue, Q1, HCM', 'Nguyen Van A', '0901234567', 'Giao gio hanh chinh', 'completed', 'paid', '2025-11-10 14:30:00'),
  ('gamer@test.com', 35900000, 50000, '45 Le Loi, Hoan Kiem, Ha Noi', 'Tran Thi B', '0912345678', NULL, 'shipping', 'paid', '2026-01-05 09:15:00'),
  ('customer@test.com', 6900000, 30000, '123 Nguyen Hue, Q1, HCM', 'Nguyen Van A', '0901234567', NULL, 'pending', 'unpaid', '2026-03-20 16:00:00'),
  ('office@test.com', 16990000, 0, '88 Tran Hung Dao, Da Nang', 'Le Van C', '0923456789', 'Mien phi ship', 'confirmed', 'paid', '2026-02-14 11:00:00'),
  ('shopper2@test.com', 3490000, 30000, '12 Vo Van Tan, Q3, HCM', 'Pham Thi D', '0934567890', NULL, 'cancelled', 'failed', '2026-03-01 08:45:00')
) AS v(email, total, fee, addr, name, phone, note, status, pay, created) ON u.email = v.email
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.created_at = v.created::timestamp
);

-- Order items for completed order (customer i5 + ram)
INSERT INTO order_items (order_id, product_id, product_name, product_slug, quantity, price)
SELECT o.id, p.id, p.name, p.slug, v.qty, p.price
FROM orders o
JOIN users u ON o.user_id = u.id
CROSS JOIN products p
JOIN (VALUES
  ('customer@test.com', '2025-11-10 14:30:00', 'intel-core-i5-14600k', 1),
  ('customer@test.com', '2025-11-10 14:30:00', 'kingston-fury-beast-16gb-ddr5', 1)
) AS v(email, created, slug, qty)
  ON u.email = v.email AND o.created_at = v.created::timestamp AND p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);

-- Gamer build order items
INSERT INTO order_items (order_id, product_id, product_name, product_slug, quantity, price)
SELECT o.id, p.id, p.name, p.slug, 1, p.price
FROM orders o
JOIN users u ON o.user_id = u.id
CROSS JOIN products p
JOIN (VALUES
  ('gamer@test.com', '2026-01-05 09:15:00', 'amd-ryzen-7-7800x3d'),
  ('gamer@test.com', '2026-01-05 09:15:00', 'msi-b650-tomahawk-wifi'),
  ('gamer@test.com', '2026-01-05 09:15:00', 'teamgroup-tforce-delta-64gb-ddr5'),
  ('gamer@test.com', '2026-01-05 09:15:00', 'nvidia-rtx-4080-super-16gb')
) AS v(email, created, slug) ON u.email = v.email AND o.created_at = v.created::timestamp AND p.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_slug = v.slug);

-- Pending unpaid order (single CPU)
INSERT INTO order_items (order_id, product_id, product_name, product_slug, quantity, price)
SELECT o.id, p.id, p.name, p.slug, 1, p.price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON p.slug = 'intel-core-i5-14600k'
WHERE u.email = 'customer@test.com' AND o.created_at = '2026-03-20 16:00:00'::timestamp
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);

-- Office laptop order
INSERT INTO order_items (order_id, product_id, product_name, product_slug, quantity, price)
SELECT o.id, p.id, p.name, p.slug, 1, p.price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON p.slug = 'lenovo-thinkpad-e14-gen5'
WHERE u.email = 'office@test.com' AND o.created_at = '2026-02-14 11:00:00'::timestamp
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);

-- Sample VNPay transaction for paid completed order
INSERT INTO vnpay_transactions (order_id, vnpay_txn_ref, vnpay_transaction_no, amount, bank_code, response_code, status, payment_date, created_at, updated_at)
SELECT o.id, '1731234600_' || o.id::text, '14237891', o.total_amount, 'NCB', '00', 'success', o.created_at + interval '5 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.email = 'customer@test.com' AND o.created_at = '2025-11-10 14:30:00'::timestamp
ON CONFLICT (order_id) DO NOTHING;

-- =============================================================================
-- SAVED PC BUILDS
-- =============================================================================
INSERT INTO saved_builds (user_id, name, total_price, created_at, updated_at)
SELECT u.id, v.name, v.total, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
JOIN (VALUES
  ('gamer@test.com', 'Dream 4K Gaming Build', 55000000),
  ('customer@test.com', 'Budget Office PC', 12000000)
) AS v(email, name, total) ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM saved_builds sb WHERE sb.user_id = u.id AND sb.name = v.name);

INSERT INTO saved_build_items (build_id, product_id, component_type)
SELECT sb.id, p.id, v.comp_type
FROM saved_builds sb
JOIN users u ON sb.user_id = u.id
CROSS JOIN products p
JOIN (VALUES
  ('gamer@test.com', 'Dream 4K Gaming Build', 'amd-ryzen-7-7800x3d', 'CPU'),
  ('gamer@test.com', 'Dream 4K Gaming Build', 'gigabyte-x670e-aorus-master', 'MAINBOARD'),
  ('gamer@test.com', 'Dream 4K Gaming Build', 'teamgroup-tforce-delta-64gb-ddr5', 'RAM'),
  ('gamer@test.com', 'Dream 4K Gaming Build', 'nvidia-rtx-4080-super-16gb', 'VGA'),
  ('gamer@test.com', 'Dream 4K Gaming Build', 'samsung-990-pro-2tb', 'STORAGE'),
  ('gamer@test.com', 'Dream 4K Gaming Build', 'msi-mpg-a1000g-pcie5', 'PSU'),
  ('gamer@test.com', 'Dream 4K Gaming Build', 'corsair-5000d-airflow', 'CASE'),
  ('gamer@test.com', 'Dream 4K Gaming Build', 'corsair-h150i-elite-lcd', 'COOLER'),
  ('customer@test.com', 'Budget Office PC', 'intel-core-i3-14100', 'CPU'),
  ('customer@test.com', 'Budget Office PC', 'asus-tuf-b760m-plus-wifi', 'MAINBOARD'),
  ('customer@test.com', 'Budget Office PC', 'kingston-fury-beast-16gb-ddr5', 'RAM'),
  ('customer@test.com', 'Budget Office PC', 'crucial-p3-plus-500gb', 'STORAGE'),
  ('customer@test.com', 'Budget Office PC', 'cooler-master-mwe-550w', 'PSU'),
  ('customer@test.com', 'Budget Office PC', 'cooler-master-q300l', 'CASE')
) AS v(email, build_name, slug, comp_type)
  ON u.email = v.email AND sb.name = v.build_name AND p.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM saved_build_items sbi WHERE sbi.build_id = sb.id AND sbi.product_id = p.id
);

-- Summary (run after script completes)
SELECT 'brands' AS entity, COUNT(*)::text AS count FROM brands
UNION ALL SELECT 'categories', COUNT(*)::text FROM categories
UNION ALL SELECT 'products', COUNT(*)::text FROM products
UNION ALL SELECT 'pc_components', COUNT(*)::text FROM pc_components
UNION ALL SELECT 'users', COUNT(*)::text FROM users
UNION ALL SELECT 'orders', COUNT(*)::text FROM orders
UNION ALL SELECT 'ratings', COUNT(*)::text FROM product_ratings
UNION ALL SELECT 'comments', COUNT(*)::text FROM product_comments;
