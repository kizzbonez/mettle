# Sandbox image for Linux and shell labs: a small Debian with the usual text tools,
# archive tools, ShellCheck for the labs about writing scripts well, and OpenSSL for the
# security labs on certificates, hashing and encryption.
FROM debian:bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends gawk jq procps file bc xz-utils zip unzip bsdextrautils tree shellcheck openssl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

ENV HOME=/work \
    TMPDIR=/tmp \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
