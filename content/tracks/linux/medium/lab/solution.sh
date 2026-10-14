#!/usr/bin/env bash
# Usage: bash solution.sh DIRECTORY
set -u

dir="${1-}"
if [ -z "$dir" ] || [ ! -d "$dir" ]; then
  echo "usage: solution.sh DIRECTORY" >&2
  exit 2
fi

# Pass 1 turns every line of every timesheet into "ok PROJECT HOURS", "bad",
# or nothing (blank lines, comments, headers).
#
# find -print0 and xargs -0 keep names with spaces whole. awk reads the files
# one at a time, so a last line without a newline cannot run into the first
# line of the next file, as it would with cat. If xargs splits a very long list
# of files over several awk runs, their outputs simply follow one another.
records=$(
  find "$dir" -type f -name '*.csv' -print0 |
    xargs -0 awk -F, '
      { sub(/\r$/, "") }
      /^[ \t]*$/ || /^[ \t]*#/ { next }
      { for (i = 1; i <= NF; i++) gsub(/^[ \t]+|[ \t]+$/, "", $i) }
      $1 == "date" { next }
      NF != 4 || $1 !~ /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/ || $3 == "" || $4 !~ /^[0-9]+(\.[0-9])?$/ {
        print "bad"
        next
      }
      { print "ok", tolower($3), $4 }
    '
)

# Pass 2: hours per project, most hours first and ties by name, then the summary.
printf '%s\n' "$records" |
  awk '$1 == "ok" { hours[$2] += $3 } END { for (p in hours) printf "%s %.1f\n", p, hours[p] }' |
  sort -k2,2nr -k1,1
printf '%s\n' "$records" |
  awk '$1 == "ok" { total += $3 } $1 == "bad" { bad++ } END { printf "total %.1f\nrejected %d\n", total, bad }'
