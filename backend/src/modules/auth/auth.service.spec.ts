import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(prisma)),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('token'),
    verify: jest.fn(),
  };
  const mailService = {
    sendPasswordReset: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('login throws for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'secret1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns tokens for valid user', async () => {
    const hash = await bcrypt.hash('secret1', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 1n,
      username: 'tester',
      fullName: 'Tester',
      email: 'a@b.com',
      phone: '0901234567',
      role: 'customer',
      isActive: true,
      passwordHash: hash,
    });
    const result = await service.login({ email: 'a@b.com', password: 'secret1' });
    expect(result.accessToken).toBe('token');
    expect(result.user.fullName).toBe('Tester');
  });

  it('login throws for Google-only users', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1n,
      username: 'tester',
      fullName: 'Tester',
      email: 'a@b.com',
      phone: null,
      role: 'customer',
      isActive: true,
      passwordHash: null,
    });
    await expect(
      service.login({ email: 'a@b.com', password: 'secret1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
