# Sandbox image for Go labs: the Go 1.27 toolchain, with the standard library already compiled
# (with the race detector, which every lab is built with) into a build cache the sandbox only
# reads. Go skips cache writes it cannot make, so a lab compiles only its own two packages.
FROM golang:1.27-trixie

ENV GOCACHE=/opt/go-cache \
    GOTOOLCHAIN=local \
    GOPROXY=off \
    GOSUMDB=off \
    XDG_CONFIG_HOME=/opt/go-config \
    CGO_ENABLED=1

# Build and vet a package that imports the parts of the standard library labs use, the way the
# harness does, so their compiled code and vet facts are in the cache.
COPY warm /tmp/warm
RUN go telemetry off \
 && cd /tmp/warm \
 && go test -race -c -o /dev/null . \
 && go build -race -o /dev/null . \
 && rm -rf /tmp/warm \
 && chmod -R a+rX /opt/go-cache /opt/go-config \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

# By default the race detector waits a second at every exit for late reports. A lab's
# goroutines are done by then, and the wait would add a second to every test.
ENV HOME=/work \
    TMPDIR=/tmp \
    GORACE=atexit_sleep_ms=20 \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
