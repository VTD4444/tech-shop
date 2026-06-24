import { ProductsService } from './products.service';

describe('ProductsService pagination parsing', () => {
  const prisma = {
    product: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  };
  const redis = {
    isAvailable: () => false,
    getProductsCacheVersion: jest.fn(),
    buildProductsListKey: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    bumpProductsCacheVersion: jest.fn(),
  };
  const ratingsService = { getUnratedOrders: jest.fn() };
  const service = new ProductsService(prisma as any, redis as any, ratingsService as any);

  it('parses string limit and page as integers', async () => {
    await service.findAll({ page: '2' as any, limit: '8' as any });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 8, take: 8 }),
    );
  });

  it('caps limit at 100', async () => {
    await service.findAll({ limit: 500 });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });
});
