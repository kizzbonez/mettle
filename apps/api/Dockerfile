# syntax=docker/dockerfile:1
# Build context: the repository root.

FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/runner/package.json apps/runner/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @mettle/api --include-workspace-root --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @mettle/api

FROM node:24-alpine
ENV NODE_ENV=production \
    MIGRATIONS_DIR=/app/migrations \
    CONTENT_DIR=/app/content
# The runtime needs Node, not a package manager. Removing npm and yarn also
# removes the libraries bundled inside them, which image scanners report.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx     /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
WORKDIR /app
COPY --from=build /repo/apps/api/dist/server.cjs ./server.cjs
COPY apps/api/migrations ./migrations
COPY content ./content
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO /dev/null http://127.0.0.1:4000/v1/health || exit 1
CMD ["node", "server.cjs"]
