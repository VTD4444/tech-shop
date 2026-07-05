import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  appendInvoiceToUrl,
  buildInvoiceNumber,
  getSepayCheckoutUrl,
  signSepayCheckoutFields,
} from '../../common/utils/sepay.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createCheckout(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: BigInt(orderId), userId: BigInt(userId) },
      include: { paymentTxn: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus !== 'unpaid' || order.status !== 'pending') {
      throw new BadRequestException('Order is not eligible for payment');
    }

    if (order.paymentTxn?.status === 'success') {
      throw new BadRequestException('Order is already paid');
    }

    const merchantId = process.env.SEPAY_MERCHANT_ID || '';
    const secretKey = process.env.SEPAY_SECRET_KEY || '';
    if (!merchantId || !secretKey) {
      throw new BadRequestException('SePay is not configured');
    }

    const invoiceNumber = buildInvoiceNumber(orderId);
    const orderAmount = String(Math.round(Number(order.totalAmount)));

    const successBase =
      process.env.SEPAY_SUCCESS_URL ||
      'http://localhost:3001/payments/return?status=success';
    const errorBase =
      process.env.SEPAY_ERROR_URL ||
      'http://localhost:3001/payments/return?status=error';
    const cancelBase =
      process.env.SEPAY_CANCEL_URL ||
      'http://localhost:3001/payments/return?status=cancel';

    const fields: Record<string, string> = {
      merchant: merchantId,
      currency: 'VND',
      order_amount: orderAmount,
      operation: 'PURCHASE',
      order_description: `Thanh toan don hang #${orderId}`,
      order_invoice_number: invoiceNumber,
      customer_id: userId,
      payment_method: process.env.SEPAY_PAYMENT_METHOD || 'BANK_TRANSFER',
      success_url: appendInvoiceToUrl(successBase, invoiceNumber),
      error_url: appendInvoiceToUrl(errorBase, invoiceNumber),
      cancel_url: appendInvoiceToUrl(cancelBase, invoiceNumber),
    };

    fields.signature = signSepayCheckoutFields(fields, secretKey);

    if (order.paymentTxn) {
      await this.prisma.paymentTransaction.update({
        where: { id: order.paymentTxn.id },
        data: {
          provider: 'sepay',
          invoiceNumber,
          amount: order.totalAmount,
          status: 'processing',
          externalTxnId: null,
          rawResponse: Prisma.DbNull,
          paymentDate: null,
        },
      });
    } else {
      await this.prisma.paymentTransaction.create({
        data: {
          orderId: BigInt(orderId),
          provider: 'sepay',
          invoiceNumber,
          amount: order.totalAmount,
          status: 'processing',
        },
      });
    }

    return {
      actionUrl: getSepayCheckoutUrl(),
      fields,
      invoiceNumber,
    };
  }

  /** Read-only status for frontend after SePay redirect */
  async getReturnStatus(invoiceNumber: string) {
    if (!invoiceNumber) {
      return {
        paid: false,
        message: 'Missing invoice number',
        orderId: '',
        paymentStatus: '',
        txnStatus: '',
        invoiceNumber: '',
      };
    }

    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { invoiceNumber },
      include: { order: true },
    });
    if (!txn) {
      return {
        paid: false,
        message: 'Transaction not found',
        orderId: '',
        paymentStatus: '',
        txnStatus: '',
        invoiceNumber,
      };
    }

    const paid = txn.status === 'success' || txn.order.paymentStatus === 'paid';
    return {
      paid,
      message: paid ? 'Payment successful' : 'Payment pending or failed',
      orderId: txn.orderId.toString(),
      paymentStatus: txn.order.paymentStatus,
      txnStatus: txn.status,
      invoiceNumber,
    };
  }

  /**
   * IPN is the source of truth for marking orders paid.
   * Always acknowledge with { success: true } so SePay does not retry endlessly.
   */
  async handleIpn(body: Record<string, any>, clientIp?: string) {
    try {
      const allowedIps = (process.env.SEPAY_IPN_WHITELIST || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (allowedIps.length > 0 && clientIp && !allowedIps.includes(clientIp)) {
        this.logger.warn(`SePay IPN rejected from IP: ${clientIp}`);
        return { success: true };
      }

      if (body?.notification_type !== 'ORDER_PAID') {
        return { success: true };
      }

      const orderPayload = body.order || {};
      if (orderPayload.order_status !== 'CAPTURED') {
        return { success: true };
      }

      const invoiceNumber = orderPayload.order_invoice_number as string;
      if (!invoiceNumber) {
        this.logger.warn('SePay IPN missing order_invoice_number');
        return { success: true };
      }

      const txn = await this.prisma.paymentTransaction.findUnique({
        where: { invoiceNumber },
        include: { order: { include: { user: { select: { email: true } } } } },
      });
      if (!txn) {
        this.logger.warn(`SePay IPN transaction not found: ${invoiceNumber}`);
        return { success: true };
      }

      if (txn.status === 'success' || txn.order.paymentStatus === 'paid') {
        return { success: true };
      }

      const ipnAmount = Math.round(Number(orderPayload.order_amount));
      const expectedAmount = Math.round(Number(txn.amount));
      if (expectedAmount !== ipnAmount) {
        this.logger.warn(
          `SePay IPN amount mismatch for ${invoiceNumber}: expected ${expectedAmount}, got ${ipnAmount}`,
        );
        return { success: true };
      }

      const externalTxnId =
        (body.transaction?.id as string) ||
        (body.transaction?.transaction_id as string) ||
        null;
      const paymentDateRaw = body.transaction?.transaction_date as string | undefined;
      const paymentDate = paymentDateRaw ? new Date(paymentDateRaw) : new Date();

      await this.prisma.$transaction([
        this.prisma.paymentTransaction.update({
          where: { id: txn.id },
          data: {
            status: 'success',
            externalTxnId,
            rawResponse: body,
            paymentDate,
          },
        }),
        this.prisma.order.update({
          where: { id: txn.orderId },
          data: { paymentStatus: 'paid' },
        }),
      ]);

      if (txn.order.user?.email) {
        await this.mailService.sendOrderPaid(
          txn.order.user.email,
          txn.orderId.toString(),
          Number(txn.order.totalAmount),
        );
      }
    } catch (err) {
      this.logger.error('SePay IPN processing error', err);
    }

    return { success: true };
  }
}
