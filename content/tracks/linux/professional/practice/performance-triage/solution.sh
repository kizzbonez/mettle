#!/usr/bin/env bash
# Usage: bash solution.sh VMSTAT PS NCPU
# Names the bottleneck from saved vmstat output and the suspects from saved ps output.
set -u

vmstat_file=$1
ps_file=$2
ncpu=$3

# 1. From VMSTAT: skip the header lines and the first report, then pick the bottleneck:
#    memory, io, cpu or none.
bottleneck=$(awk -v ncpu="$ncpu" '
  NF == 0 || $1 == "procs" || $1 == "r" { next }
  !since_boot_skipped { since_boot_skipped = 1; next }
  {
    reports++
    r += $1; b += $2; id += $15; wa += $16
    if ($7 > 0 || $8 > 0) swapping = 1
  }
  END {
    if (reports == 0) kind = "none"
    else if (swapping) kind = "memory"
    else if (b / reports >= 1 && wa / reports >= 20) kind = "io"
    else if (r / reports > ncpu + 0 || id / reports < 10) kind = "cpu"
    else kind = "none"
    print kind
  }
' "$vmstat_file")
echo "bottleneck: $bottleneck"

# 2. From PS: print "suspect: PID COMMAND" for the suspects of that bottleneck.
awk -v kind="$bottleneck" '
  NR == 1 { next }
  {
    command = $7
    for (i = 8; i <= NF; i++) command = command " " $i
  }
  kind == "io" && $3 ~ /^D/ { print "suspect: " $1 " " command }
  kind == "cpu" && (best == "" || $4 + 0 > most + 0) { most = $4; best = $1 " " command }
  kind == "memory" && (best == "" || $6 + 0 > most + 0) { most = $6; best = $1 " " command }
  END { if (best != "") print "suspect: " best }
' "$ps_file"
