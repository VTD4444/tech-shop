import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        '\n[Prisma] Cannot connect to PostgreSQL.',
        `\n  DATABASE_URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@/]+)@/, ':***@') : '(not set — add backend/.env)'}`,
        `\n  Error: ${msg}`,
        '\n  Fix: start DB → docker start techshop-db (WSL) or docker compose up -d postgres\n',
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
