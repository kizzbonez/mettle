#!/usr/bin/env bash
# loans: list a library's overdue loans on a given day, as a table and as JSON lines.
# Run as: bash solution.sh LOANS DATE
set -euo pipefail

# die MESSAGE [STATUS]: print "loans: MESSAGE" on standard error and exit (status 1 by default).
die() {
  printf 'loans: %s\n' "$1" >&2
  exit "${2:-1}"
}

# day_number DATE: print a YYYY-MM-DD date as whole days since 1970-01-01, counted in UTC.
# Fail (non-zero status) when date cannot read DATE.
day_number() {
  # YOUR CODE
  :
}

main() {
  local loans=$1 today=$2 today_day="" member due title days count=0

  # YOUR CODE: check DATE (status 2) and LOANS (status 1) as the instructions say.

  printf '%-10s %-11s %4s  %s\n' MEMBER DUE DAYS TITLE
  : > overdue.jsonl

  # YOUR CODE: read member, due and title of every loan that is not returned with jq,
  # and for each overdue one print its table row and append its JSON line.

  printf '%s overdue\n' "$count"
}

main "$@"
