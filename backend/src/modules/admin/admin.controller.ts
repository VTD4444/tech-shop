import { Controller, Get, Patch, Delete, Post, Param, Query, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminOrdersQueryDto, UpdateOrderStatusQueryDto } from './dto/admin.dto';
import {
  AdminCustomersQueryDto,
  AdminResetCustomerPasswordDto,
} from './dto/customer.dto';

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('orders')
  getOrders(@Query() query: AdminOrdersQueryDto) {
    return this.adminService.getOrders(query.page, query.limit, query.status);
  }

  @Get('orders/:id')
  getOrder(@Param('id') orderId: string) {
    return this.adminService.getOrderById(orderId);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Query() query: UpdateOrderStatusQueryDto,
  ) {
    return this.adminService.updateOrderStatus(orderId, query.status);
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

  @Get('customers')
  getCustomers(@Query() query: AdminCustomersQueryDto) {
    return this.adminService.getCustomers(query.page, query.limit, query.search);
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') customerId: string, @CurrentUser('id') adminId: string) {
    return this.adminService.deleteCustomer(customerId, adminId);
  }

  @Post('customers/:id/reset-password')
  resetCustomerPassword(
    @Param('id') customerId: string,
    @Body() dto: AdminResetCustomerPasswordDto,
  ) {
    return this.adminService.resetCustomerPassword(customerId, dto.password);
  }
}
