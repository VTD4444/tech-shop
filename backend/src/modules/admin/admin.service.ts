import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toId } from '../../common/utils/serialize';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private mapOrderDetail(o: {
    id: bigint;
    userId: bigint | null;
    totalAmount: { toString(): string } | number | bigint;
    shippingFee: { toString(): string } | number | bigint;
    shippingAddress: string;
    customerName: string;
    customerPhone: string;
    note: string | null;
    status: string;
    paymentStatus: string;
    createdAt: Date;
    updatedAt: Date;
    items: {
      id: bigint;
      orderId: bigint;
      productId: bigint | null;
      productName: string;
      productSlug: string | null;
      productImageUrl: string | null;
      quantity: number;
      price: { toString(): string } | number | bigint;
      subtotal: { toString(): string } | number | bigint;
    }[];
    user?: {
      id: bigint;
      username: string;
      email: string;
      fullName: string;
      phone: string | null;
    } | null;
    paymentTxn?: {
      id: bigint;
      orderId: bigint;
      provider: string;
      invoiceNumber: string;
      externalTxnId: string | null;
      amount: { toString(): string } | number | bigint;
      status: string;
      paymentDate: Date | null;
    } | null;
  }) {
    return {
      id: toId(o.id)!,
      userId: toId(o.userId),
      totalAmount: Number(o.totalAmount),
      shippingFee: Number(o.shippingFee),
      shippingAddress: o.shippingAddress,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      note: o.note,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      user: o.user
        ? {
            id: toId(o.user.id)!,
            username: o.user.username,
            email: o.user.email,
            fullName: o.user.fullName,
            phone: o.user.phone,
          }
        : null,
      items: o.items.map((item) => ({
        id: toId(item.id)!,
        orderId: toId(item.orderId)!,
        productId: toId(item.productId),
        productName: item.productName,
        productSlug: item.productSlug,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
      paymentTxn: o.paymentTxn
        ? {
            id: toId(o.paymentTxn.id)!,
            orderId: toId(o.paymentTxn.orderId)!,
            provider: o.paymentTxn.provider,
            invoiceNumber: o.paymentTxn.invoiceNumber,
            externalTxnId: o.paymentTxn.externalTxnId,
            amount: Number(o.paymentTxn.amount),
            status: o.paymentTxn.status,
            paymentDate: o.paymentTxn.paymentDate,
          }
        : null,
    };
  }

  async getOrders(page = 1, limit = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { items: true, user: { select: { id: true, username: true, email: true, fullName: true, phone: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((o) => this.mapOrderDetail(o)),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      include: {
        items: true,
        user: {
          select: { id: true, username: true, email: true, fullName: true, phone: true },
        },
        paymentTxn: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.mapOrderDetail(order);
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id: BigInt(orderId) },
      data: { status },
    });

    return {
      id: toId(order.id)!,
      userId: toId(order.userId),
      totalAmount: Number(order.totalAmount),
      shippingFee: Number(order.shippingFee),
      shippingAddress: order.shippingAddress,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      note: order.note,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async getProductInventory() {
    const products = await this.prisma.product.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, slug: true, stockQuantity: true, status: true },
      orderBy: { stockQuantity: 'asc' },
      take: 50,
    });

    return products.map((p) => ({ ...p, id: p.id.toString() }));
  }

  async getAnalyticsSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrders, totalRevenue, totalProducts, totalUsers, monthRevenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'paid' } }),
      this.prisma.product.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'paid',
          createdAt: { gte: monthStart },
        },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      monthRevenue: Number(monthRevenue._sum.totalAmount || 0),
      totalProducts,
      totalUsers,
    };
  }

  async getRevenueByMonth(months = 12) {
    const limit = Math.min(Math.max(Number(months) || 12, 1), 24);
    const rows = await this.prisma.$queryRaw<
      { month: Date; revenue: unknown; orders: bigint }[]
    >`
      SELECT date_trunc('month', created_at) AS month,
             COALESCE(SUM(total_amount), 0) AS revenue,
             COUNT(*)::bigint AS orders
      FROM orders
      WHERE payment_status = 'paid'
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT ${limit}
    `;

    return rows
      .map((r) => ({
        month: r.month,
        label: new Date(r.month).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      }))
      .reverse();
  }
}
