#!/usr/bin/env bash
# Usage: bash solution.sh SCHEDULE RECORDS HOLDS REVIEW_DATE
# Applies a retention schedule and legal holds to a records inventory on REVIEW_DATE.
set -u

schedule=$1
records=$2
holds=$3
today=$4

# 1. The schedule: retain, trigger and disposal for each category (skip the header and blank lines).
declare -A retain=() trigger=() disposal=()
# YOUR CODE

# 2. The holds that are active on $today: issued <= today, and released empty or > today.
#    Keep them in file order with what they apply to.
# YOUR CODE

# 3. Each record, in file order: REVIEW, HOLD, KEEP open, DISPOSE or KEEP until.
#    Count each kind for the summary line.
# YOUR CODE

# 4. SUMMARY <d> dispose, <h> hold, <k> keep, <r> review
# YOUR CODE
