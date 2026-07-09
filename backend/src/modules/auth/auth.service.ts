import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private config: ConfigService,
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
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          username,
          fullName: dto.fullName.trim(),
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone.trim(),
          passwordHash,
          authProvider: 'local',
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Email or phone number already exists');
      }
      throw err;
    }

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

  createGoogleExchangeCode(userId: string): string {
    return this.jwtService.sign(
      { type: 'google_exchange', sub: userId },
      {
        secret: this.config.get<string>('app.jwt.secret')!,
        expiresIn: '2m',
      },
    );
  }

  async completeGoogleExchange(code: string) {
    let payload: { type?: string; sub?: string };
    try {
      payload = this.jwtService.verify(code, {
        secret: this.config.get<string>('app.jwt.secret')!,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired Google login code');
    }

    if (payload.type !== 'google_exchange' || !payload.sub) {
      throw new UnauthorizedException('Invalid Google login code');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(payload.sub) },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('app.jwt.refreshSecret')!,
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
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (!user) {
      return {
        message:
          'Nếu email đã đăng ký, bạn sẽ nhận liên kết đặt lại mật khẩu trong vài phút.',
      };
    }
    if (!user.isActive) {
      throw new BadRequestException('Tài khoản đã bị vô hiệu hóa');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const frontend = this.config.get<string>('app.frontendUrl', 'http://localhost:3001');
    const resetUrl = `${frontend}/reset-password?token=${rawToken}`;

    if (!this.mailService.isConfigured()) {
      this.logger.error(
        'Password reset email skipped — RESEND_API_KEY or MAIL_FROM not configured',
      );
      if (this.config.get<string>('app.nodeEnv') === 'development') {
        this.logger.warn(`[DEV] Password reset link for ${user.email}: ${resetUrl}`);
      }
      throw new ServiceUnavailableException(
        'Không thể gửi email đặt lại mật khẩu. Hệ thống email chưa được cấu hình trên máy chủ.',
      );
    }

    const sendResult = await this.mailService.sendPasswordReset(user.email, resetUrl);
    if (!sendResult.ok) {
      if (
        this.config.get<string>('app.nodeEnv') === 'development' &&
        MailService.isSandboxRestriction(sendResult.error)
      ) {
        this.logger.warn(
          `[DEV] Resend sandbox — chỉ gửi được tới email chủ tài khoản Resend. Link reset: ${resetUrl}`,
        );
        return {
          message:
            'Đã gửi liên kết đặt lại mật khẩu đến email của bạn (dev: xem link trong log server)',
        };
      }

      this.logger.error(
        `Password reset email failed for user ${user.id} (${user.email}): ${sendResult.error}`,
      );

      if (MailService.isSandboxRestriction(sendResult.error)) {
        throw new ServiceUnavailableException(
          'Không thể gửi email: Resend đang ở chế độ thử nghiệm. Hãy verify domain trên resend.com/domains và cập nhật MAIL_FROM.',
        );
      }

      throw new InternalServerErrorException(
        'Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
      );
    }

    this.logger.log(`Password reset email sent to ${user.email}`);
    return { message: 'Đã gửi liên kết đặt lại mật khẩu đến email của bạn' };
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
      secret: this.config.get<string>('app.jwt.secret')!,
      expiresIn: (this.config.get<string>('app.jwt.expiresIn') || '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('app.jwt.refreshSecret')!,
      expiresIn: (this.config.get<string>('app.jwt.refreshExpiresIn') || '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
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
