import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  NotFoundException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
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
      update: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('token'),
    verify: jest.fn(),
  };
  const mailService = {
    sendPasswordReset: jest.fn(),
    isConfigured: jest.fn().mockReturnValue(true),
  };
  const configService = {
    get: jest.fn((key: string, defaultVal?: string) => {
      if (key === 'app.frontendUrl') return 'http://localhost:3001';
      if (key === 'app.nodeEnv') return 'test';
      return defaultVal;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: configService },
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

  it('forgotPassword throws when email is not registered', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.forgotPassword('unknown@test.com')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forgotPassword sends reset email for registered active user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1n,
      email: 'user@test.com',
      isActive: true,
    });
    prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValue({});
    mailService.isConfigured.mockReturnValue(true);
    mailService.sendPasswordReset.mockResolvedValue({ ok: true });

    const result = await service.forgotPassword('user@test.com');

    expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
      'user@test.com',
      expect.stringContaining('/reset-password?token='),
    );
    expect(result.message).toContain('Đã gửi liên kết');
  });

  it('forgotPassword throws when mail service is not configured', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1n,
      email: 'user@test.com',
      isActive: true,
    });
    prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValue({});
    mailService.isConfigured.mockReturnValue(false);

    await expect(service.forgotPassword('user@test.com')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('resetPassword throws for invalid token', async () => {
    prisma.passwordResetToken.findFirst.mockResolvedValue(null);
    await expect(service.resetPassword('bad-token', 'newpass1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
