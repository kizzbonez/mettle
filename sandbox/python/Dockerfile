# Sandbox image for Python, AI, data and security labs: CPython 3.15 with NumPy, pandas, pyarrow
# (for Parquet) and cryptography, nothing else.
FROM python:3.15-slim

RUN pip install --no-cache-dir --disable-pip-version-check "numpy>=2,<3" "pandas>=3,<4" "pyarrow>=26,<27" "cryptography>=46" \
 && useradd --uid 10001 --user-group --no-create-home --home-dir /work --shell /usr/sbin/nologin sandbox \
 && mkdir /work && chown sandbox:sandbox /work

# One BLAS and Arrow compute thread and two Arrow I/O threads: labs are small, and
# threads count against the pids limit.
ENV HOME=/work \
    TMPDIR=/tmp \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONHASHSEED=0 \
    OPENBLAS_NUM_THREADS=1 \
    OMP_NUM_THREADS=1 \
    ARROW_IO_THREADS=2 \
    LANG=C.UTF-8

WORKDIR /work
USER 10001:10001
# A sandbox lives for one submission, a few seconds. There is nothing to probe.
# checkov:skip=CKV_DOCKER_2: single-use container, never a running service
HEALTHCHECK NONE
CMD ["true"]
