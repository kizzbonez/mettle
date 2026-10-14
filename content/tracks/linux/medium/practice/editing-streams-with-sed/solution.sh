#!/usr/bin/env bash
# Usage: bash solution.sh FILE
file="$1"

# -i.bak edits the file in place and keeps the original as FILE.bak.
# -E switches on extended syntax for the groups and {n} counts.
#
# ^[^=]*url= matches a line whose text before the first = ends in url:
# [^=]* cannot cross an =, so note=see url=... is not selected.
# The | delimiter avoids escaping the slashes, and g changes every http://.
#
# The date groups are put back in the order year, month, day with \3-\2-\1.
sed -i.bak -E \
  -e '/^[^=]*url=/s|http://|https://|g' \
  -e '/^expires=/s|([0-9]{2})/([0-9]{2})/([0-9]{4})|\3-\2-\1|' \
  -e '/^#/d' \
  -e '/^$/d' \
  "$file"
