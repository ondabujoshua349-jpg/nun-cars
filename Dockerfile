# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# ---- Base -------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
# openssl is required by the Prisma schema engine (migrations)
RUN apk add --no-cache openssl

# ---- Dependencies (all, incl. dev) -----------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
# Needed by the postinstall `prisma generate`
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---- Development (hot reload; mount ./src as a volume) ---------------------
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# ---- Migrate (one-off job: `prisma migrate deploy`) -------------------------
FROM deps AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- Build ------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN npm run build \
 && npm prune --omit=dev

# ---- Production -------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
COPY --from=build --chown=node:node /usr/src/app/package.json ./
COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist
COPY --from=build --chown=node:node /usr/src/app/public ./public
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/api/health" > /dev/null || exit 1
CMD ["node", "dist/main.js"]
