# syntax=docker/dockerfile:1
# Multi-stage build for the cost-reaper API in a pnpm + Turborepo monorepo.
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# ---- deps: install the whole workspace from manifests (good layer caching) ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json tsconfig.base.json turbo.json ./
COPY packages/types/package.json packages/types/package.json
COPY packages/engine/package.json packages/engine/package.json
COPY packages/config/package.json packages/config/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --no-frozen-lockfile

# ---- build: shared packages → prisma client → API ----
FROM deps AS build
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @cost-reaper/types build \
 && pnpm --filter @cost-reaper/engine build \
 && pnpm --filter @cost-reaper/api exec prisma generate \
 && pnpm --filter @cost-reaper/api build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 8000
# Schema provisioning + seeding are owned by scripts/setup.sh & scripts/migrate.sh
# (run before start). The container just runs the API.
CMD ["node", "dist/main.js"]
