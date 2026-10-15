#!/usr/bin/env bash
# Usage: bash solution.sh POLICY CHECKS
# Tests a zone policy (first match wins, default deny) against the expected isolation.
set -u

policy=$1
checks=$2

# 1. The rules in evaluation order: no blank lines, comments or header, lower case,
#    sorted by seq as a number.
rules=$(grep -v -e '^#' -e '^[[:space:]]*$' "$policy" | tr '[:upper:]' '[:lower:]' \
  | grep -v '^seq,' | sort -t, -k1,1n)

# 2. decide FROM TO PROTO PORT prints "allow (rule 30)", "deny (rule 90)" or "deny (default)".
decide() {
  awk -F, -v f="$1" -v t="$2" -v pr="$3" -v p="$4" '
  function port_ok(spec,   r) {
    if (spec == "any") return 1
    if (split(spec, r, "-") == 2) return p + 0 >= r[1] + 0 && p + 0 <= r[2] + 0
    return p + 0 == spec + 0
  }
  ($2 == f || $2 == "any") && ($3 == t || $3 == "any") && ($4 == pr || $4 == "any") && port_ok($5) {
    print $6 " (rule " $1 ")"
    found = 1
    exit
  }
  END { if (!found) print "deny (default)" }
  ' <<< "$rules"
}

# 3. For each check: PASS or FAIL, the connection and the decision. Then the summary line,
#    and exit 1 if any check failed.
passed=0
failed=0
while read -r expect from to service; do
  case $expect in
    '' | '#'*) continue ;;
  esac
  result=$(decide "$from" "$to" "${service%/*}" "${service#*/}")
  if [ "${result%% *}" = "$expect" ]; then
    status=PASS
    passed=$(( passed + 1 ))
  else
    status=FAIL
    failed=$(( failed + 1 ))
  fi
  echo "$status $from $to $service $result"
done < "$checks"

echo "SUMMARY $passed passed, $failed failed"
[ "$failed" -eq 0 ]
