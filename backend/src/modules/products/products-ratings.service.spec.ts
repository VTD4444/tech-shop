import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ProductsRatingsService } from './products-ratings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('ProductsRatingsService', () => {
  let service: ProductsRatingsService;

  const prisma = {
    product: { findUnique: jest.fn() },
    productRating: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    order: { findMany: jest.fn(), findFirst: jest.fn() },
  };

  const redis = {
    isAvailable: () => false,
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsRatingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();
    service = module.get(ProductsRatingsService);
    jest.clearAllMocks();
  });

  it('rejects rating without valid order', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 1n, slug: 'test' });
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(
      service.createRating('1', 'test', { rating: 5, orderId: '99' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate rating for same order', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 1n, slug: 'test' });
    prisma.order.findFirst.mockResolvedValue({ id: 99n });
    prisma.productRating.findFirst.mockResolvedValue({ id: 1n });

    await expect(
      service.createRating('1', 'test', { rating: 5, orderId: '99' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
