#!/usr/bin/env bash
# Usage: bash solution.sh TODAY INVENTORY
# Lists the hosts in an asset inventory that are unsupported, unpatched, unmanaged,
# exposing management ports to the internet or without an owner.
set -u

today=$1
inventory=$2

# 1. The oldest patch date that still counts as patched: 30 days before TODAY.
cutoff=$(date -d "$today -30 days" +%F)

# 2. One line per host with findings, then the summary; exit 1 if any host needs action.
awk -F, -v today="$today" -v cutoff="$cutoff" '
  { sub(/\r$/, "") }
  /^#/ || /^[[:space:]]*$/ { next }
  !seen_header { seen_header = 1; next }
  {
    hosts++
    found = ""
    if ($3 == "unknown") found = found " unknown-os"
    else if ($3 < today) found = found " unsupported"
    if ($4 == "unknown" || $4 < cutoff) found = found " unpatched"
    if ($5 != "yes") found = found " unmanaged"
    if ($6 == "internet") {
      n = split($7, ports, " ")
      for (i = 1; i <= n; i++) open[ports[i]] = 1
      split("22 23 3389 5900", admin, " ")
      for (i = 1; i <= 4; i++) if (admin[i] in open) found = found " exposed:" admin[i]
      for (p in open) delete open[p]
    }
    if ($8 == "") found = found " no-owner"
    if (found != "") {
      flagged++
      print $1 ":" found
    }
  }
  END {
    printf "%d of %d hosts need action\n", flagged, hosts
    exit (flagged > 0)
  }
' "$inventory"
