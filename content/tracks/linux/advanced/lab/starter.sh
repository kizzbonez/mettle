#!/usr/bin/env bash
# rotate-backups: keep the newest database backups in a directory and delete the rest.
# Run as: bash solution.sh [-n] [-k KEEP] [-d DAYS] [-r REPORT] -t YYYY-MM-DD DIR
set -euo pipefail

readonly PROG=rotate-backups
tmp_report=""   # path of the report's temporary file while it is being written

usage() {
  cat <<EOF
Usage: $PROG [-n] [-k KEEP] [-d DAYS] [-r REPORT] -t YYYY-MM-DD DIR

Keep the newest KEEP backups of each database in DIR, and every backup
younger than DAYS days on the date given with -t. Delete the rest.

  -k KEEP     backups to keep per database, at least 1 (default 3)
  -d DAYS     also keep backups younger than DAYS days (default 7)
  -t DATE     the date to measure ages from, as YYYY-MM-DD (required)
  -r REPORT   also write the plan to the file REPORT, replacing it atomically
  -n          dry run: print the plan but delete nothing
  -h          show this help and exit
EOF
}

# die MESSAGE: print "rotate-backups: MESSAGE" on standard error and exit with status 1.
die() {
  # YOUR CODE
  :
}

# usage_error MESSAGE: print "rotate-backups: MESSAGE" and then the usage on
# standard error, and exit with status 2.
usage_error() {
  # YOUR CODE
  :
}

# cleanup: remove the report's temporary file if there is one. It runs on EXIT.
cleanup() {
  # YOUR CODE
  :
}

# day_number DATE: print a YYYY-MM-DD date as whole days since 1970-01-01.
# Return a non-zero status if DATE is not written that way or is not a real date.
day_number() {
  # YOUR CODE
  :
}

main() {
  local keep=3 days=7 today="" report="" dry_run=0

  # YOUR CODE: parse the options with getopts, then check KEEP, DAYS, the -t date
  # and the directory, exiting as the instructions say.

  # YOUR CODE: if -r was given, create the report's temporary file with mktemp
  # in the same directory as the report.

  # YOUR CODE: collect the backups, sort them, decide keep or delete, print each
  # line, delete (unless -n), print the total and move the report into place.
}

trap cleanup EXIT
main "$@"
