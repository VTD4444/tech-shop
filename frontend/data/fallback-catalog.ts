/** Static catalog shown when the backend or database is unavailable. */

export const FALLBACK_CATEGORIES = [
  { id: 'fb-cat-1', name: 'Laptops', slug: 'laptops', parentId: null },
  { id: 'fb-cat-2', name: 'Components', slug: 'components', parentId: null },
  { id: 'fb-cat-3', name: 'Monitors', slug: 'monitors', parentId: null },
  { id: 'fb-cat-4', name: 'Peripherals', slug: 'peripherals', parentId: null },
  { id: 'fb-cat-5', name: 'Storage', slug: 'storage', parentId: null },
];

export const FALLBACK_BRANDS = [
  { id: 'fb-brand-1', name: 'ASUS', slug: 'asus' },
  { id: 'fb-brand-2', name: 'MSI', slug: 'msi' },
  { id: 'fb-brand-3', name: 'NVIDIA', slug: 'nvidia' },
  { id: 'fb-brand-4', name: 'AMD', slug: 'amd' },
  { id: 'fb-brand-5', name: 'Samsung', slug: 'samsung' },
];

export const FALLBACK_PRODUCTS = [
  {
    id: 'fb-prod-1',
    name: 'ASUS ROG Strix G16',
    slug: 'asus-rog-strix-g16-fallback',
    price: 32990000,
    stockQuantity: 12,
    imageUrl: null,
    description: 'Gaming laptop with RTX 4060, Intel Core i7, 16GB DDR5 RAM.',
    isPcComponent: false,
    status: 'active',
    category: { name: 'Laptops', slug: 'laptops' },
    brand: { name: 'ASUS', slug: 'asus' },
  },
  {
    id: 'fb-prod-2',
    name: 'MSI MAG B650 TOMAHAWK',
    slug: 'msi-mag-b650-tomahawk-fallback',
    price: 5490000,
    stockQuantity: 25,
    imageUrl: null,
    description: 'AM5 motherboard with PCIe 4.0, Wi-Fi 6E, and robust VRM.',
    isPcComponent: true,
    status: 'active',
    category: { name: 'Components', slug: 'components' },
    brand: { name: 'MSI', slug: 'msi' },
  },
  {
    id: 'fb-prod-3',
    name: 'NVIDIA GeForce RTX 4070 Super',
    slug: 'nvidia-rtx-4070-super-fallback',
    price: 18990000,
    stockQuantity: 8,
    imageUrl: null,
    description: 'High-performance GPU for 1440p gaming and content creation.',
    isPcComponent: true,
    status: 'active',
    category: { name: 'Components', slug: 'components' },
    brand: { name: 'NVIDIA', slug: 'nvidia' },
  },
  {
    id: 'fb-prod-4',
    name: 'AMD Ryzen 7 7800X3D',
    slug: 'amd-ryzen-7-7800x3d-fallback',
    price: 10990000,
    stockQuantity: 15,
    imageUrl: null,
    description: 'Best-in-class gaming CPU with 3D V-Cache technology.',
    isPcComponent: true,
    status: 'active',
    category: { name: 'Components', slug: 'components' },
    brand: { name: 'AMD', slug: 'amd' },
  },
  {
    id: 'fb-prod-5',
    name: 'Samsung Odyssey G7 32"',
    slug: 'samsung-odyssey-g7-fallback',
    price: 8990000,
    stockQuantity: 10,
    imageUrl: null,
    description: 'Curved QHD monitor, 240Hz refresh rate, 1ms response time.',
    isPcComponent: false,
    status: 'active',
    category: { name: 'Monitors', slug: 'monitors' },
    brand: { name: 'Samsung', slug: 'samsung' },
  },
  {
    id: 'fb-prod-6',
    name: 'Samsung 990 PRO 1TB NVMe',
    slug: 'samsung-990-pro-1tb-fallback',
    price: 3290000,
    stockQuantity: 30,
    imageUrl: null,
    description: 'PCIe 4.0 NVMe SSD with read speeds up to 7,450 MB/s.',
    isPcComponent: true,
    status: 'active',
    category: { name: 'Storage', slug: 'storage' },
    brand: { name: 'Samsung', slug: 'samsung' },
  },
  {
    id: 'fb-prod-7',
    name: 'ASUS ROG Swift PG27AQDM',
    slug: 'asus-rog-swift-pg27aqdm-fallback',
    price: 15990000,
    stockQuantity: 5,
    imageUrl: null,
    description: 'OLED gaming monitor, 240Hz, 0.03ms response, G-Sync compatible.',
    isPcComponent: false,
    status: 'active',
    category: { name: 'Monitors', slug: 'monitors' },
    brand: { name: 'ASUS', slug: 'asus' },
  },
  {
    id: 'fb-prod-8',
    name: 'MSI GeForce RTX 4060 Ti',
    slug: 'msi-rtx-4060-ti-fallback',
    price: 11990000,
    stockQuantity: 18,
    imageUrl: null,
    description: 'Efficient 1080p/1440p gaming graphics card with DLSS 3.',
    isPcComponent: true,
    status: 'active',
    category: { name: 'Components', slug: 'components' },
    brand: { name: 'MSI', slug: 'msi' },
  },
];

export function filterFallbackProducts(params: Record<string, unknown> = {}) {
  const page = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(params.limit ?? 20), 10) || 20));
  let list = [...FALLBACK_PRODUCTS];

  const search = String(params.search || '').trim().toLowerCase();
  if (search) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.description?.toLowerCase().includes(search) ?? false),
    );
  }

  const category = String(params.category || '').trim();
  if (category) {
    list = list.filter((p) => p.category?.slug === category);
  }

  const brand = String(params.brand || '').trim();
  if (brand) {
    list = list.filter((p) => p.brand?.slug === brand);
  }

  const minPrice = params.minPrice != null ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice != null ? Number(params.maxPrice) : undefined;
  if (minPrice != null && !Number.isNaN(minPrice)) {
    list = list.filter((p) => p.price >= minPrice);
  }
  if (maxPrice != null && !Number.isNaN(maxPrice)) {
    list = list.filter((p) => p.price <= maxPrice);
  }

  if (params.isPcComponent === true) {
    list = list.filter((p) => p.isPcComponent);
  }

  const sort = String(params.sort || 'created_at');
  if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'name_asc') list.sort((a, b) => a.name.localeCompare(b.name));

  const total = list.length;
  const skip = (page - 1) * limit;
  const data = list.slice(skip, skip + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      fallback: true,
    },
  };
}

export function findFallbackProductBySlug(slug: string) {
  return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
}
