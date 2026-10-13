# syntax=docker/dockerfile:1
# Build context: the repository root.

FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/runner/package.json apps/runner/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @mettle/web --include-workspace-root --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
# The /api rewrite is resolved when the app is built, so the API's address
# inside the Compose network has to be known here.
ARG API_ORIGIN=http://api:4000
ENV API_ORIGIN=$API_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @mettle/web

FROM node:24-alpine
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# The runtime needs Node, not a package manager. Removing npm and yarn also
# removes the libraries bundled inside them, which image scanners report.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx     /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/login || exit 1
CMD ["node", "apps/web/server.js"]
