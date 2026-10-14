#!/usr/bin/env bash
# Usage: bash solution.sh FILE
file="$1"

# Extended syntax (-E): {2,4} and {3,5} count repetitions without backslashes.
# [[:upper:]] is one capital letter.
id='[[:upper:]]{2,4}-[0-9]{3,5}'

# -o prints each match on its own line, so a line with two IDs gives two lines.
# -w accepts a match only when it is not glued to a letter, digit or underscore,
# which rules out ACCTS-55120 and NET-123456. sort -u sorts and keeps one of each.
grep -owE "$id" "$file" | sort -u

# -v selects the lines with no match and -c counts them instead of printing them.
count=$(grep -vcwE "$id" "$file")
echo "lines without a ticket: $count"
