import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async checkout(userId: string, dto: { shippingAddressId: string; note?: string }) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: BigInt(dto.shippingAddressId), userId: BigInt(userId) },
    });
    if (!address) throw new NotFoundException('Shipping address not found');

    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId: BigInt(userId) },
      include: { product: true },
    });
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    const productIds = cartItems.map((item) => item.productId).sort((a, b) => Number(a - b));

    const result = await this.prisma.$transaction(async (tx) => {
      const rows: { id: bigint; stock_quantity: number }[] = await tx.$queryRawUnsafe(
        `SELECT id, stock_quantity FROM products WHERE id = ANY($1) ORDER BY id FOR UPDATE`,
        [productIds],
      );

      const productMap = new Map(rows.map((r) => [r.id.toString(), Number(r.stock_quantity)]));

      const orderItemsData: {
        productId: bigint;
        productName: string;
        productSlug: string | null;
        productImageUrl: string | null;
        quantity: number;
        price: number;
      }[] = [];

      let totalAmount = 0;

      for (const item of cartItems) {
        const pid = item.productId.toString();
        const availableStock = productMap.get(pid) ?? 0;

        if (item.quantity > availableStock) {
          throw new BadRequestException(
            `Insufficient stock for "${item.product.name}". Available: ${availableStock}`,
          );
        }

        const updated = await tx.$executeRawUnsafe(
          `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1`,
          item.quantity,
          item.productId,
        );

        if (updated === 0) {
          throw new BadRequestException(
            `Insufficient stock for "${item.product.name}"`,
          );
        }

        const price = Number(item.product.price);
        orderItemsData.push({
          productId: item.productId,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImageUrl: item.product.imageUrl,
          quantity: item.quantity,
          price,
        });
        totalAmount += price * item.quantity;
      }

      const order = await tx.order.create({
        data: {
          userId: BigInt(userId),
          totalAmount,
          shippingFee: 0,
          shippingAddress: `${address.addressLine}, ${address.ward || ''}, ${address.district || ''}, ${address.city || ''}`,
          customerName: address.receiverName,
          customerPhone: address.phone,
          note: dto.note,
          status: 'pending',
          paymentStatus: 'unpaid',
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({
        where: { userId: BigInt(userId) },
      });

      return {
        ...order,
        id: order.id.toString(),
        userId: order.userId?.toString(),
        totalAmount: Number(order.totalAmount),
        shippingFee: Number(order.shippingFee),
      };
    });

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { email: true },
    });
    if (user?.email) {
      await this.mailService.sendOrderCreated(
        user.email,
        result.id,
        result.totalAmount,
      );
    }
    return result;
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: BigInt(userId) },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          vnpayTxn: { select: { status: true, paymentDate: true } },
        },
      }),
      this.prisma.order.count({ where: { userId: BigInt(userId) } }),
    ]);

    return {
      data: data.map((o) => ({
        ...o,
        id: o.id.toString(),
        userId: o.userId?.toString(),
        totalAmount: Number(o.totalAmount),
        shippingFee: Number(o.shippingFee),
      })),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getOrderDetail(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: BigInt(orderId), userId: BigInt(userId) },
      include: { items: true, vnpayTxn: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      ...order,
      id: order.id.toString(),
      userId: order.userId?.toString(),
      totalAmount: Number(order.totalAmount),
      shippingFee: Number(order.shippingFee),
      items: order.items.map((i) => ({
        ...i,
        id: i.id.toString(),
        price: Number(i.price),
        subtotal: Number(i.subtotal),
      })),
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: BigInt(orderId), userId: BigInt(userId), status: 'pending' },
    });
    if (!order) throw new NotFoundException('Order not found or cannot be cancelled');

    return this.cancelOrderWithStockRestore(orderId, BigInt(userId));
  }

  async cancelOrderWithStockRestore(orderId: string, userId?: bigint) {
    const where: any = { id: BigInt(orderId), status: 'pending', paymentStatus: 'unpaid' };
    if (userId) where.userId = userId;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where,
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found or cannot be cancelled');

      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: BigInt(orderId) },
        data: { status: 'cancelled' },
      });

      return {
        ...updated,
        id: updated.id.toString(),
        totalAmount: Number(updated.totalAmount),
      };
    });
  }
}
