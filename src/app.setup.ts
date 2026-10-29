import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'node:path';
import {
  Environment,
  type EnvironmentVariables,
  isSwaggerEnabled,
} from './config/env.validation';

/** Static assets (logo, favicon). Resolves to <repo>/public from both src/ and dist/. */
export const PUBLIC_DIR = join(__dirname, '..', 'public');

/**
 * HTTP-level setup shared by main.ts and the e2e tests, so tests exercise
 * the same prefix, versioning, validation and security middleware as prod.
 */
export function configureApp(app: NestExpressApplication) {
  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const isProduction =
    config.get('NODE_ENV', { infer: true }) === Environment.Production;

  if (config.get('TRUST_PROXY', { infer: true })) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());

  const origins = (config.get('CORS_ORIGINS', { infer: true }) ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    // No explicit list: reflect any origin in dev, deny cross-origin in prod.
    origin: origins.length > 0 ? origins : !isProduction,
    credentials: true,
  });

  app.useStaticAssets(PUBLIC_DIR, { index: false, maxAge: '1d' });

  // Routes are served as /api/v1/...; health probes stay at /api/health.
  // The branded landing page lives at the root, outside the API prefix.
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (isSwaggerEnabled(config)) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Nest API')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
