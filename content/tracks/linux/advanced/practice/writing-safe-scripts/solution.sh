#!/usr/bin/env bash
# allowlist: add entries to an allowlist file, each one once, safely.
# Run as: bash solution.sh LIST ENTRY...
set -euo pipefail

readonly PROG=allowlist
tmp=""   # the temporary copy of LIST, while there is one

# cleanup: remove the temporary file if it still exists. It runs on EXIT.
cleanup() {
  if [[ -n $tmp ]]; then
    rm -f -- "$tmp"
  fi
}

main() {
  if (( $# < 2 )); then
    printf '%s: usage: solution.sh LIST ENTRY...\n' "$PROG" >&2
    exit 2
  fi
  local list=$1 entry added=0
  shift

  exec 9> "$list.lock"
  if ! flock -n 9; then
    printf '%s: %s is locked by another run\n' "$PROG" "$list" >&2
    exit 3
  fi

  tmp=$(mktemp -- "$list.XXXXXX")
  trap cleanup EXIT
  if [[ -e $list ]]; then
    cat -- "$list" > "$tmp"
  fi

  for entry in "$@"; do
    if ! grep -qxF -- "$entry" "$tmp"; then
      printf '%s\n' "$entry" >> "$tmp"
      printf 'added %s\n' "$entry"
      added=$((added + 1))
    fi
  done

  printf '%s added\n' "$added"

  if (( added > 0 )); then
    chmod 644 -- "$tmp"
    mv -f -- "$tmp" "$list"
    tmp=""
  fi
}

main "$@"
