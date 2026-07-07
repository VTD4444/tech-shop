import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

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
    passwordResetToken: { deleteMany: jest.fn() },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AdminService);
  });

  it('deleteCustomer blocks self-delete', async () => {
    await expect(service.deleteCustomer('5', '5')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deleteCustomer throws when user is not a customer', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2n, role: 'admin' });
    await expect(service.deleteCustomer('2', '1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resetCustomerPassword throws when customer not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.resetCustomerPassword('9', 'secret12')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
