#!/usr/bin/env bash
# Usage: bash solution.sh VMSTAT PS NCPU
# Names the bottleneck from saved vmstat output and the suspects from saved ps output.
set -u

vmstat_file=$1
ps_file=$2
ncpu=$3

# 1. From VMSTAT: skip the header lines and the first report, then pick the bottleneck:
#    memory, io, cpu or none.
bottleneck=none # YOUR CODE
echo "bottleneck: $bottleneck"

# 2. From PS: print "suspect: PID COMMAND" for the suspects of that bottleneck.
# YOUR CODE
