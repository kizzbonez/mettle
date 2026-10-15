#!/usr/bin/env bash
# Usage: bash solution.sh MANIFEST CUSTODY
# Verifies evidence hashes and checks the chain of custody for gaps.
set -u

manifest=$1
custody=$2
problems=0

# 1. Integrity: for each "HASH  FILE" line (skip empty lines and # comments), print
#    VERIFIED FILE, ALTERED FILE or MISSING FILE.
# YOUR CODE

# 2. Chain of custody: skip the header and empty lines; for each row print ORDER, BREAK and
#    SEAL lines as the instructions say. The holder before an item's first row is "-".
# YOUR CODE

# 3. Exit 0 only when everything was verified and the chain is intact.
exit "$problems"
