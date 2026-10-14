#!/usr/bin/env bash
# Usage: bash solution.sh JOB...
#
# Run every job in the background at the same time, wait for each one, and
# report how many succeeded, how many failed and the worst exit status.

pids=""     # the process IDs of the jobs, separated by spaces
ok=0
failed=0
worst=0

# YOUR CODE: start every job ("$@") in the background with bash, its output
# and errors sent to /dev/null, and add its process ID ($!) to pids.

# YOUR CODE: wait for each process ID in $pids, take its exit status, count
# it as ok or failed, and keep the highest status in worst.

echo "ok: $ok"
echo "failed: $failed"
echo "worst: $worst"

# YOUR CODE: exit with status 1 if any job failed.
