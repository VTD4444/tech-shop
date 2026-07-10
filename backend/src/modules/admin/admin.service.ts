import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { ORDER_STATUS_TRANSITIONS } from '../../common/utils/order-status.util';
import { toId } from '../../common/utils/serialize';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

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

  async getOrders(page = 1, limit = 20, status?: string, search?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;

    const q = search?.trim();
    if (q) {
      const or: Prisma.OrderWhereInput[] = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q } },
        { shippingAddress: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
      ];
      if (/^\d+$/.test(q)) {
        or.push({ id: BigInt(q) });
      }
      where.OR = or;
    }

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
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === status) {
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

    const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot change order status from "${order.status}" to "${status}"`,
      );
    }

    if (status === 'delivered' && order.paymentStatus !== 'paid') {
      throw new BadRequestException('Order must be paid before marking as delivered');
    }

    if (status === 'cancelled') {
      const cancelled = await this.ordersService.adminCancelWithStockRestore(orderId);
      return {
        id: cancelled.id,
        userId: cancelled.userId,
        totalAmount: cancelled.totalAmount,
        shippingFee: cancelled.shippingFee,
        shippingAddress: cancelled.shippingAddress,
        customerName: cancelled.customerName,
        customerPhone: cancelled.customerPhone,
        note: cancelled.note,
        status: cancelled.status,
        paymentStatus: cancelled.paymentStatus,
        createdAt: cancelled.createdAt,
        updatedAt: cancelled.updatedAt,
      };
    }

    const updated = await this.prisma.order.update({
      where: { id: BigInt(orderId) },
      data: { status },
    });

    return {
      id: toId(updated.id)!,
      userId: toId(updated.userId),
      totalAmount: Number(updated.totalAmount),
      shippingFee: Number(updated.shippingFee),
      shippingAddress: updated.shippingAddress,
      customerName: updated.customerName,
      customerPhone: updated.customerPhone,
      note: updated.note,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
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

  private mapCustomer(user: {
    id: bigint;
    username: string;
    fullName: string;
    email: string;
    phone: string | null;
    authProvider: string;
    isActive: boolean;
    createdAt: Date;
    _count?: { orders: number };
  }) {
    return {
      id: toId(user.id)!,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      authProvider: user.authProvider,
      isActive: user.isActive,
      createdAt: user.createdAt,
      orderCount: user._count?.orders ?? 0,
    };
  }

  async getCustomers(page = 1, limit = 20, search?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = { role: 'customer' };
    const q = search?.trim();
    if (q) {
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        ...(q.match(/^0\d{9}$/) ? [{ phone: { contains: q } }] : []),
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          authProvider: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u) => this.mapCustomer(u)),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async deleteCustomer(customerId: string, adminUserId: string) {
    if (customerId === adminUserId) {
      throw new BadRequestException('Không thể xóa tài khoản đang đăng nhập');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(customerId) },
      include: { _count: { select: { orders: true } } },
    });
    if (!user || user.role !== 'customer') {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    if (user._count.orders > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });
      return { message: 'Đã vô hiệu hóa khách hàng (còn lịch sử đơn hàng)' };
    }

    await this.prisma.user.delete({ where: { id: user.id } });
    return { message: 'Đã xóa khách hàng' };
  }

  async resetCustomerPassword(customerId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(customerId) },
    });
    if (!user || user.role !== 'customer') {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          authProvider: user.authProvider === 'google' ? 'google' : 'local',
        },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: 'Đã đặt lại mật khẩu cho khách hàng' };
  }
}
