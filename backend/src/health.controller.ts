import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './modules/prisma/prisma.service';
import { RedisService } from './modules/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check() {
    let database: 'connected' | 'disconnected' = 'disconnected';
    let dbError: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch (err) {
      dbError = err instanceof Error ? err.message : 'Unknown error';
    }

    const redisConfigured = Boolean(process.env.REDIS_URL);
    const redisConnected = redisConfigured ? await this.redis.ping() : false;

    const status =
      database === 'connected' && (!redisConfigured || redisConnected) ? 'ok' : 'degraded';

    return {
      status,
      database,
      databaseUrl: maskDatabaseUrl(process.env.DATABASE_URL),
      redis: redisConfigured
        ? redisConnected
          ? 'connected'
          : 'disconnected'
        : 'not_configured',
      ...(dbError && {
        hint: 'Start Postgres: docker start techshop-db (WSL) or docker compose up -d postgres',
        message: dbError,
      }),
      ...(!redisConnected &&
        redisConfigured && {
          redisHint: 'Start Redis: docker compose up -d redis',
        }),
    };
  }
}

function maskDatabaseUrl(url?: string) {
  if (!url) return '(DATABASE_URL not set — check backend/.env)';
  return url.replace(/:([^:@/]+)@/, ':***@');
}
