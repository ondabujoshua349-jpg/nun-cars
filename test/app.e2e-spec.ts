import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as argon from 'argon2';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Prisma } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Boots the real AppModule (guards, pipes, filters, versioning) with the
 * database replaced by an in-memory mock, so it runs without Postgres.
 */
describe('App (e2e)', () => {
  let app: NestExpressApplication;
  let server: App;

  const user = {
    id: '6a1f2c9e-3b4d-4e5f-8a9b-0c1d2e3f4a5b',
    email: 'alex@example.com',
    firstName: 'Alex',
    lastName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const bookmarkId = '0f8e7d6c-5b4a-4392-8a1b-2c3d4e5f6a7b';

  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
    user: { create: jest.fn(), findUnique: jest.fn() },
    bookmark: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(() => app.close());

  it('GET / serves the branded landing page with the port', () =>
    request(server)
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(({ text }) => {
        expect(text).toContain('Developers Mania');
        expect(text).toContain('Nest server is running');
        expect(text).toContain(`port <strong>4000</strong>`);
      }));

  it('serves the logo as a static asset', () =>
    request(server)
      .get('/logo-developers-mania.png')
      .expect(200)
      .expect('Content-Type', 'image/png'));

  it('GET /api/health is public and unversioned', () =>
    request(server)
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      }));

  it('GET /api/health/ready reports 503 when the database is down', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    await request(server).get('/api/health/ready').expect(503);
  });

  it('protects routes by default', () =>
    request(server).get('/api/v1/bookmarks').expect(401));

  it('rejects invalid and unknown body fields', () =>
    request(server)
      .post('/api/v1/auth/signup')
      .send({ email: 'not-an-email', password: 'short', isAdmin: true })
      .expect(400));

  it('signs up without exposing the password hash', async () => {
    prisma.user.create.mockResolvedValueOnce(user);

    const { body } = await request(server)
      .post('/api/v1/auth/signup')
      .send({ email: 'Alex@Example.com ', password: 'Password123!' })
      .expect(201);

    expect(body).not.toHaveProperty('hash');
    expect(prisma.user.create.mock.calls[0][0].data.email).toBe(
      'alex@example.com',
    );
  });

  describe('with a signed-in user', () => {
    let token: string;

    beforeAll(async () => {
      const hash = await argon.hash('Password123!');
      // signIn reads the full row; JwtStrategy reads the public projection.
      prisma.user.findUnique.mockImplementation((args: { select?: unknown }) =>
        args.select ? user : { ...user, hash },
      );

      const { body } = await request(server)
        .post('/api/v1/auth/signin')
        .send({ email: user.email, password: 'Password123!' })
        .expect(200);
      token = body.access_token;
    });

    it('GET /api/v1/users/me returns the current user', () =>
      request(server)
        .get('/api/v1/users/me')
        .auth(token, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(user.id);
          expect(body).not.toHaveProperty('hash');
        }));

    it('GET /api/v1/bookmarks returns a paginated list', () =>
      request(server)
        .get('/api/v1/bookmarks?page=2&limit=5')
        .auth(token, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.meta).toEqual({
            page: 2,
            limit: 5,
            total: 0,
            totalPages: 0,
          });
        }));

    it('rejects a malformed bookmark id', () =>
      request(server)
        .patch('/api/v1/bookmarks/not-a-uuid')
        .auth(token, { type: 'bearer' })
        .send({ title: 'x' })
        .expect(400));

    it('maps Prisma "record not found" to 404', async () => {
      prisma.bookmark.update.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await request(server)
        .patch(`/api/v1/bookmarks/${bookmarkId}`)
        .auth(token, { type: 'bearer' })
        .send({ title: 'Renamed' })
        .expect(404);
    });
  });
});
