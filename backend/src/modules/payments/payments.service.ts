import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as qs from 'qs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  verifyVnpaySignature,
  signVnpayParams,
  getVnpayPaymentUrl,
} from '../../common/utils/vnpay.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createPaymentUrl(userId: string, orderId: string, ipAddr: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: BigInt(orderId), userId: BigInt(userId) },
      include: { user: { select: { email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const tmnCode = process.env.VNPAY_TMN_CODE || '';
    const secretKey = process.env.VNPAY_HASH_SECRET || '';
    const vnpUrl = getVnpayPaymentUrl();
    const returnUrl =
      process.env.VNPAY_RETURN_URL || 'http://localhost:3001/vnpay/return';

    const date = new Date();
    const txnRef = `${Date.now()}_${orderId}`;
    const createDate = date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(Number(order.totalAmount) * 100)),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    params.vnp_SecureHash = signVnpayParams(params, secretKey);

    await this.prisma.vnpayTransaction.create({
      data: {
        orderId: BigInt(orderId),
        vnpayTxnRef: txnRef,
        amount: order.totalAmount,
        status: 'processing',
      },
    });

    const queryString = qs.stringify(params, { encode: true });
    return { paymentUrl: `${vnpUrl}?${queryString}`, txnRef };
  }

  /** Read-only: verify signature and return current payment status from DB */
  async handleReturn(query: Record<string, any>) {
    const secretKey = process.env.VNPAY_HASH_SECRET || '';
    const { valid } = verifyVnpaySignature(query, secretKey);
    if (!valid) {
      return { success: false, message: 'Invalid signature' };
    }

    const txnRef = query.vnp_TxnRef as string;
    const responseCode = query.vnp_ResponseCode as string;
    const txn = await this.prisma.vnpayTransaction.findUnique({
      where: { vnpayTxnRef: txnRef },
      include: { order: true },
    });
    if (!txn) {
      return { success: false, message: 'Transaction not found' };
    }

    const paid =
      txn.status === 'success' ||
      (txn.order.paymentStatus === 'paid' && responseCode === '00');

    return {
      success: paid,
      message: paid ? 'Payment successful' : 'Payment pending or failed',
      orderId: txn.orderId.toString(),
      txnRef,
      responseCode,
      paymentStatus: txn.order.paymentStatus,
      txnStatus: txn.status,
    };
  }

  async getReturnStatus(txnRef: string) {
    const txn = await this.prisma.vnpayTransaction.findUnique({
      where: { vnpayTxnRef: txnRef },
      include: { order: true },
    });
    if (!txn) {
      return { success: false, message: 'Transaction not found' };
    }
    const paid = txn.status === 'success' || txn.order.paymentStatus === 'paid';
    return {
      success: paid,
      message: paid ? 'Payment successful' : 'Payment pending or failed',
      orderId: txn.orderId.toString(),
      paymentStatus: txn.order.paymentStatus,
      txnStatus: txn.status,
    };
  }

  /** IPN is the source of truth for marking orders paid */
  async handleIpn(query: Record<string, any>) {
    const secretKey = process.env.VNPAY_HASH_SECRET || '';
    const rawResponse = { ...query };
    const { valid } = verifyVnpaySignature(query, secretKey);

    if (!valid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const allowedIps = (process.env.VNPAY_IPN_WHITELIST || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowedIps.length > 0 && query.clientIp && !allowedIps.includes(String(query.clientIp))) {
      this.logger.warn(`IPN rejected from IP: ${query.clientIp}`);
      return { RspCode: '97', Message: 'Invalid IP' };
    }

    const txnRef = query.vnp_TxnRef as string;
    const responseCode = query.vnp_ResponseCode as string;
    const amount = Number(query.vnp_Amount) / 100;
    const secureHash = query.vnp_SecureHash as string;

    const txn = await this.prisma.vnpayTransaction.findUnique({
      where: { vnpayTxnRef: txnRef },
      include: { order: { include: { user: { select: { email: true } } } } },
    });
    if (!txn) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (txn.status !== 'processing') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (Number(txn.amount) !== amount) {
      return { RspCode: '04', Message: 'Amount mismatch' };
    }

    if (responseCode === '00') {
      await this.prisma.$transaction([
        this.prisma.vnpayTransaction.update({
          where: { id: txn.id },
          data: {
            status: 'success',
            responseCode,
            secureHash,
            rawResponse,
            vnpayTransactionNo: query.vnp_TransactionNo as string,
            bankCode: query.vnp_BankCode as string,
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

      return { RspCode: '00', Message: 'Confirm success' };
    }

    await this.prisma.vnpayTransaction.update({
      where: { id: txn.id },
      data: {
        status: 'failed',
        responseCode,
        secureHash,
        rawResponse,
      },
    });
    return { RspCode: '99', Message: 'Payment failed' };
  }
}
