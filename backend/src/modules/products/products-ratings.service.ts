import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UploadService } from '../upload/upload.service';
import { serializeRating, formatOrderLabel } from '../../common/utils/engagement-serialize';
import { CreateRatingDto, UpdateRatingDto } from './dto/engagement.dto';

@Injectable()
export class ProductsRatingsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private validateImageUrls(images?: string[]) {
    if (!images?.length) return;
    if (images.length > 5) throw new BadRequestException('Maximum 5 images allowed');
    for (const url of images) {
      if (!UploadService.isAllowedImageUrl(url)) {
        throw new BadRequestException(`Invalid image URL: ${url}`);
      }
    }
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getRatingSummary(slug: string) {
    const product = await this.getProductBySlug(slug);
    const cacheKey = `product:rating-summary:${product.id.toString()}`;

    if (this.redis.isAvailable()) {
      const cached = await this.redis.get<{
        average: number;
        count: number;
        distribution: Record<string, number>;
      }>(cacheKey);
      if (cached) return cached;
    }

    const groups = await this.prisma.productRating.groupBy({
      by: ['rating'],
      where: { productId: product.id },
      _count: { rating: true },
    });

    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let total = 0;
    let sum = 0;
    for (const g of groups) {
      distribution[String(g.rating)] = g._count.rating;
      total += g._count.rating;
      sum += g.rating * g._count.rating;
    }

    const summary = {
      average: total ? Math.round((sum / total) * 10) / 10 : 0,
      count: total,
      distribution,
    };

    if (this.redis.isAvailable()) {
      await this.redis.set(cacheKey, summary, 300);
    }

    return summary;
  }

  private async invalidateSummary(productId: bigint) {
    if (!this.redis.isAvailable()) return;
    await this.redis.del(`product:rating-summary:${productId.toString()}`);
  }

  async listRatings(slug: string, page = 1, limit = 10) {
    const product = await this.getProductBySlug(slug);
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(50, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.productRating.findMany({
        where: { productId: product.id },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, fullName: true } } },
      }),
      this.prisma.productRating.count({ where: { productId: product.id } }),
    ]);

    return {
      data: data.map(serializeRating),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getUnratedOrders(userId: string, productId: bigint) {
    const orders = await this.prisma.order.findMany({
      where: {
        userId: BigInt(userId),
        status: 'completed',
        paymentStatus: 'paid',
        items: { some: { productId } },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true },
    });

    const ratedOrderIds = new Set(
      (
        await this.prisma.productRating.findMany({
          where: { productId, userId: BigInt(userId), orderId: { not: null } },
          select: { orderId: true },
        })
      )
        .map((r) => r.orderId?.toString())
        .filter(Boolean),
    );

    return orders
      .filter((o) => !ratedOrderIds.has(o.id.toString()))
      .map((o) => ({
        orderId: o.id.toString(),
        orderedAt: o.createdAt,
        label: formatOrderLabel(o.createdAt),
      }));
  }

  private async assertCanRateOrder(userId: string, orderId: string, productId: bigint) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: BigInt(userId),
        status: 'completed',
        paymentStatus: 'paid',
        items: { some: { productId } },
      },
    });
    if (!order) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'RATING_NOT_PURCHASED', message: 'You can only rate products from completed paid orders' },
      });
    }
  }

  async createRating(userId: string, slug: string, dto: CreateRatingDto) {
    const product = await this.getProductBySlug(slug);
    this.validateImageUrls(dto.images);
    await this.assertCanRateOrder(userId, dto.orderId, product.id);

    const existing = await this.prisma.productRating.findFirst({
      where: { orderId: BigInt(dto.orderId), productId: product.id },
    });
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'RATING_ALREADY_EXISTS', message: 'You already rated this purchase' },
      });
    }

    const rating = await this.prisma.productRating.create({
      data: {
        userId: BigInt(userId),
        productId: product.id,
        orderId: BigInt(dto.orderId),
        rating: dto.rating,
        images: dto.images ?? [],
      },
      include: { user: { select: { id: true, username: true, fullName: true } } },
    });

    await this.invalidateSummary(product.id);
    return serializeRating(rating);
  }

  async updateRating(userId: string, slug: string, ratingId: string, dto: UpdateRatingDto) {
    const product = await this.getProductBySlug(slug);
    const rating = await this.prisma.productRating.findFirst({
      where: { id: BigInt(ratingId), productId: product.id },
      include: { user: { select: { id: true, username: true, fullName: true } } },
    });
    if (!rating) throw new NotFoundException('Rating not found');
    if (rating.userId.toString() !== userId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'RATING_FORBIDDEN', message: 'Not your rating' },
      });
    }

    this.validateImageUrls(dto.images);

    const updated = await this.prisma.productRating.update({
      where: { id: rating.id },
      data: {
        ...(dto.rating != null ? { rating: dto.rating } : {}),
        ...(dto.images != null ? { images: dto.images } : {}),
      },
      include: { user: { select: { id: true, username: true, fullName: true } } },
    });

    await this.invalidateSummary(product.id);
    return serializeRating(updated);
  }
}
