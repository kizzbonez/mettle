#!/usr/bin/env bash
# Usage: bash solution.sh FILE
file="$1"

# A record is any line after the header (NR > 1) with exactly four fields.
# The arrays keep one total per van; END prints them, in no particular order,
# so sort puts the lines in order of van name.
awk -F, '
  NR > 1 && NF == 4 { litres[$1] += $3; km[$1] += $4 }
  END { for (van in litres) printf "%s %.1f %d\n", van, litres[van], km[van] }
' "$file" | sort

# The fleet totals, and the longest trip: a record replaces the one remembered
# only when it is strictly longer, so the first of several equal trips wins.
awk -F, '
  NR > 1 && NF == 4 { litres += $3; km += $4 }
  NR > 1 && NF == 4 && $4 > most { most = $4; van = $1 }
  END {
    printf "fleet %.1f %d\n", litres, km
    printf "longest %s %d\n", van, most
  }
' "$file"
