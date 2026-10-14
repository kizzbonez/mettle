#!/usr/bin/env bash
# Usage: bash solution.sh CRONTAB "YYYY-MM-DD HH:MM"
# Prints the command of every job in CRONTAB that cron starts at that minute, in file order.
set -u

crontab=$1
when=$2

# The time as five numbers: minute, hour, day of month, month, day of week (0 = Sunday).
# date prints them with leading zeros, such as 08.
read -r minute hour dom month dow <<< "$(date -d "$when" '+%M %H %d %m %w')"

# For every job line (first non-blank character a digit or *), print its command when the
# job runs at that minute. The instructions give the rules for the fields and the two day fields.
awk -v mi="$minute" -v ho="$hour" -v dm="$dom" -v mo="$month" -v dw="$dow" '
  # One item of a list: *, N, A-B or */S. first is the lowest value of the field.
  function item_matches(item, v, first,    ends) {
    if (item == "*") return 1
    if (item ~ /^\*\/[0-9]+$/) return (v - first) % substr(item, 3) == 0
    if (item ~ /^[0-9]+-[0-9]+$/) {
      split(item, ends, "-")
      return v >= ends[1] + 0 && v <= ends[2] + 0
    }
    return item + 0 == v
  }
  function field_matches(field, v, first,    items, n, i) {
    n = split(field, items, ",")
    for (i = 1; i <= n; i++)
      if (item_matches(items[i], v, first)) return 1
    return 0
  }

  $1 !~ /^[0-9*]/ { next }
  {
    time_ok = field_matches($1, mi + 0, 0) && field_matches($2, ho + 0, 0) && field_matches($4, mo + 0, 1)
    dom_ok = field_matches($3, dm + 0, 1)
    dow_ok = field_matches($5, dw + 0, 0) || (dw + 0 == 0 && field_matches($5, 7, 0))
    if ($3 !~ /^\*/ && $5 !~ /^\*/)
      day_ok = dom_ok || dow_ok
    else
      day_ok = dom_ok && dow_ok
    if (time_ok && day_ok) {
      command = $0
      sub(/^[ \t]*([^ \t]+[ \t]+){5}/, "", command)
      print command
    }
  }
' "$crontab"
