import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  checkout(
    @CurrentUser('id') userId: string,
    @Body() dto: { shippingAddressId: string; note?: string },
  ) {
    return this.ordersService.checkout(userId, dto);
  }

  @Get()
  getOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getOrders(userId, page, limit);
  }

  @Get(':id')
  getOrderDetail(@CurrentUser('id') userId: string, @Param('id') orderId: string) {
    return this.ordersService.getOrderDetail(userId, orderId);
  }

  @Patch(':id/cancel')
  cancelOrder(@CurrentUser('id') userId: string, @Param('id') orderId: string) {
    return this.ordersService.cancelOrder(userId, orderId);
  }
}
