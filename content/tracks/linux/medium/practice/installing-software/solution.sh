#!/usr/bin/env bash
# Usage: bash solution.sh LISTING WANTED
listing="$1"
wanted="$2"
problems=0

# read splits at spaces: the name, then the version. A blank line leaves name
# empty. || [ -n "$name" ] keeps a last line that has no newline.
while read -r name version || [ -n "$name" ]; do
  if [ -z "$name" ]; then
    continue
  fi
  case $name in
    '#'*) continue ;;
  esac

  # The header lines never have "ii" as their first field. == compares whole
  # fields, so python3 does not match python3-minimal, and characters such as
  # + in libstdc++6 have no special meaning.
  installed=$(awk -v name="$name" '$1 == "ii" && $2 == name { print $3 }' "$listing")

  if [ -z "$installed" ]; then
    echo "$name: not installed"
    problems=$((problems + 1))
  elif [ "$installed" = "$version" ]; then
    echo "$name: ok"
  else
    echo "$name: $installed installed, $version wanted"
    problems=$((problems + 1))
  fi
done < "$wanted"

echo "problems: $problems"

if [ "$problems" -gt 0 ]; then
  exit 1
fi
