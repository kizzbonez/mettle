#!/usr/bin/env bash
# meters: summarise one evening of water meter readings into a report file.
# Run as: bash solution.sh READINGS REPORT
set -Eeuo pipefail

workdir=""   # the temporary work directory, once it exists

# die MESSAGE: print "meters: MESSAGE" on standard error and exit with status 1.
die() {
  printf 'meters: %s\n' "$1" >&2
  exit 1
}

# cleanup: remove the work directory, if there is one. It must run on every exit.
cleanup() {
  if [[ -n $workdir ]]; then
    rm -rf -- "$workdir"
  fi
}

trap 'printf "meters: line %s: %s failed\n" "$LINENO" "$BASH_COMMAND" >&2' ERR

main() {
  local readings=$1 report=$2

  [[ -f $readings && -r $readings ]] || die "cannot read $readings"

  workdir=$(mktemp -d)
  trap cleanup EXIT

  local line_no=0 count=0 meter value
  while read -r meter value; do
    line_no=$((line_no + 1))
    case $value in
      FAULT) ;;
      '' | *[!0-9]*) die "bad value on line $line_no: $value" ;;
      *)
        count=$((count + 1))
        printf '%s %s\n' "$meter" "$value" >> "$workdir/numbers"
        ;;
    esac
  done < "$readings"

  local faults
  faults=$(grep -c -w FAULT "$readings") || true
  local highest=none
  if (( count > 0 )); then
    highest=$(sort -k2,2n "$workdir/numbers" | tail -n 1)
  fi

  printf 'readings: %s\nfaults: %s\nhighest: %s\n' "$count" "$faults" "$highest" > "$workdir/report"
  mv -- "$workdir/report" "$report"
}

main "$@"
