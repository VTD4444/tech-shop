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
  assertSepayCheckoutReady,
  buildInvoiceNumber,
  buildSepayCheckoutDebugInfo,
  getSepayCheckoutUrl,
  probeSepayCheckoutInit,
  resolveSepayCallbackBase,
  resolveSepayPaymentMethod,
  signSepayCheckoutFields,
  stripEnvQuotes,
  isSepayDebugEnabled,
  verifySepayOrderIpnSignature,
  verifySepayWebhookHmac,
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

    const merchantId = stripEnvQuotes(process.env.SEPAY_MERCHANT_ID);
    const secretKey = stripEnvQuotes(process.env.SEPAY_SECRET_KEY);
    if (!merchantId || !secretKey) {
      throw new BadRequestException('SePay is not configured');
    }

    const invoiceNumber = buildInvoiceNumber(orderId);
    const orderAmount = String(Math.round(Number(order.totalAmount)));
    if (Number(orderAmount) <= 0) {
      throw new BadRequestException('Order amount must be greater than 0');
    }

    const successBase = resolveSepayCallbackBase(
      'SEPAY_SUCCESS_URL',
      '/payments/return?status=success',
    );
    const errorBase = resolveSepayCallbackBase(
      'SEPAY_ERROR_URL',
      '/payments/return?status=error',
    );
    const cancelBase = resolveSepayCallbackBase(
      'SEPAY_CANCEL_URL',
      '/payments/return?status=cancel',
    );

    try {
      assertSepayCheckoutReady(merchantId, secretKey, {
        success: successBase,
        error: errorBase,
        cancel: cancelBase,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid SePay configuration';
      this.logger.warn(`SePay config rejected: ${message}`);
      throw new BadRequestException(message);
    }

    const paymentMethod = resolveSepayPaymentMethod();

    const fields: Record<string, string> = {
      merchant: merchantId,
      currency: 'VND',
      order_amount: orderAmount,
      operation: 'PURCHASE',
      order_description: `Thanh toan don hang #${orderId}`,
      order_invoice_number: invoiceNumber,
      customer_id: `CUST_${userId}`,
      success_url: successBase,
      error_url: errorBase,
      cancel_url: cancelBase,
    };

    if (paymentMethod) {
      fields.payment_method = paymentMethod;
    }

    fields.signature = signSepayCheckoutFields(fields, secretKey);

    const debugInfo = buildSepayCheckoutDebugInfo(fields, secretKey);
    this.logger.log(
      `SePay checkout init orderId=${orderId} invoice=${invoiceNumber} ${JSON.stringify(debugInfo)}`,
    );

    if (isSepayDebugEnabled()) {
      try {
        const probe = await probeSepayCheckoutInit(fields);
        this.logger.warn(`SePay probe result: ${JSON.stringify(probe)}`);
        Object.assign(debugInfo, { probe });
      } catch (err) {
        this.logger.warn(
          `SePay probe failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

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
      ...(process.env.SEPAY_DEBUG === 'true' || process.env.SEPAY_DEBUG === '1'
        ? { debug: debugInfo }
        : {}),
    };
  }

  /** User left SePay without paying — release processing txn so they can retry. */
  async abandonCheckout(userId: string, invoiceNumber: string) {
    if (!invoiceNumber) {
      return { abandoned: false, orderId: '', txnStatus: '' };
    }

    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { invoiceNumber },
      include: { order: { select: { userId: true } } },
    });
    if (!txn || txn.status !== 'processing') {
      return {
        abandoned: false,
        orderId: txn?.orderId.toString() ?? '',
        txnStatus: txn?.status ?? '',
      };
    }

    if (txn.order.userId?.toString() !== userId) {
      throw new BadRequestException('Not authorized to abandon this checkout');
    }

    await this.prisma.paymentTransaction.update({
      where: { id: txn.id },
      data: { status: 'failed' },
    });

    return {
      abandoned: true,
      orderId: txn.orderId.toString(),
      txnStatus: 'failed',
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
   * Returns { success: false } on verification/amount failures so SePay may retry when appropriate.
   */
  async handleIpn(
    body: Record<string, any>,
    clientIp?: string,
    meta?: { rawBody?: string; signature?: string; timestamp?: string },
  ) {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const secretKey =
        stripEnvQuotes(process.env.SEPAY_WEBHOOK_SECRET) ||
        stripEnvQuotes(process.env.SEPAY_SECRET_KEY);

      const allowedIps = (process.env.SEPAY_IPN_WHITELIST || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (isProduction && allowedIps.length === 0) {
        this.logger.error('SEPAY_IPN_WHITELIST is required in production');
        return { success: false };
      }

      if (allowedIps.length > 0 && clientIp && !allowedIps.includes(clientIp)) {
        this.logger.warn(`SePay IPN rejected from IP: ${clientIp}`);
        return { success: false };
      }

      const headerVerified =
        meta?.rawBody &&
        meta.signature &&
        meta.timestamp &&
        secretKey &&
        verifySepayWebhookHmac(meta.rawBody, meta.signature, meta.timestamp, secretKey);

      const orderSignatureVerified =
        secretKey && verifySepayOrderIpnSignature(body, secretKey);

      if (isProduction && !headerVerified && !orderSignatureVerified) {
        this.logger.warn('SePay IPN signature verification failed');
        return { success: false };
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
        return { success: false };
      }

      const txn = await this.prisma.paymentTransaction.findUnique({
        where: { invoiceNumber },
        include: { order: { include: { user: { select: { email: true } } } } },
      });
      if (!txn) {
        this.logger.warn(`SePay IPN transaction not found: ${invoiceNumber}`);
        return { success: false };
      }

      if (txn.status === 'success' || txn.order.paymentStatus === 'paid') {
        return { success: true };
      }

      if (txn.order.status === 'cancelled') {
        this.logger.warn(
          `SePay IPN received for cancelled order ${txn.orderId} — manual review required`,
        );
        return { success: true };
      }

      const ipnAmount = Math.round(Number(orderPayload.order_amount));
      const expectedAmount = Math.round(Number(txn.amount));
      if (expectedAmount !== ipnAmount) {
        this.logger.warn(
          `SePay IPN amount mismatch for ${invoiceNumber}: expected ${expectedAmount}, got ${ipnAmount}`,
        );
        await this.prisma.paymentTransaction.update({
          where: { id: txn.id },
          data: { status: 'failed', rawResponse: body },
        });
        return { success: false };
      }

      const externalTxnId =
        (body.transaction?.id as string) ||
        (body.transaction?.transaction_id as string) ||
        null;
      const paymentDateRaw = body.transaction?.transaction_date as string | undefined;
      const paymentDate = paymentDateRaw ? new Date(paymentDateRaw) : new Date();

      // Paid online → auto-confirm so admin does not need a manual pending→confirmed step.
      const orderUpdate: { paymentStatus: string; status?: string } = {
        paymentStatus: 'paid',
      };
      if (txn.order.status === 'pending') {
        orderUpdate.status = 'confirmed';
      }

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
          data: orderUpdate,
        }),
      ]);

      if (txn.order.user?.email) {
        await this.mailService.sendOrderPaid(
          txn.order.user.email,
          txn.orderId.toString(),
          Number(txn.order.totalAmount),
        );
      }

      return { success: true };
    } catch (err) {
      this.logger.error('SePay IPN processing error', err);
      return { success: false };
    }
  }
}
