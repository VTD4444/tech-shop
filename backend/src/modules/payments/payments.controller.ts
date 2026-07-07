import { Controller, Post, Get, Req, Query, Body } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SepayIpnDto } from './dto/sepay-ipn.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('sepay/init')
  createCheckout(
    @CurrentUser('id') userId: string,
    @Query('orderId') orderId: string,
  ) {
    return this.paymentsService.createCheckout(userId, orderId);
  }

  @Public()
  @Get('sepay/status')
  returnStatus(@Query('invoice') invoice: string) {
    return this.paymentsService.getReturnStatus(invoice);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('sepay/abandon')
  abandonCheckout(@Body('invoice') invoice: string) {
    return this.paymentsService.abandonCheckout(invoice);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('sepay/ipn')
  handleIpn(@Body() body: SepayIpnDto, @Req() req: Request) {
    const clientIp = req.ip || req.socket.remoteAddress;
    return this.paymentsService.handleIpn(body as Record<string, any>, clientIp);
  }
}
