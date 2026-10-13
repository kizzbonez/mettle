# Sandbox image for Python and AI labs: CPython plus NumPy, nothing else.
FROM python:3.12-slim

RUN pip install --no-cache-dir --disable-pip-version-check "numpy>=2,<3" \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

# One BLAS thread: labs are small, and threads count against the pids limit.
ENV HOME=/work \
    TMPDIR=/tmp \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=0 \
    OPENBLAS_NUM_THREADS=1 \
    OMP_NUM_THREADS=1 \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
