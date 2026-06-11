import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId: BigInt(userId) },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true,
            imageUrl: true, status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id.toString(),
      product: { ...item.product, id: item.product.id.toString() },
      createdAt: item.createdAt,
    }));
  }

  async addItem(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(productId) },
    });
    if (!product) throw new Error('Product not found');

    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: BigInt(userId),
          productId: BigInt(productId),
        },
      },
    });
    if (existing) return existing;

    return this.prisma.wishlist.create({
      data: {
        userId: BigInt(userId),
        productId: BigInt(productId),
      },
    });
  }

  async removeItem(userId: string, productId: string) {
    const item = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: BigInt(userId),
          productId: BigInt(productId),
        },
      },
    });
    if (item) {
      return this.prisma.wishlist.delete({ where: { id: item.id } });
    }
  }
}
