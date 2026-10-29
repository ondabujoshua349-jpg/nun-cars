import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicUser } from '../../modules/users/users.select';

/**
 * Injects the authenticated user (set by the active auth guard).
 * Pass a field name to get a single property: `@CurrentUser('id') userId: string`.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof PublicUser | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: PublicUser }>();
    return field ? request.user?.[field] : request.user;
  },
);
