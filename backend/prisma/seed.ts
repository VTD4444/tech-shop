import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function clearSeedData() {
  await prisma.savedBuildItem.deleteMany();
  await prisma.savedBuild.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productComment.deleteMany();
  await prisma.productRating.deleteMany();
  await prisma.pcComponent.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
}

async function main() {
  const force = process.env.SEED_FORCE === '1';
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@techshop.com' },
  });

  if (existing && !force) {
    console.log('Seed data already exists. Skipping.');
    console.log('Re-run with: SEED_FORCE=1 npm run prisma:seed');
    return;
  }

  if (existing && force) {
    console.log('SEED_FORCE=1 — clearing existing seed data...');
    await clearSeedData();
  }

  // Categories
  const cpuCat = await prisma.category.create({ data: { name: 'CPU', slug: 'cpu' } });
  const mbCat = await prisma.category.create({ data: { name: 'Mainboard', slug: 'mainboard' } });
  const vgaCat = await prisma.category.create({ data: { name: 'VGA', slug: 'vga' } });
  const ramCat = await prisma.category.create({ data: { name: 'RAM', slug: 'ram' } });
  const storageCat = await prisma.category.create({ data: { name: 'Storage', slug: 'storage' } });
  const psuCat = await prisma.category.create({ data: { name: 'PSU', slug: 'psu' } });
  const caseCat = await prisma.category.create({ data: { name: 'Case', slug: 'case' } });
  const coolerCat = await prisma.category.create({ data: { name: 'Cooler', slug: 'cooler' } });
  const laptopCat = await prisma.category.create({ data: { name: 'Laptop', slug: 'laptop' } });

  // Brands
  const intel = await prisma.brand.create({ data: { name: 'Intel', slug: 'intel' } });
  const amd = await prisma.brand.create({ data: { name: 'AMD', slug: 'amd' } });
  const nvidia = await prisma.brand.create({ data: { name: 'NVIDIA', slug: 'nvidia' } });
  const corsair = await prisma.brand.create({ data: { name: 'Corsair', slug: 'corsair' } });
  const samsung = await prisma.brand.create({ data: { name: 'Samsung', slug: 'samsung' } });

  // Admin user
  const adminHash = '$2a$10$dummy_admin_hash';
  await prisma.user.create({
    data: {
      username: 'admin',
      fullName: 'Quản trị viên',
      email: 'admin@techshop.com',
      phone: '0900000001',
      passwordHash: await import('bcryptjs').then((b) => b.hash('admin123', 10)),
      role: 'admin',
      authProvider: 'local',
    },
  });

  await prisma.user.create({
    data: {
      username: 'customer1',
      fullName: 'Nguyễn Văn A',
      email: 'customer@test.com',
      phone: '0900000002',
      passwordHash: await import('bcryptjs').then((b) => b.hash('customer123', 10)),
      role: 'customer',
      authProvider: 'local',
    },
  });

  // Sample products
  const i5Product = await prisma.product.create({
    data: {
      categoryId: cpuCat.id,
      brandId: intel.id,
      name: 'Intel Core i5-14600K',
      slug: 'intel-core-i5-14600k',
      price: 6900000,
      stockQuantity: 50,
      isPcComponent: true,
      aiTags: ['cpu', 'intel', 'mid-range', 'gaming'],
      description: 'Intel Core i5-14600K, 10 nhân 16 luồng, 4.0GHz up to 5.3GHz',
    },
  });

  await prisma.pcComponent.create({
    data: {
      productId: i5Product.id,
      componentType: 'CPU',
      socket: 'LGA1700',
      ramGeneration: 'DDR5',
      powerConsumption: 125,
    },
  });

  const mbProduct = await prisma.product.create({
    data: {
      categoryId: mbCat.id,
      brandId: intel.id,
      name: 'ASUS PRIME Z790-P',
      slug: 'asus-prime-z790-p',
      price: 4500000,
      stockQuantity: 30,
      isPcComponent: true,
      aiTags: ['mainboard', 'intel', 'z790', 'ddr5'],
      description: 'ASUS PRIME Z790-P, LGA1700, DDR5, ATX',
    },
  });

  await prisma.pcComponent.create({
    data: {
      productId: mbProduct.id,
      componentType: 'MAINBOARD',
      socket: 'LGA1700',
      ramGeneration: 'DDR5',
      ramSlots: 4,
      maxRamCapacity: 128,
      formFactor: 'ATX',
      powerConsumption: 30,
    },
  });

  const ramProduct = await prisma.product.create({
    data: {
      categoryId: ramCat.id,
      brandId: corsair.id,
      name: 'Corsair Vengeance 32GB DDR5',
      slug: 'corsair-vengeance-32gb-ddr5',
      price: 2800000,
      stockQuantity: 100,
      isPcComponent: true,
      aiTags: ['ram', 'ddr5', 'corsair', '32gb'],
      description: 'Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz',
    },
  });

  await prisma.pcComponent.create({
    data: {
      productId: ramProduct.id,
      componentType: 'RAM',
      ramGeneration: 'DDR5',
      ramCapacity: 32,
      ramBus: 5600,
      powerConsumption: 10,
    },
  });

  const gpuProduct = await prisma.product.create({
    data: {
      categoryId: vgaCat.id,
      brandId: nvidia.id,
      name: 'NVIDIA RTX 4070 Super',
      slug: 'nvidia-rtx-4070-super',
      price: 14500000,
      stockQuantity: 20,
      isPcComponent: true,
      aiTags: ['vga', 'rtx-4070', 'gaming', 'high-end'],
      description: 'NVIDIA GeForce RTX 4070 Super 12GB GDDR6X',
    },
  });

  await prisma.pcComponent.create({
    data: {
      productId: gpuProduct.id,
      componentType: 'VGA',
      gpuLengthMm: 310,
      powerConsumption: 220,
      pcieVersion: '4.0',
    },
  });

  const psuProduct = await prisma.product.create({
    data: {
      categoryId: psuCat.id,
      brandId: corsair.id,
      name: 'Corsair RM750x',
      slug: 'corsair-rm750x',
      price: 2100000,
      stockQuantity: 40,
      isPcComponent: true,
      aiTags: ['psu', 'corsair', '750w'],
      description: 'Corsair RM750x 750W 80+ Gold',
    },
  });

  await prisma.pcComponent.create({
    data: {
      productId: psuProduct.id,
      componentType: 'PSU',
      powerSupplyWatt: 750,
      formFactor: 'ATX',
    },
  });

  const caseProduct = await prisma.product.create({
    data: {
      categoryId: caseCat.id,
      brandId: corsair.id,
      name: 'Corsair 4000D Airflow',
      slug: 'corsair-4000d-airflow',
      price: 1900000,
      stockQuantity: 25,
      isPcComponent: true,
      aiTags: ['case', 'corsair', 'atx', 'mid-tower'],
      description: 'Corsair 4000D Airflow Mid-Tower ATX Case',
    },
  });

  await prisma.pcComponent.create({
    data: {
      productId: caseProduct.id,
      componentType: 'CASE',
      formFactor: 'ATX / Micro-ATX / Mini-ITX',
      maxGpuLengthMm: 360,
      maxCpuCoolerHeightMm: 170,
    },
  });

  const ssdProduct = await prisma.product.create({
    data: {
      categoryId: storageCat.id,
      brandId: samsung.id,
      name: 'Samsung 990 Pro 1TB',
      slug: 'samsung-990-pro-1tb',
      price: 3200000,
      stockQuantity: 60,
      isPcComponent: true,
      aiTags: ['ssd', 'nvme', 'samsung', 'storage'],
      description: 'Samsung 990 Pro 1TB NVMe M.2 PCIe 4.0',
    },
  });

  await prisma.pcComponent.create({
    data: {
      productId: ssdProduct.id,
      componentType: 'STORAGE',
      storageInterface: 'M.2 NVMe',
      powerConsumption: 6,
    },
  });

  // Laptop sample
  await prisma.product.create({
    data: {
      categoryId: laptopCat.id,
      brandId: samsung.id,
      name: 'Samsung Galaxy Book 4 Pro',
      slug: 'samsung-galaxy-book-4-pro',
      price: 24900000,
      stockQuantity: 15,
      isPcComponent: false,
      aiTags: ['laptop', 'samsung', 'ultrabook'],
      description: 'Samsung Galaxy Book 4 Pro, Intel Core Ultra 7, 16GB, 512GB',
      spec: {
        create: {
          cpuBrand: 'Intel',
          cpuSeries: 'Core Ultra 7',
          ramCapacity: 16,
          ramGeneration: 'DDR5',
          storageCapacity: 512,
          storageType: 'SSD',
          screenSize: 16,
          specs: { resolution: '2880x1800', touchscreen: true, weight: '1.56kg' },
        },
      },
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
