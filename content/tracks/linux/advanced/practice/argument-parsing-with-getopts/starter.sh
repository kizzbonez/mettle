#!/usr/bin/env bash
# lpjob: queue files on one of the copy shop's printers.
# Run as: bash solution.sh [-hn] [-c COPIES] [-s SIDES] [-p PRINTER] [--] FILE...
set -euo pipefail

readonly PROG=lpjob

usage() {
  printf 'Usage: %s [-hn] [-c COPIES] [-s SIDES] [-p PRINTER] [--] FILE...\n' "$PROG"
  printf '  -c COPIES   copies of each file, 1 to 99 (default 1)\n'
  printf '  -s SIDES    print on one or two sides (default one)\n'
  printf '  -p PRINTER  the printer to use (default front-desk)\n'
  printf '  -n          dry run: show the jobs but queue nothing\n'
  printf '  -h          show this help and exit\n'
}

# usage_error REASON: "lpjob: REASON" and the usage on standard error, then exit 2.
usage_error() {
  printf '%s: %s\n' "$PROG" "$1" >&2
  usage >&2
  exit 2
}

# die MESSAGE: "lpjob: MESSAGE" on standard error, then exit 1.
die() {
  printf '%s: %s\n' "$PROG" "$1" >&2
  exit 1
}

main() {
  local copies=1 sides=one printer=front-desk dry_run=0

  # YOUR CODE: parse the options with getopts in silent mode, then shift them away.

  # YOUR CODE: check COPIES, SIDES, PRINTER and that at least one FILE is left,
  # calling usage_error for anything wrong.

  # YOUR CODE: check that every FILE is a readable file, calling die for the first
  # one that is not, before printing anything.

  # YOUR CODE: print one line per FILE.
}

main "$@"
