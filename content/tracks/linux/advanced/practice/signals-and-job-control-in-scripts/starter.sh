#!/usr/bin/env bash
# preflight: run every check script of the rig at once and report each result.
# Run as: bash solution.sh DIR
set -euo pipefail

pids=()    # process id of each check, in the order the checks were started
names=()   # name of each check (file name without .sh), in the same order

# on_term: the TERM handler. Send TERM to every check that is still running, print
# "preflight: interrupted" on standard error and exit with status 143.
on_term() {
  # YOUR CODE
  :
}

main() {
  local dir=$1 check name status passed=0 i

  # YOUR CODE: install on_term as the TERM trap before any check starts.

  shopt -s nullglob
  # YOUR CODE: start every DIR/*.sh with "bash FILE &", recording its process id
  # in pids and its name in names.

  # YOUR CODE: wait for each check in turn with "wait PID", print its result line
  # and count the checks that passed.

  # YOUR CODE: print "P of N checks passed", then exit 0 if all passed, 1 otherwise.
}

main "$@"
