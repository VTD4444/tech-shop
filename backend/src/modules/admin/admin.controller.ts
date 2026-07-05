import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('orders')
  getOrders(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.adminService.getOrders(page, limit, status);
  }

  @Get('orders/:id')
  getOrder(@Param('id') orderId: string) {
    return this.adminService.getOrderById(orderId);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') orderId: string, @Query('status') status: string) {
    return this.adminService.updateOrderStatus(orderId, status);
  }

  @Get('products/inventory')
  getProductInventory() {
    return this.adminService.getProductInventory();
  }

  @Get('analytics/summary')
  getAnalyticsSummary() {
    return this.adminService.getAnalyticsSummary();
  }

  @Get('analytics/revenue-by-month')
  getRevenueByMonth(@Query('months') months?: number) {
    return this.adminService.getRevenueByMonth(months);
  }
}
