import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Profile } from 'passport-google-oauth20';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

type SessionUser = {
  id: bigint;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });
    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Phone number already exists');
    }

    const username = await this.generateUniqueUsername(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        passwordHash,
        authProvider: 'local',
      },
    });

    return this.issueSession(user);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in with Google');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user);
  }

  async findOrCreateGoogleUser(profile: Profile): Promise<SessionUser> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Google account has no email');
    }

    const fullName =
      profile.displayName?.trim() ||
      [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ').trim() ||
      email.split('@')[0];

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
    } else {
      const username = await this.generateUniqueUsername(email);
      user = await this.prisma.user.create({
        data: {
          username,
          fullName,
          email,
          googleId,
          authProvider: 'google',
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }

  issueSession(user: SessionUser) {
    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      });
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(payload.sub) },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.issueSession(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return { message: 'If the email exists, a reset link was sent' };
    }
    if (!user.passwordHash) {
      return { message: 'If the email exists, a reset link was sent' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3001';
    await this.mailService.sendPasswordReset(
      user.email,
      `${frontend}/reset-password?token=${rawToken}`,
    );
    return { message: 'If the email exists, a reset link was sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, authProvider: record.user.authProvider === 'google' ? 'local' : record.user.authProvider },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);
    return { message: 'Password updated successfully' };
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 40) || 'user';

    let candidate = base;
    let suffix = 0;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      suffix += 1;
      candidate = `${base}${suffix}`;
    }
    return candidate;
  }

  private generateTokens(user: SessionUser) {
    const payload = {
      sub: user.id.toString(),
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'default-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? undefined,
        role: user.role,
      },
    };
  }
}
