#!/usr/bin/env bash
# allowlist: add entries to an allowlist file, each one once, safely.
# Run as: bash solution.sh LIST ENTRY...
set -euo pipefail

readonly PROG=allowlist
tmp=""   # the temporary copy of LIST, while there is one

# cleanup: remove the temporary file if it still exists. It runs on EXIT.
cleanup() {
  # YOUR CODE
  :
}

main() {
  if (( $# < 2 )); then
    printf '%s: usage: solution.sh LIST ENTRY...\n' "$PROG" >&2
    exit 2
  fi
  local list=$1 entry added=0
  shift

  # YOUR CODE: open LIST.lock on file descriptor 9 and take the lock with flock -n.
  # If another run holds it, print the message from the instructions and exit 3.

  # YOUR CODE: create the temporary file beside LIST with mktemp, set the EXIT trap,
  # and copy LIST into it when LIST exists.

  # YOUR CODE: append each ENTRY that is not already a whole line, printing "added ENTRY".

  printf '%s added\n' "$added"

  # YOUR CODE: if anything was added, chmod 644 the temporary file and move it over LIST.
}

main "$@"
