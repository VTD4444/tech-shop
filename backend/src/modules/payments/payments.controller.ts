import { Controller, Post, Get, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('vnpay/create-url')
  createPaymentUrl(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Query('orderId') orderId: string,
  ) {
    const ipAddr = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.paymentsService.createPaymentUrl(userId, orderId, ipAddr);
  }

  @Public()
  @Get('vnpay/return')
  handleReturn(@Query() query: Record<string, any>) {
    return this.paymentsService.handleReturn(query);
  }

  @Public()
  @Get('vnpay/return-status')
  returnStatus(@Query('txnRef') txnRef: string) {
    return this.paymentsService.getReturnStatus(txnRef);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('vnpay/ipn')
  handleIpn(@Query() query: Record<string, any>, @Req() req: Request) {
    return this.paymentsService.handleIpn({
      ...query,
      clientIp: req.ip || req.socket.remoteAddress,
    });
  }
}
