#!/usr/bin/env bash
# Usage: bash solution.sh FILE

# Wrong usage: message on standard error, status 2.
if [ "$#" -ne 1 ]; then
  echo "usage: solution.sh FILE" >&2
  exit 2
fi

file="$1"

# -f is true only for an existing regular file, so a directory fails it too.
if [ ! -f "$file" ]; then
  echo "not a file: $file" >&2
  exit 2
fi

# -s is true when the file is not empty.
if [ ! -s "$file" ]; then
  echo "rejected: empty"
  exit 1
fi

# The whole name must match a pattern, so notes.txt.bak is not *.txt.
case $file in
  *.txt | *.md)
    kind="text"
    limit=100
    ;;
  *.png | *.jpg)
    kind="image"
    limit=1000
    ;;
  *)
    echo "rejected: type"
    exit 1
    ;;
esac

size=$(wc -c < "$file")
if [ "$size" -gt "$limit" ]; then
  echo "rejected: too large"
  exit 1
fi

echo "accepted: $kind"
