#!/usr/bin/env bash
# Usage: bash solution.sh INVENTORY DISCOVERY CERTIFICATES
# Reconciles the asset inventory with discovery data and certificates of sanitization.
set -u

inventory=$1
discovery=$2
certificates=$3

# 1. and 2. Find unknown, retired, missing and uncertified assets.
report=$(awk -F, '
  FNR == 1 || $0 == "" { next }
  ARGIND == 1 {
    mac = tolower($3)
    tag[mac] = $1; host[mac] = $2; status[mac] = $5; media[$1] = $4
    next
  }
  ARGIND == 2 {
    mac = tolower($2)
    seen[mac] = 1
    if (!(mac in tag))
      print "UNKNOWN " mac " at " $1 " (" $3 ")"
    else if (status[mac] == "disposed")
      print "RETIRED " tag[mac] " " host[mac] " at " $1
    next
  }
  ARGIND == 3 {
    ok = ($3 == "purge" || $3 == "destroy") && $5 != ""
    if (media[$2] == "flash" && $3 == "purge" && ($4 == "overwrite" || $4 == "degauss"))
      ok = 0
    if (ok)
      certified[$2] = 1
  }
  END {
    for (mac in tag) {
      if (status[mac] == "in-service" && !(mac in seen))
        print "MISSING " tag[mac] " " host[mac]
      if (status[mac] == "disposed" && !(tag[mac] in certified))
        print "UNCERTIFIED " tag[mac] " " host[mac]
    }
  }
' "$inventory" "$discovery" "$certificates" | LC_ALL=C sort -u)

# 3. Print the sorted lines and exit 1, or "inventory reconciled" and exit 0.
if [ -z "$report" ]; then
  echo "inventory reconciled"
  exit 0
fi
printf '%s\n' "$report"
exit 1
