#!/usr/bin/env bash
# Usage: bash solution.sh <path-to-auth.log>
set -u

log="$1"

# awk does the filtering, extraction and counting in one pass. Anchoring on the
# word "from" keeps this correct for "invalid user" lines, where the columns shift.
awk '
  /Failed password/ {
    for (i = 1; i < NF; i++) if ($i == "from") failures[$(i + 1)]++
  }
  END {
    for (address in failures) if (failures[address] >= 3) print address, failures[address]
  }
' "$log" | sort -k2,2nr -k1,1
