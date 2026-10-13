# Sandbox image for Rust labs. Containers from it run with no network, a
# read-only root filesystem and an unprivileged user (see apps/runner).
FROM rust:1-slim-bookworm

# Call the toolchain directly instead of through the rustup proxy, which
# expects a writable home directory.
RUN ln -s "$(rustc --print sysroot)" /opt/rust \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

ENV PATH=/opt/rust/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    HOME=/work \
    TMPDIR=/tmp \
    RUST_BACKTRACE=0 \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
CMD ["true"]
