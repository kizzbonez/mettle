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
  local copies=1 sides=one printer=front-desk dry_run=0 opt

  while getopts ':hnc:s:p:' opt; do
    case $opt in
      h) usage; exit 0 ;;
      n) dry_run=1 ;;
      c) copies=$OPTARG ;;
      s) sides=$OPTARG ;;
      p) printer=$OPTARG ;;
      :) usage_error "option -$OPTARG needs a value" ;;
      \?) usage_error "unknown option -$OPTARG" ;;
    esac
  done
  shift $((OPTIND - 1))

  # Digits only, worth 1 to 99: optional leading zeros, then 1-9, then at most one digit.
  # A regular expression avoids arithmetic, where 08 would be read as a bad octal number.
  if ! [[ $copies =~ ^0*[1-9][0-9]?$ ]]; then
    usage_error "COPIES must be a whole number from 1 to 99, not '$copies'"
  fi
  case $sides in
    one | two) ;;
    *) usage_error "SIDES must be one or two, not '$sides'" ;;
  esac
  [[ -n $printer ]] || usage_error "PRINTER must not be empty"
  (( $# > 0 )) || usage_error "no FILE given"

  local file
  for file in "$@"; do
    [[ -f $file && -r $file ]] || die "cannot read $file"
  done

  local action=queued
  if (( dry_run )); then
    action="would queue"
  fi
  for file in "$@"; do
    printf '%s %s (copies=%s, sides=%s, printer=%s)\n' "$action" "$file" "$copies" "$sides" "$printer"
  done
}

main "$@"
