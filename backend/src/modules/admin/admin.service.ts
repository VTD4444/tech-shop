import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
        include: { items: true, user: { select: { username: true, email: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((o) => ({
        ...o,
        id: o.id.toString(),
        userId: o.userId?.toString(),
        totalAmount: Number(o.totalAmount),
        shippingFee: Number(o.shippingFee),
        items: o.items.map((item) => ({
          ...item,
          id: item.id.toString(),
          orderId: item.orderId.toString(),
          productId: item.productId?.toString() ?? null,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        })),
      })),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.order.update({
      where: { id: BigInt(orderId) },
      data: { status },
    });
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
