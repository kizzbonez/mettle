#!/usr/bin/env bash
# Usage: bash solution.sh JOB...
pids=""
ok=0
failed=0
worst=0

# Start them all first: & returns at once, and $! is the new job's PID.
for job in "$@"; do
  bash "$job" > /dev/null 2>&1 &
  pids="$pids $!"
done

# $pids is left unquoted on purpose: it is a list of numbers to split at the
# spaces. wait PID returns that job's exit status.
for pid in $pids; do
  wait "$pid"
  status=$?
  if [ "$status" -eq 0 ]; then
    ok=$((ok + 1))
  else
    failed=$((failed + 1))
  fi
  if [ "$status" -gt "$worst" ]; then
    worst=$status
  fi
done

echo "ok: $ok"
echo "failed: $failed"
echo "worst: $worst"

if [ "$failed" -gt 0 ]; then
  exit 1
fi
