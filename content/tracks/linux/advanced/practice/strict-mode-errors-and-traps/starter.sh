#!/usr/bin/env bash
# meters: summarise one evening of water meter readings into a report file.
# Run as: bash solution.sh READINGS REPORT
set -Eeuo pipefail

workdir=""   # the temporary work directory, once it exists

# die MESSAGE: print "meters: MESSAGE" on standard error and exit with status 1.
die() {
  # YOUR CODE
  :
}

# cleanup: remove the work directory, if there is one. It must run on every exit.
cleanup() {
  # YOUR CODE
  :
}

# YOUR CODE: an ERR trap that prints "meters: line N: COMMAND failed" on standard error.

main() {
  local readings=$1 report=$2

  # YOUR CODE: stop with die when READINGS is not a readable regular file.

  # YOUR CODE: create the work directory with mktemp -d, then set the EXIT trap at once.

  # Three lines below are ones lesson 3 warns about. Find them and fix them.
  local line_no=0 count=0 meter value
  while read -r meter value; do
    ((line_no++))
    case $value in
      FAULT) ;;
      '' | *[!0-9]*) die "bad value on line $line_no: $value" ;;
      *)
        ((count++))
        printf '%s %s\n' "$meter" "$value" >> "$workdir/numbers"
        ;;
    esac
  done < "$readings"

  local faults=$(grep -c -w FAULT "$readings")
  local highest=none
  if (( count > 0 )); then
    highest=$(sort -k2,2n "$workdir/numbers" | tail -n 1)
  fi

  printf 'readings: %s\nfaults: %s\nhighest: %s\n' "$count" "$faults" "$highest" > "$workdir/report"
  mv -- "$workdir/report" "$report"
}

main "$@"
