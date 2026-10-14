#!/usr/bin/env bash
# Usage: bash solution.sh FILE
file="$1"
total=0

# IFS=, splits at commas only, so spaces in and around names are kept.
# -r keeps backslashes. When the last line has no newline, read fills the
# variables but fails, and || [ -n "$item" ] lets that line through.
while IFS=, read -r item stock minimum || [ -n "$item" ]; do
  if [ -z "$item" ]; then
    continue
  fi
  case $item in
    '#'*) continue ;;
  esac
  if [ "$item" = "END" ]; then
    break
  fi
  if [ "$stock" -lt "$minimum" ]; then
    need=$((2 * minimum - stock))
    echo "buy $item: $need"
    total=$((total + need))
  fi
done < "$file"

# The loop read from a redirect, not a pipe, so total still holds the sum here.
echo "total: $total"
