import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AiInternalKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = (this.config.get<string>('app.aiInternalApiKey') || '').trim();
    const isProduction = this.config.get<string>('app.nodeEnv') === 'production';

    if (!expected) {
      if (isProduction) {
        throw new UnauthorizedException('AI internal API key is not configured');
      }
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = String(req.headers['x-ai-internal-key'] || '').trim();
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid AI internal API key');
    }
    return true;
  }
}
