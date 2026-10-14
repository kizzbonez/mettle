#!/usr/bin/env bash
# Usage: bash solution.sh JOURNAL PRIORITY [UNIT]
# Prints the entries of a `journalctl -o json` export at PRIORITY or more serious,
# optionally only those of UNIT, as "TIME IDENT[PID]: MESSAGE".
set -u

journal=$1
priority=$2
unit=${3:-}

# 1. Turn PRIORITY (a name, or a number 0-7) into a number in $level.
case $priority in
  emerg) level=0 ;;
  alert) level=1 ;;
  crit) level=2 ;;
  err) level=3 ;;
  warning) level=4 ;;
  notice) level=5 ;;
  info) level=6 ;;
  debug) level=7 ;;
  [0-7]) level=$priority ;;
  *) echo "unknown priority: $priority" >&2; exit 2 ;;
esac

# 2. When a unit is given without a dot in its name, add ".service".
if [ -n "$unit" ] && [[ $unit != *.* ]]; then
  unit=$unit.service
fi

# 3. Print the kept entries with jq, or "-- No entries --" when there are none.
out=$(jq -r --arg unit "$unit" --argjson level "$level" '
  select($unit == "" or ._SYSTEMD_UNIT == $unit or .UNIT == $unit)
  | select((.PRIORITY | tonumber) <= $level)
  | (.__REALTIME_TIMESTAMP | tonumber / 1000000 | floor | todate)
    + " " + .SYSLOG_IDENTIFIER
    + (if ._PID then "[" + ._PID + "]" else "" end)
    + ": " + .MESSAGE
' "$journal")

if [ -z "$out" ]; then
  echo "-- No entries --"
else
  printf '%s\n' "$out"
fi
