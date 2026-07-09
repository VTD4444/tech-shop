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
      order: { id: 1n, paymentStatus: 'paid', user: { email: 'a@b.com' } },
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
});
