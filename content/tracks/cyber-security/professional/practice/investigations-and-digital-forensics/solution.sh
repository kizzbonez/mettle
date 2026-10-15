#!/usr/bin/env bash
# Usage: bash solution.sh MANIFEST CUSTODY
# Verifies evidence hashes and checks the chain of custody for gaps.
set -u

manifest=$1
custody=$2
problems=0

# 1. Integrity: compare each file's SHA-256 hash with the manifest.
while read -r hash file; do
  case $hash in
    '' | '#'*) continue ;;
  esac
  if [ ! -f "$file" ]; then
    echo "MISSING $file"
    problems=1
  elif [ "$(sha256sum "$file" | cut -d' ' -f1)" = "$hash" ]; then
    echo "VERIFIED $file"
  else
    echo "ALTERED $file"
    problems=1
  fi
done < "$manifest"

# 2. Chain of custody: order, handovers and seals, item by item in file order.
declare -A holder last
first=1
while IFS=, read -r item time released received purpose seal; do
  if [ "$first" = 1 ]; then first=0; continue; fi
  [ -z "$item" ] && continue
  current=${holder[$item]:--}
  if [ -n "${last[$item]+set}" ] && [[ $time < ${last[$item]} ]]; then
    echo "ORDER $item at $time"
    problems=1
  fi
  if [ "$released" != "$current" ]; then
    echo "BREAK $item at $time: released by $released, last held by $current"
    problems=1
  fi
  if [ "$seal" != "yes" ]; then
    echo "SEAL $item at $time"
    problems=1
  fi
  holder[$item]=$received
  last[$item]=$time
done < "$custody"

# 3. Exit 0 only when everything was verified and the chain is intact.
exit "$problems"
