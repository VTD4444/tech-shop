import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { serializeProduct, serializePcComponent, toId, toNumber } from '../../common/utils/serialize';
import { UploadService } from '../upload/upload.service';
import { normalizePcComponentInput, PcComponentInput } from './pc-component.util';

export type ProductListQuery = {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    isPcComponent?: boolean;
    sort?: string;
    cpuBrand?: string;
    ramCapacity?: number;
    ramGeneration?: string;
    gpuModel?: string;
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: ProductListQuery) {
    if (this.redis.isAvailable()) {
      const version = await this.redis.getProductsCacheVersion();
      const cacheKey = this.redis.buildProductsListKey(version, query);
      const cached = await this.redis.get<{
        data: ReturnType<typeof serializeProduct>[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>(cacheKey);
      if (cached) return cached;
    }

    const result = await this.queryProducts(query);

    if (this.redis.isAvailable()) {
      const version = await this.redis.getProductsCacheVersion();
      const cacheKey = this.redis.buildProductsListKey(version, query);
      const ttl = Number(process.env.REDIS_PRODUCTS_CACHE_TTL || 300);
      await this.redis.set(cacheKey, result, ttl);
    }

    return result;
  }

  private async queryProducts(query: ProductListQuery) {
    const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    where.status = 'active';

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.brand) {
      where.brand = { slug: query.brand };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) where.price.lte = Number(query.maxPrice);
    }
    if (query.isPcComponent !== undefined) {
      where.isPcComponent = query.isPcComponent === true;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const specFilter: Prisma.ProductSpecWhereInput = {};
    if (query.cpuBrand) specFilter.cpuBrand = query.cpuBrand;
    if (query.ramCapacity) specFilter.ramCapacity = Number(query.ramCapacity);
    if (query.ramGeneration) specFilter.ramGeneration = query.ramGeneration;
    if (query.gpuModel) specFilter.gpuModel = { contains: query.gpuModel, mode: 'insensitive' };
    if (Object.keys(specFilter).length > 0) {
      where.spec = specFilter;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (query.sort === 'name_asc') orderBy = { name: 'asc' };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
          images: { where: { isMain: true }, take: 1, select: { imageUrl: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((p) => serializeProduct(p)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async invalidateProductListCache() {
    await this.redis.bumpProductsCacheVersion();
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' }, select: { id: true, imageUrl: true, isMain: true } },
        spec: true,
        pcComponent: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      ...serializeProduct({ ...product, images: product.images }),
      images: product.images.map((img) => ({
        id: toId(img.id),
        imageUrl: img.imageUrl,
        isMain: img.isMain,
      })),
      spec: product.spec
        ? {
            ...product.spec,
            id: toId(product.spec.id),
            productId: toId(product.spec.productId),
            screenSize: product.spec.screenSize != null ? toNumber(product.spec.screenSize) : null,
          }
        : null,
      pcComponent: product.pcComponent ? serializePcComponent(product.pcComponent) : null,
    };
  }

  async getSpecs(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { spec: true, pcComponent: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return { spec: product.spec, pcComponent: product.pcComponent };
  }

  async getReviews(slug: string, page = 1, limit = 10) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const [data, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId: product.id },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      this.prisma.productReview.count({ where: { productId: product.id } }),
    ]);

    return {
      data,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  private validateImages(images?: { url: string; isMain?: boolean; sortOrder?: number }[]) {
    if (!images?.length) return;
    for (const img of images) {
      if (!UploadService.isAllowedImageUrl(img.url)) {
        throw new BadRequestException(`Invalid image URL: ${img.url}`);
      }
    }
  }

  private async syncProductImages(
    productId: bigint,
    images?: { url: string; isMain?: boolean; sortOrder?: number }[],
  ) {
    if (!images) return null;
    this.validateImages(images);
    await this.prisma.productImage.deleteMany({ where: { productId } });
    if (images.length === 0) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { imageUrl: null },
      });
      return null;
    }
    const main =
      images.find((i) => i.isMain)?.url || images[0].url;
    await this.prisma.productImage.createMany({
      data: images.map((img, idx) => ({
        productId,
        imageUrl: img.url,
        isMain: img.isMain ?? img.url === main,
        sortOrder: img.sortOrder ?? idx,
      })),
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl: main },
    });
    return main;
  }

  private async syncPcComponent(
    productId: bigint,
    isPcComponent: boolean,
    pcComponent?: PcComponentInput,
  ) {
    if (!isPcComponent) {
      await this.prisma.pcComponent.deleteMany({ where: { productId } });
      return;
    }
    if (!pcComponent) {
      throw new BadRequestException('PC component specs are required when isPcComponent is true');
    }
    const data = normalizePcComponentInput(pcComponent);
    await this.prisma.pcComponent.upsert({
      where: { productId },
      create: { productId, ...data },
      update: data,
    });
  }

  private productIncludeForAdmin = {
    images: { orderBy: { sortOrder: 'asc' as const } },
    pcComponent: true,
  };

  async create(dto: any) {
    this.validateImages(dto.images);
    const mainFromDto =
      dto.images?.find((i: { isMain?: boolean }) => i.isMain)?.url ||
      dto.images?.[0]?.url ||
      dto.imageUrl;
    if (mainFromDto && !UploadService.isAllowedImageUrl(mainFromDto)) {
      throw new BadRequestException('Invalid image URL');
    }
    const product = await this.prisma.product.create({
      data: {
        categoryId: dto.categoryId ? BigInt(dto.categoryId) : null,
        brandId: dto.brandId ? BigInt(dto.brandId) : null,
        name: dto.name,
        slug: dto.slug,
        price: dto.price,
        stockQuantity: dto.stockQuantity || 0,
        imageUrl: mainFromDto,
        description: dto.description,
        isPcComponent: dto.isPcComponent || false,
        aiTags: dto.aiTags || [],
        status: dto.status || 'active',
      },
    });
    await this.syncProductImages(product.id, dto.images);
    if (dto.isPcComponent) {
      await this.syncPcComponent(product.id, true, dto.pcComponent);
    }
    await this.invalidateProductListCache();
    const saved = await this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: this.productIncludeForAdmin,
    });
    return {
      ...serializeProduct(saved),
      pcComponent: saved.pcComponent ? serializePcComponent(saved.pcComponent) : null,
    };
  }

  async update(id: string, dto: any) {
    const data: any = { ...dto };
    delete data.images;
    delete data.pcComponent;
    if (data.categoryId) data.categoryId = BigInt(data.categoryId);
    if (data.brandId) data.brandId = BigInt(data.brandId);

    const productId = BigInt(id);
    if (dto.images) {
      await this.syncProductImages(productId, dto.images);
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data,
    });

    if (dto.isPcComponent !== undefined || dto.pcComponent !== undefined) {
      const isPcComponent = dto.isPcComponent ?? product.isPcComponent;
      await this.syncPcComponent(productId, isPcComponent, dto.pcComponent);
    }

    await this.invalidateProductListCache();
    const saved = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: this.productIncludeForAdmin,
    });
    return {
      ...serializeProduct(saved),
      pcComponent: saved.pcComponent ? serializePcComponent(saved.pcComponent) : null,
    };
  }

  async remove(id: string) {
    const product = await this.prisma.product.update({
      where: { id: BigInt(id) },
      data: { status: 'discontinued' },
    });
    await this.invalidateProductListCache();
    return product;
  }

  async createReview(userId: string, slug: string, dto: { rating: number; comment?: string }) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.productReview.create({
      data: {
        userId: BigInt(userId),
        productId: product.id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }
}
