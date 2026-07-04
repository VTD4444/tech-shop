import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toId } from '../../common/utils/serialize';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private mapCartItem(item: {
    id: bigint;
    userId: bigint;
    productId: bigint;
    quantity: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return {
      id: toId(item.id)!,
      userId: toId(item.userId)!,
      productId: toId(item.productId)!,
      quantity: item.quantity,
    };
  }

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId: BigInt(userId) },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true,
            imageUrl: true, stockQuantity: true, status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const mapped = items.map((item) => ({
      id: item.id.toString(),
      userId: item.userId.toString(),
      productId: item.productId.toString(),
      quantity: item.quantity,
      product: { ...item.product, id: item.product.id.toString(), price: Number(item.product.price) },
    }));

    const subtotal = mapped.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const shipping = 0;
    const total = subtotal + shipping;

    return {
      items: mapped,
      summary: { subtotal, shipping, total },
    };
  }

  async addItem(userId: string, dto: { productId: string; quantity: number }) {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(dto.productId) },
    });
    if (!product || product.status !== 'active') {
      throw new NotFoundException('Product not found or unavailable');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: BigInt(userId),
          productId: BigInt(dto.productId),
        },
      },
    });

    const newQty = (existing?.quantity ?? 0) + dto.quantity;
    if (newQty > product.stockQuantity) {
      throw new BadRequestException('Insufficient stock');
    }

    if (existing) {
      const updated = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
      return {
        id: updated.id.toString(),
        productId: dto.productId,
        quantity: updated.quantity,
      };
    }

    const created = await this.prisma.cartItem.create({
      data: {
        userId: BigInt(userId),
        productId: BigInt(dto.productId),
        quantity: dto.quantity,
      },
    });
    return {
      id: created.id.toString(),
      productId: dto.productId,
      quantity: created.quantity,
    };
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: BigInt(userId),
          productId: BigInt(productId),
        },
      },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (quantity > item.product.stockQuantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.mapCartItem(updated);
  }

  async removeItem(userId: string, productId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: BigInt(userId),
          productId: BigInt(productId),
        },
      },
    });
    if (!cartItem) throw new NotFoundException('Cart item not found');

    const deleted = await this.prisma.cartItem.delete({ where: { id: cartItem.id } });
    return this.mapCartItem(deleted);
  }

  async clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { userId: BigInt(userId) },
    });
  }
}
