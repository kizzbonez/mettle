# Sandbox image for Solidity labs: Foundry's forge, the Solidity compiler pinned by checksum, and
# the forge-std and OpenZeppelin Contracts libraries. Contracts run on forge's own local EVM, so
# nothing here ever needs the network or a blockchain.
FROM ghcr.io/foundry-rs/foundry:v1.8.6 AS foundry

FROM debian:trixie-slim AS fetch
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
ARG SOLC_VERSION=0.8.38
ARG SOLC_BUILD=solc-linux-amd64-v0.8.38+commit.1835d247
ARG SOLC_SHA256=65c3180a336eabb6bdc4bbd49cc405aeb233976964ae6c11fba2a6c8be8f3243
ARG FORGE_STD=1.17.0
ARG OPENZEPPELIN=5.7.0
RUN mkdir -p /out/solc /out/libs \
 && curl -fsSL -o /out/solc/solc-${SOLC_VERSION} "https://binaries.soliditylang.org/linux-amd64/${SOLC_BUILD}" \
 && echo "${SOLC_SHA256}  /out/solc/solc-${SOLC_VERSION}" | sha256sum -c - \
 && chmod 0755 /out/solc/solc-${SOLC_VERSION} \
 && curl -fsSL "https://github.com/foundry-rs/forge-std/archive/refs/tags/v${FORGE_STD}.tar.gz" | tar -xz -C /out/libs \
 && mv /out/libs/forge-std-${FORGE_STD} /out/libs/forge-std \
 && curl -fsSL "https://github.com/OpenZeppelin/openzeppelin-contracts/archive/refs/tags/v${OPENZEPPELIN}.tar.gz" | tar -xz -C /out/libs \
 && mv /out/libs/openzeppelin-contracts-${OPENZEPPELIN} /out/libs/openzeppelin-contracts \
 && find /out/libs/forge-std -mindepth 1 -maxdepth 1 ! -name src ! -name LICENSE* -exec rm -rf {} + \
 && find /out/libs/openzeppelin-contracts -mindepth 1 -maxdepth 1 ! -name contracts ! -name LICENSE* -exec rm -rf {} +

FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends jq \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work
COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge
COPY --from=fetch /out/solc /opt/solc
COPY --from=fetch /out/libs /opt/sol-libs

ENV HOME=/work \
    TMPDIR=/tmp \
    FOUNDRY_DISABLE_NIGHTLY_WARNING=1 \
    NO_COLOR=1 \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
