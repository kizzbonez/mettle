#!/usr/bin/env bash
# Usage: bash solution.sh CHAIN MIN_MS
# CHAIN is the output of `systemd-analyze critical-chain`. Prints "MS ms UNIT" for every unit
# on the chain that took at least MIN_MS milliseconds to start, slowest first.
set -u

chain=$1
min_ms=$2

# 1. For every line with a start-up time (" +..."), find the unit name and the time in ms.
# 2. Keep the units of at least $min_ms and sort them, slowest first, ties in chain order.
awk -v min="$min_ms" '
  index($0, " +") == 0 { next }
  {
    line = $0
    sub(/^.*─/, "", line)        # the tree drawing, if any
    split(line, words, " ")
    unit = words[1]

    n = split(substr($0, index($0, " +") + 2), parts, " ")
    ms = 0
    for (i = 1; i <= n; i++) {
      part = parts[i]
      if (part ~ /ms$/) ms += substr(part, 1, length(part) - 2)
      else if (part ~ /min$/) ms += substr(part, 1, length(part) - 3) * 60000
      else if (part ~ /s$/) ms += substr(part, 1, length(part) - 1) * 1000
    }
    ms = int(ms + 0.5)
    if (ms >= min + 0) printf "%d ms %s\n", ms, unit
  }
' "$chain" | sort -s -k1,1nr
