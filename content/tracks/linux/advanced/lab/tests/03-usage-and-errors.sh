mkdir -p u
: > u/app-2026-09-01.sql.gz
: > u/app-2026-09-02.sql.gz

# -h prints the usage on standard output and succeeds.
out=$(bash solution.sh -h 2>/dev/null)
status=$?
assert_eq "$status" "0" "-h exits with status 0"
assert_eq "$(printf '%s\n' "$out" | head -n 1)" \
  "Usage: rotate-backups [-n] [-k KEEP] [-d DAYS] [-r REPORT] -t YYYY-MM-DD DIR" \
  "-h prints the usage line from the instructions as the first line on standard output"

# check_usage_error DESCRIPTION ARGS...: the call must be rejected as misuse.
check_usage_error() {
  local what=$1 out status
  shift
  out=$(bash solution.sh "$@" 2> usage-err.txt)
  status=$?
  assert_eq "$status" "2" "$what: exit status for incorrect usage"
  assert_eq "$out" "" "$what: nothing is printed on standard output"
  grep -q '^Usage: rotate-backups ' usage-err.txt \
    || fail "$what: the usage message is printed on standard error"
}

check_usage_error "an unknown option" -x -t 2026-10-14 u
check_usage_error "-k given without its value" -t 2026-10-14 -k
check_usage_error "no -t option" u
check_usage_error "an impossible date for -t" -t 2026-02-30 u
check_usage_error "a -t date in the wrong format" -t 14/10/2026 u
check_usage_error "a KEEP that is not a number" -k two -t 2026-10-14 u
check_usage_error "a KEEP of 0" -k 0 -t 2026-10-14 u
check_usage_error "a negative DAYS" -d -1 -t 2026-10-14 u
check_usage_error "a DAYS that is not a whole number" -d 1.5 -t 2026-10-14 u
check_usage_error "no directory" -t 2026-10-14
check_usage_error "two directories" -t 2026-10-14 u u

# A directory that does not exist is a failure, not misuse.
out=$(bash solution.sh -t 2026-10-14 no-such-dir 2>/dev/null)
status=$?
assert_eq "$status" "1" "a directory that does not exist gives exit status 1"
assert_eq "$out" "" "a directory that does not exist prints nothing on standard output"

assert_eq "$(find u -type f | wc -l)" "2" "rejected calls must not delete anything"
