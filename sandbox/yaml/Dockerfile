# Sandbox image for YAML labs: CPython and PyYAML, which parses the learner's
# file so the tests can check what it actually means.
FROM python:3.12-slim

RUN pip install --no-cache-dir --disable-pip-version-check "pyyaml>=6,<7" \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

ENV HOME=/work \
    TMPDIR=/tmp \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=0 \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
