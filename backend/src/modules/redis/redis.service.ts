import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';

const PRODUCTS_CACHE_VERSION_KEY = 'products:cache:version';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private connected = false;

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set — product search cache disabled');
      return;
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });

    try {
      await this.client.connect();
      await this.client.ping();
      this.connected = true;
      this.client.on('error', (err) => {
        this.connected = false;
        this.logger.warn(`Redis error: ${err.message}`);
      });
      this.logger.log('Redis connected');
    } catch (err) {
      this.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Redis unavailable, falling back to database: ${msg}. Start with: docker compose up -d redis`,
      );
      await this.client.quit().catch(() => this.client?.disconnect());
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  isAvailable(): boolean {
    return this.connected && this.client !== null;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.ping();
      this.connected = result === 'PONG';
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable() || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Redis GET failed for ${key}: ${err}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable() || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Redis SET failed for ${key}: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable() || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Redis DEL failed for ${key}: ${err}`);
    }
  }

  async getProductsCacheVersion(): Promise<number> {
    if (!this.isAvailable() || !this.client) return 0;
    try {
      const version = await this.client.get(PRODUCTS_CACHE_VERSION_KEY);
      return version ? parseInt(version, 10) : 1;
    } catch {
      return 0;
    }
  }

  async bumpProductsCacheVersion(): Promise<void> {
    if (!this.isAvailable() || !this.client) return;
    try {
      await this.client.incr(PRODUCTS_CACHE_VERSION_KEY);
    } catch (err) {
      this.logger.warn(`Failed to bump products cache version: ${err}`);
    }
  }

  buildProductsListKey(version: number, query: Record<string, unknown>): string {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(query).sort()) {
      const value = query[key];
      if (value !== undefined && value !== null && value !== '') {
        normalized[key] = value;
      }
    }
    const hash = createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .slice(0, 16);
    return `products:v${version}:list:${hash}`;
  }
}
