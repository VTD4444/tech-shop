import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

describe('AdminService customers', () => {
  let service: AdminService;
  const prisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    order: { findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: { deleteMany: jest.fn() },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  };
  const ordersService = {
    adminCancelWithStockRestore: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  it('deleteCustomer blocks self-delete', async () => {
    await expect(service.deleteCustomer('5', '5')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deleteCustomer throws when user is not a customer', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2n, role: 'admin', _count: { orders: 0 } });
    await expect(service.deleteCustomer('2', '1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteCustomer soft-deactivates when customer has orders', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 3n,
      role: 'customer',
      _count: { orders: 2 },
    });
    prisma.user.update.mockResolvedValue({});
    const result = await service.deleteCustomer('3', '1');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 3n },
      data: { isActive: false },
    });
    expect(result.message).toContain('vô hiệu hóa');
  });

  it('updateOrderStatus rejects invalid transition', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 10n,
      status: 'pending',
      paymentStatus: 'unpaid',
    });
    await expect(service.updateOrderStatus('10', 'delivered')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updateOrderStatus requires payment before delivered', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 10n,
      status: 'shipping',
      paymentStatus: 'unpaid',
    });
    await expect(service.updateOrderStatus('10', 'delivered')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('resetCustomerPassword throws when customer not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.resetCustomerPassword('9', 'secret12')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
