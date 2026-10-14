#!/usr/bin/env bash
# Usage: bash solution.sh JOURNAL PRIORITY [UNIT]
# Prints the entries of a `journalctl -o json` export at PRIORITY or more serious,
# optionally only those of UNIT, as "TIME IDENT[PID]: MESSAGE".
set -u

journal=$1
priority=$2
unit=${3:-}

# 1. Turn PRIORITY (a name, or a number 0-7) into a number in $level.
level=$priority # YOUR CODE

# 2. When a unit is given without a dot in its name, add ".service".
# YOUR CODE

# 3. Print the kept entries with jq, or "-- No entries --" when there are none.
# YOUR CODE
