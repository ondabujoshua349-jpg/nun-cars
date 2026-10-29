import { Controller, Get, Header, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators';
import {
  type EnvironmentVariables,
  isSwaggerEnabled,
} from '../../config/env.validation';
import { renderLandingPage } from './landing.page';

/** Branded page at `/` (excluded from the /api prefix in app.setup.ts). */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller({ version: VERSION_NEUTRAL })
export class LandingController {
  private readonly html: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    // Config is fixed for the life of the process, so render once.
    this.html = renderLandingPage({
      port: config.get('PORT', { infer: true }),
      docsEnabled: isSwaggerEnabled(config),
    });
  }

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  index() {
    return this.html;
  }
}
