# Sandbox image for C++ labs: GCC, the standard library and the sanitizer runtimes.
FROM debian:trixie-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends g++ \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

# Labs are built with AddressSanitizer and UndefinedBehaviorSanitizer, so a
# memory error or undefined behaviour ends the test with a report instead of
# passing by luck. Stop at the first error and keep the report short.
ENV HOME=/work \
    TMPDIR=/tmp \
    LANG=C.UTF-8 \
    ASAN_OPTIONS=abort_on_error=0:exitcode=1:quarantine_size_mb=16:malloc_context_size=5:color=never \
    UBSAN_OPTIONS=halt_on_error=1:print_stacktrace=0:color=never

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
