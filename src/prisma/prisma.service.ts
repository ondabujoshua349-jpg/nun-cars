import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import type { EnvironmentVariables } from '../config/env.validation';

/**
 * Connections are opened lazily by the pg adapter on first query, so the app
 * boots even if the database is down. `/api/health/ready` reports DB status.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
    });
  }

  /** Requires `app.enableShutdownHooks()` (see main.ts) to run on SIGTERM. */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
