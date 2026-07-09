import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersCleanupService {
  private readonly logger = new Logger(OrdersCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async releaseUnpaidOrders() {
    const timeoutHours = Number(process.env.UNPAID_ORDER_TIMEOUT_HOURS || 24);
    const cutoff = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

    const staleOrders = await this.prisma.order.findMany({
      where: {
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: { lt: cutoff },
        OR: [
          { paymentTxn: null },
          { paymentTxn: { status: { not: 'processing' } } },
        ],
      },
      select: { id: true },
    });

    for (const order of staleOrders) {
      try {
        await this.ordersService.cancelOrderWithStockRestore(order.id.toString());
        this.logger.log(`Auto-cancelled unpaid order ${order.id}`);
      } catch (err) {
        this.logger.warn(`Failed to auto-cancel order ${order.id}: ${err}`);
      }
    }
  }
}
