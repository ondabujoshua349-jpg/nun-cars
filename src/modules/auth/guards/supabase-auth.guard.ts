import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * Alternative to the built-in JWT auth for routes that accept Supabase access
 * tokens. Because the JWT guard is global, combine it with `@Public()`:
 *
 *   @Public()
 *   @UseGuards(SupabaseAuthGuard)
 *   @Get('something')
 *
 * Note: `request.user` is then a Supabase `User`, not a local `PublicUser`.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    const {
      data: { user },
      error,
    } = await this.supabase.getAdminClient().auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException();
    }

    request.user = user;
    return true;
  }
}
