import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../users/users.select';
import { SignInDto, SignUpDto } from './dto';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signUp({ password, ...profile }: SignUpDto) {
    const hash = await argon.hash(password);

    try {
      return await this.prisma.user.create({
        data: { ...profile, hash },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async signIn({ email, password }: SignInDto) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same error for unknown email and wrong password, to avoid account enumeration.
    if (!user || !(await argon.verify(user.hash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken({ sub: user.id, email: user.email });
  }

  private async signToken(payload: JwtPayload) {
    return { access_token: await this.jwt.signAsync(payload) };
  }
}
