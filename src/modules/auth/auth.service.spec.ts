import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon from 'argon2';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: { create: jest.fn(), findUnique: jest.fn() },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('signUp', () => {
    it('stores an argon2 hash, never the plain password', async () => {
      prisma.user.create.mockImplementation(({ data }) => ({
        id: 'u1',
        email: data.email,
      }));

      await service.signUp({ email: 'a@b.co', password: 'supersecret' });

      const { data } = prisma.user.create.mock.calls[0][0];
      expect(data).not.toHaveProperty('password');
      expect(await argon.verify(data.hash, 'supersecret')).toBe(true);
    });

    it('throws ConflictException when the email is taken', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.signUp({ email: 'a@b.co', password: 'supersecret' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('signIn', () => {
    it('returns an access token for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.co',
        hash: await argon.hash('supersecret'),
      });

      await expect(
        service.signIn({ email: 'a@b.co', password: 'supersecret' }),
      ).resolves.toEqual({ access_token: 'signed.jwt.token' });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.co',
      });
    });

    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.signIn({ email: 'a@b.co', password: 'supersecret' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.co',
        hash: await argon.hash('supersecret'),
      });

      await expect(
        service.signIn({ email: 'a@b.co', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
