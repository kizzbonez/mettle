#!/usr/bin/env bash
# preflight: run every check script of the rig at once and report each result.
# Run as: bash solution.sh DIR
set -euo pipefail

pids=()    # process id of each check, in the order the checks were started
names=()   # name of each check (file name without .sh), in the same order

# on_term: the TERM handler. Send TERM to every check that is still running, print
# "preflight: interrupted" on standard error and exit with status 143.
on_term() {
  local pid
  for pid in "${pids[@]}"; do
    kill -s TERM "$pid" 2>/dev/null || true
  done
  printf 'preflight: interrupted\n' >&2
  exit 143
}

main() {
  local dir=$1 check name status passed=0 i

  trap on_term TERM

  shopt -s nullglob
  for check in "$dir"/*.sh; do
    bash "$check" &
    pids+=("$!")
    name=${check##*/}
    names+=("${name%.sh}")
  done

  for i in "${!pids[@]}"; do
    status=0
    wait "${pids[i]}" || status=$?
    if (( status == 0 )); then
      printf '%s ok\n' "${names[i]}"
      passed=$((passed + 1))
    elif (( status > 128 )); then
      printf '%s killed by %s\n' "${names[i]}" "$(kill -l "$status")"
    else
      printf '%s failed (status %s)\n' "${names[i]}" "$status"
    fi
  done

  printf '%s of %s checks passed\n' "$passed" "${#pids[@]}"
  exit $(( passed < ${#pids[@]} ))
}

main "$@"
