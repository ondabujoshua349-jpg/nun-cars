import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  // Run onModuleDestroy hooks (e.g. closing DB connections) on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const config = app.get(ConfigService<EnvironmentVariables, true>);
  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');

  Logger.log(`Application is running on ${await app.getUrl()}`, 'Bootstrap');
}

void bootstrap();
