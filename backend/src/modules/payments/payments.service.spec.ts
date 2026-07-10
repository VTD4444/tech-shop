import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const prisma = {
    paymentTransaction: { findUnique: jest.fn(), update: jest.fn() },
    order: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  const mailService = { sendOrderPaid: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();
    service = module.get(PaymentsService);
  });

  it('handleIpn ignores non ORDER_PAID notifications', async () => {
    const result = await service.handleIpn({ notification_type: 'OTHER' }, '127.0.0.1');
    expect(result).toEqual({ success: true });
    expect(prisma.paymentTransaction.findUnique).not.toHaveBeenCalled();
  });

  it('handleIpn rejects amount mismatch', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 1n,
      status: 'processing',
      amount: 100000,
      orderId: 1n,
      order: { id: 1n, paymentStatus: 'unpaid', status: 'pending', user: { email: null } },
    });
    prisma.paymentTransaction.update.mockResolvedValue({});

    const result = await service.handleIpn(
      {
        notification_type: 'ORDER_PAID',
        order: {
          order_status: 'CAPTURED',
          order_invoice_number: 'INV-1',
          order_amount: 1,
        },
      },
      '127.0.0.1',
    );

    expect(result).toEqual({ success: false });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('handleIpn skips cancelled orders', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 1n,
      status: 'processing',
      amount: 100000,
      orderId: 1n,
      order: { id: 1n, paymentStatus: 'unpaid', status: 'cancelled', user: { email: null } },
    });

    const result = await service.handleIpn(
      {
        notification_type: 'ORDER_PAID',
        order: {
          order_status: 'CAPTURED',
          order_invoice_number: 'INV-1',
          order_amount: 100000,
        },
      },
      '127.0.0.1',
    );

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('handleIpn is idempotent when payment already success', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 1n,
      status: 'success',
      amount: 100000,
      order: { id: 1n, paymentStatus: 'paid', status: 'confirmed', user: { email: 'a@b.com' } },
    });

    const result = await service.handleIpn(
      {
        notification_type: 'ORDER_PAID',
        order: { order_status: 'CAPTURED', order_invoice_number: 'INV-1', order_amount: 100000 },
      },
      '127.0.0.1',
    );

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('handleIpn marks paid and auto-confirms pending orders', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      id: 1n,
      status: 'processing',
      amount: 100000,
      orderId: 1n,
      order: {
        id: 1n,
        paymentStatus: 'unpaid',
        status: 'pending',
        totalAmount: 100000,
        user: { email: 'a@b.com' },
      },
    });
    prisma.$transaction.mockResolvedValue([{}, {}]);
    mailService.sendOrderPaid.mockResolvedValue(undefined);

    const result = await service.handleIpn(
      {
        notification_type: 'ORDER_PAID',
        order: {
          order_status: 'CAPTURED',
          order_invoice_number: 'INV-1',
          order_amount: 100000,
        },
        transaction: { id: 'tx-1', transaction_date: '2026-07-10T10:00:00Z' },
      },
      '127.0.0.1',
    );

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalled();
    const ops = prisma.$transaction.mock.calls[0][0];
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { paymentStatus: 'paid', status: 'confirmed' },
    });
    expect(mailService.sendOrderPaid).toHaveBeenCalledWith('a@b.com', '1', 100000);
    expect(ops).toHaveLength(2);
  });
});
