# Nest API Template

A production-ready REST API starter built on **NestJS 12**, **Prisma 7** and **PostgreSQL**.

- JWT authentication (argon2 password hashing), **secure by default**: every route requires a token unless marked `@Public()`
- Validated, typed configuration: the app refuses to start with missing or invalid env vars
- URI versioning (`/api/v1/...`), request validation, central Prisma → HTTP error mapping
- Helmet security headers, CORS allow-list, rate limiting (stricter on auth routes)
- Liveness/readiness probes, graceful shutdown
- OpenAPI docs at `/docs` (generated from DTOs by the Swagger CLI plugin)
- Unit + e2e tests (e2e run without a database), oxlint, Prettier, GitHub Actions CI
- Multi-stage Dockerfile (dev / migrate / production, non-root)
- Optional Supabase auth guard

## Requirements

- Node.js `^22.22.3` or `>=24.15.0`
- Docker (for the local PostgreSQL)

## Getting started

```bash
cp .env.example .env          # then set JWT_SECRET
npm install                   # also generates the Prisma client
npm run db:up                 # start PostgreSQL in Docker
npm run prisma:deploy         # apply migrations
npm run prisma:seed           # optional: demo users (password: Password123!)
npm run start:dev
```

- Landing page: http://localhost:4000
- API: http://localhost:4000/api/v1
- Docs: http://localhost:4000/docs
- Health: http://localhost:4000/api/health

Or run everything in Docker: `docker compose --profile app up --build`.

## Project structure

```
src/
├── main.ts                 # bootstrap: listen, shutdown hooks
├── app.module.ts           # root module: config, rate limiting, global filter
├── app.setup.ts            # HTTP setup shared with e2e tests (prefix, CORS, pipes, Swagger)
├── config/
│   └── env.validation.ts   # environment schema — add new variables here
├── common/                 # cross-cutting building blocks
│   ├── decorators/         # @Public(), @CurrentUser()
│   ├── dto/                # PaginationQueryDto
│   └── filters/            # PrismaExceptionFilter
├── prisma/                 # PrismaService (global)
├── generated/prisma/       # generated client (git-ignored)
└── modules/
    ├── auth/               # signup/signin, JWT strategy, global JWT guard, Supabase guard
    ├── users/              # /users/me, safe user projection
    ├── bookmarks/          # example CRUD resource, scoped to the current user
    ├── health/             # /health, /health/ready
    ├── landing/            # branded root page (GET /)
    └── supabase/           # optional Supabase admin client
public/                     # static assets — swap logo-developers-mania.png to rebrand
prisma/
├── schema.prisma
├── migrations/
└── seed/seed.ts
test/                       # e2e tests
```

### Adding a feature module

```bash
npx nest g resource modules/<name> --no-spec
```

Then:

- Put DTOs in `modules/<name>/dto/` with `class-validator` decorators. They're validated automatically and appear in the Swagger docs.
- Inject `PrismaService` directly; it's global.
- Scope queries to `@CurrentUser('id')` for user-owned data.
- Let Prisma errors propagate. `P2002`/`P2003` → 409 and `P2025` → 404 are handled globally.
- Mark routes that must not require auth with `@Public()`.

## API overview

| Method | Path                         | Auth   | Description                         |
| ------ | ---------------------------- | ------ | ----------------------------------- |
| POST   | `/api/v1/auth/signup`        | public | Create an account                   |
| POST   | `/api/v1/auth/signin`        | public | Get an `access_token`               |
| GET    | `/api/v1/users/me`           | bearer | Current user                        |
| GET    | `/api/v1/bookmarks`          | bearer | List own bookmarks (`?page&limit`)  |
| GET    | `/api/v1/bookmarks/:id`      | bearer | Get one                             |
| POST   | `/api/v1/bookmarks`          | bearer | Create                              |
| PATCH  | `/api/v1/bookmarks/:id`      | bearer | Update                              |
| DELETE | `/api/v1/bookmarks/:id`      | bearer | Delete (204)                        |
| GET    | `/`                          | public | Branded landing page (shows port)   |
| GET    | `/api/health`                | public | Liveness                            |
| GET    | `/api/health/ready`          | public | Readiness (checks the database)     |

## Configuration

All variables are documented in [.env.example](.env.example) and validated in [src/config/env.validation.ts](src/config/env.validation.ts). Read them through `ConfigService<EnvironmentVariables, true>` with `{ infer: true }` for typed access.

## Database

| Task                           | Command                                       |
| ------------------------------ | --------------------------------------------- |
| Create a migration (dev)       | `npm run prisma:migrate -- --name <change>`   |
| Apply migrations (CI/prod)     | `npm run prisma:deploy`                       |
| Regenerate the client          | `npm run prisma:generate`                     |
| Seed (refuses in production)   | `npm run prisma:seed`                         |
| Browse data                    | `npm run prisma:studio`                       |
| Reset local DB                 | `npm run db:reset`                            |

## Quality

```bash
npm run lint          # oxlint (type-aware)
npm run format        # prettier
npm run typecheck
npm test              # unit tests
npm run test:e2e      # e2e (mocked database, no Postgres needed)
npm run test:cov
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all of the above, then builds the production Docker image.

## Deployment

```bash
docker build --target production -t nest-api .
docker build --target migrate -t nest-api-migrate .

# Run migrations as a one-off job before rolling out the new version
docker run --rm -e DATABASE_URL=... nest-api-migrate
docker run -p 4000:4000 --env-file .env.production nest-api
```

Production checklist:

- `NODE_ENV=production`
- `JWT_SECRET` set to a random value of ≥ 32 characters (enforced)
- `CORS_ORIGINS` set to your front-end origins (cross-origin is denied otherwise)
- `TRUST_PROXY=true` if you run behind a load balancer (needed for correct rate limiting)
- Swagger is off by default in production (`SWAGGER_ENABLED=true` to override)
- Point readiness probes at `/api/health/ready` and liveness probes at `/api/health`
