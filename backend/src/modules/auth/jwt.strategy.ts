import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.fromCookie]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwt.secret', 'dev-jwt-secret-change-in-production'),
    });
  }

  private static fromCookie(req: Request): string | null {
    if (req.cookies?.access_token) {
      return req.cookies.access_token;
    }
    return null;
  }

  async validate(payload: { sub: string; username: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(payload.sub) },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return {
      id: user.id.toString(),
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      phone: user.phone ?? undefined,
    };
  }
}
