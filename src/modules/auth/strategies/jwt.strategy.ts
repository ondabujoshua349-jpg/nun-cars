import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvironmentVariables } from '../../../config/env.validation';
import { PrismaService } from '../../../prisma/prisma.service';
import { publicUserSelect, type PublicUser } from '../../users/users.select';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  /** The return value is attached to `request.user`. */
  async validate(payload: JwtPayload): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });
    // Token is valid but the user has since been deleted.
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
