# syntax=docker/dockerfile:1
# Build the Vite SPA, then serve the static bundle with nginx.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY pnpm-workspace.yaml package.json tsconfig.base.json turbo.json ./
COPY packages/types/package.json packages/types/package.json
COPY packages/engine/package.json packages/engine/package.json
COPY packages/config/package.json packages/config/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --no-frozen-lockfile

COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm --filter @cost-reaper/web build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
