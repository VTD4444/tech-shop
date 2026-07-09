import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('OrdersService', () => {
  let service: OrdersService;
  const prisma = {
    userAddress: { findFirst: jest.fn() },
    cartItem: { findMany: jest.fn() },
    $transaction: jest.fn(),
    user: { findUnique: jest.fn() },
  };
  const mailService = { sendOrderCreated: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('checkout throws when shipping address not found', async () => {
    prisma.userAddress.findFirst.mockResolvedValue(null);
    await expect(
      service.checkout('1', { shippingAddressId: '99' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('checkout throws when cart is empty', async () => {
    prisma.userAddress.findFirst.mockResolvedValue({
      id: 1n,
      receiverName: 'A',
      phone: '0901234567',
      addressLine: '123 Street',
      ward: 'W',
      district: 'D',
      city: 'C',
    });
    prisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<unknown>) =>
      cb({
        cartItem: { findMany: jest.fn().mockResolvedValue([]) },
      }),
    );
    await expect(
      service.checkout('1', { shippingAddressId: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
