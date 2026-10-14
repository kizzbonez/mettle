#!/usr/bin/env bash
# rotate-backups: keep the newest database backups in a directory and delete the rest.
set -euo pipefail

readonly PROG=rotate-backups
tmp_report=""

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

die() {
  printf '%s: %s\n' "$PROG" "$1" >&2
  exit 1
}

usage_error() {
  printf '%s: %s\n' "$PROG" "$1" >&2
  usage >&2
  exit 2
}

cleanup() {
  if [[ -n $tmp_report ]]; then
    rm -f -- "$tmp_report"
  fi
}

# day_number DATE: print a YYYY-MM-DD date as whole days since 1970-01-01.
# Fails when DATE is not written that way or is not a real calendar date.
day_number() {
  local seconds
  [[ $1 =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || return 1
  seconds=$(date -u -d "$1" +%s 2>/dev/null) || return 1
  printf '%s\n' "$(( seconds / 86400 ))"
}

# emit LINE: print a line of the plan, and add it to the report if there is one.
emit() {
  printf '%s\n' "$1"
  if [[ -n $tmp_report ]]; then
    printf '%s\n' "$1" >> "$tmp_report"
  fi
}

main() {
  local keep=3 days=7 today="" report="" dry_run=0 opt
  OPTIND=1
  while getopts ':hnk:d:t:r:' opt; do
    case $opt in
      h) usage; exit 0 ;;
      n) dry_run=1 ;;
      k) keep=$OPTARG ;;
      d) days=$OPTARG ;;
      t) today=$OPTARG ;;
      r) report=$OPTARG ;;
      :) usage_error "option -$OPTARG needs a value" ;;
      \?) usage_error "unknown option -$OPTARG" ;;
    esac
  done
  shift $((OPTIND - 1))

  if ! [[ $keep =~ ^[0-9]+$ ]] || (( 10#$keep < 1 )); then
    usage_error "KEEP must be a whole number of at least 1, not '$keep'"
  fi
  if ! [[ $days =~ ^[0-9]+$ ]]; then
    usage_error "DAYS must be a whole number, not '$days'"
  fi
  keep=$((10#$keep))
  days=$((10#$days))
  [[ -n $today ]] || usage_error "the date option -t is required"
  local today_day
  today_day=$(day_number "$today") || usage_error "not a valid date: '$today'"
  (( $# == 1 )) || usage_error "expected one directory, got $# argument(s)"

  local dir=$1
  [[ -d $dir ]] || die "not a directory: $dir"

  if [[ -n $report ]]; then
    tmp_report=$(mktemp "$report.XXXXXX") || die "cannot write the report: $report"
  fi

  # Collect "database<TAB>date<TAB>name" for every backup file.
  local -a entries=()
  local path name db date
  shopt -s nullglob
  for path in "$dir"/*; do
    [[ -f $path ]] || continue
    name=${path##*/}
    [[ $name =~ ^(.+)-([0-9]{4}-[0-9]{2}-[0-9]{2})\.sql\.gz$ ]] || continue
    # Copy the captures first: the next =~ test (inside day_number) replaces BASH_REMATCH.
    db=${BASH_REMATCH[1]}
    date=${BASH_REMATCH[2]}
    day_number "$date" > /dev/null || continue
    entries+=("$db"$'\t'"$date"$'\t'"$name")
  done

  # Database names in byte order, and each database newest first.
  local -a sorted=()
  if (( ${#entries[@]} > 0 )); then
    mapfile -d '' -t sorted < <(printf '%s\0' "${entries[@]}" | LC_ALL=C sort -z -t $'\t' -k1,1 -k2,2r)
  fi

  local -A rank=()
  local entry rest age action kept=0 deleted=0
  for entry in "${sorted[@]}"; do
    db=${entry%%$'\t'*}
    rest=${entry#*$'\t'}
    date=${rest%%$'\t'*}
    name=${rest#*$'\t'}
    rank[$db]=$(( ${rank[$db]:-0} + 1 ))
    age=$(( today_day - $(day_number "$date") ))
    if (( ${rank[$db]} <= keep || age < days )); then
      action=keep
      kept=$((kept + 1))
    else
      action=delete
      deleted=$((deleted + 1))
    fi
    emit "$(printf '%-6s %s' "$action" "$name")"
    if [[ $action == delete ]] && (( ! dry_run )); then
      rm -f -- "$dir/$name" 2>/dev/null || die "cannot delete $name"
    fi
  done

  local summary="total: $kept kept, $deleted deleted"
  if (( dry_run )); then
    summary+=" (dry run)"
  fi
  emit "$summary"

  if [[ -n $tmp_report ]]; then
    chmod 644 -- "$tmp_report"
    mv -f -- "$tmp_report" "$report" || die "cannot write the report: $report"
    tmp_report=""
  fi
}

trap cleanup EXIT
main "$@"
