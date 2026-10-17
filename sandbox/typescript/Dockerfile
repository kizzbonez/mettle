# Sandbox image for TypeScript labs: Node.js 26 and TypeScript 7 (the native compiler) with the
# Node.js type definitions, nothing else.
FROM node:26-slim

RUN npm install -g --no-fund --no-audit --no-update-notifier "typescript@~7.0" "@types/node@26" \
 && npm cache clean --force \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

# The compiler is written in Go: two scheduler threads are plenty for a lab and stay well
# inside the pids limit.
ENV HOME=/work \
    TMPDIR=/tmp \
    GOMAXPROCS=2 \
    NODE_ENV=production \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
