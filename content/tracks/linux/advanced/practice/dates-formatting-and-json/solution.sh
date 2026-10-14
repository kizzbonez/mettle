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
  local seconds
  seconds=$(date -u -d "$1" +%s) || return 1
  echo $(( seconds / 86400 ))
}

main() {
  local loans=$1 today=$2 today_day="" member due title days count=0

  if ! [[ $today =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || ! today_day=$(day_number "$today" 2> /dev/null); then
    die "invalid date: $today" 2
  fi
  [[ -f $loans && -r $loans ]] || die "cannot read $loans"

  printf '%-10s %-11s %4s  %s\n' MEMBER DUE DAYS TITLE
  : > overdue.jsonl

  while IFS=$'\t' read -r member due title; do
    days=$(( today_day - $(day_number "$due") ))
    if (( days <= 0 )); then
      continue
    fi
    printf '%-10s %-11s %4d  %s\n' "$member" "$(date -u -d "$due" '+%d %b %Y')" "$days" "$title"
    jq -nc --arg member "$member" --arg title "$title" --argjson days "$days" \
      '{member: $member, title: $title, days: $days}' >> overdue.jsonl
    count=$((count + 1))
  done < <(jq -r '.[] | select(.returned != true) | [.member, .due, .title] | @tsv' "$loans")

  printf '%s overdue\n' "$count"
}

main "$@"
