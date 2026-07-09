import { Controller, Post, Get, Req, Query, Body } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SepayIpnDto } from './dto/sepay-ipn.dto';
import { AbandonCheckoutDto, CreateCheckoutQueryDto } from './dto/payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('sepay/init')
  createCheckout(
    @CurrentUser('id') userId: string,
    @Query() query: CreateCheckoutQueryDto,
  ) {
    return this.paymentsService.createCheckout(userId, query.orderId);
  }

  @Public()
  @Get('sepay/status')
  returnStatus(@Query('invoice') invoice: string) {
    return this.paymentsService.getReturnStatus(invoice);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('sepay/abandon')
  abandonCheckout(
    @CurrentUser('id') userId: string,
    @Body() body: AbandonCheckoutDto,
  ) {
    return this.paymentsService.abandonCheckout(userId, body.invoice);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('sepay/ipn')
  handleIpn(@Body() body: SepayIpnDto, @Req() req: Request) {
    const clientIp = req.ip || req.socket.remoteAddress;
    const rawBody =
      (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ??
      JSON.stringify(body);
    const signature = (req.headers['x-sepay-signature'] as string) ?? '';
    const timestamp = (req.headers['x-sepay-timestamp'] as string) ?? '';
    return this.paymentsService.handleIpn(
      body as Record<string, any>,
      clientIp,
      { rawBody, signature, timestamp },
    );
  }
}
