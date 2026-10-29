import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'tsx prisma/seed/seed.ts',
  },
  datasource: {
    // Not using `env()` here: it throws when the variable is missing, which
    // would break `prisma generate` (postinstall) in CI and Docker builds where
    // no database is configured. Commands that need a DB will still fail loudly.
    url: process.env.DATABASE_URL ?? '',
  },
});
