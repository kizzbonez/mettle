#!/usr/bin/env bash
# Usage: bash solution.sh FILE
file="$1"

# tail -n +2 skips the header. tr -d '\r' removes Windows carriage returns
# before anything compares titles. sort puts equal titles side by side so that
# uniq -c can count them. The final sort takes the count as a number, largest
# first (-k1,1nr), and breaks ties on the title from field 2 to the end of the
# line (-k2), A to Z. A plain sort -rn would reverse the tie order as well.
tail -n +2 "$file" |
  cut -d, -f3 |
  tr -d '\r' |
  tr '[:upper:]' '[:lower:]' |
  sort |
  uniq -c |
  sort -k1,1nr -k2 |
  head -3
